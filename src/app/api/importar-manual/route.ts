import { NextResponse } from "next/server";
import {
  TotaisDivergentes,
  contagemPorCriterio,
  importarManual,
  lerPlanilha,
  lerTotaisInformados,
  planilhaFicticia,
  resumir,
  validarTotais,
} from "@/lib/importacao/manual";

export const runtime = "nodejs";

export async function GET() {
  const arquivo = await planilhaFicticia();
  return new NextResponse(new Uint8Array(arquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="manual-ficticio-me-0.xlsx"',
    },
  });
}

export async function POST(pedido: Request) {
  const form = await pedido.formData();
  const arquivo = form.get("arquivo");
  const acao = String(form.get("acao") ?? "resumo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ erro: "Escolha a planilha do manual." }, { status: 400 });
  }

  let informados: Record<string, number>;
  try {
    informados = lerTotaisInformados(String(form.get("totais") ?? ""));
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Totais inválidos.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }

  let planilha;
  try {
    planilha = await lerPlanilha(Buffer.from(await arquivo.arrayBuffer()));
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "A planilha não pôde ser lida.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }

  const resumo = resumir(planilha);
  const criterios = contagemPorCriterio(planilha);
  const divergencias = validarTotais(planilha, informados);

  if (acao !== "confirmar") {
    return NextResponse.json({ resumo, criterios, divergencias, confirmado: false });
  }

  try {
    const gravado = importarManual(planilha, informados, {
      transaction(fn) {
        return fn({ inserir() {} });
      },
    });
    return NextResponse.json({
      resumo: gravado,
      criterios,
      divergencias: [],
      confirmado: true,
      aviso:
        "Conferência concluída. Nesta homologação a confirmação não grava no Postgres: o resumo é o que entraria na transação.",
    });
  } catch (erro) {
    if (erro instanceof TotaisDivergentes) {
      return NextResponse.json(
        { resumo, criterios, divergencias: erro.divergencias, confirmado: false, erro: erro.message },
        { status: 422 },
      );
    }
    const mensagem = erro instanceof Error ? erro.message : "A importação não foi concluída.";
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
