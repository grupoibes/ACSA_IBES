import { NextResponse } from "next/server";
import { cicloValido, type AcaoArea } from "@/domain/rodada";
import { atorDoPedido } from "@/lib/documentos/ler";
import { responder } from "@/lib/http/responder";
import {
  abrirComplementar,
  avancarEtapa,
  criarArea,
  definirNaoAplicavel,
  enviarEvidencia,
  marcarCumpre,
  salvarResposta,
  transitarArea,
  transitarEvidencia,
  vincularEvidencia,
} from "@/lib/persistencia/acoesRodada";
import { obterRepo } from "@/lib/persistencia/obter";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

type Corpo = {
  tipo?: string;
  padraoId?: string;
  marcado?: boolean;
  ciclo?: string;
  atende?: boolean | null;
  texto?: string;
  descricao?: string;
  evidenciaId?: string;
  documentoId?: string;
  etapa?: "conferida" | "chancelada";
  areaId?: string;
  acao?: AcaoArea;
};

export async function POST(pedido: Request, contexto: { params: Promise<{ slug: string }> }) {
  const { slug } = await contexto.params;
  const repo = await obterRepo();
  const ator = atorDoPedido(pedido);
  const corpo = (await pedido.json()) as Corpo;
  const extra: Record<string, string> = {};
  try {
    switch (corpo.tipo) {
      case "nao-aplicavel":
        if (!corpo.padraoId || typeof corpo.marcado !== "boolean") {
          return NextResponse.json({ erro: "Informe o padrão." }, { status: 400 });
        }
        await definirNaoAplicavel(repo, slug, corpo.padraoId, corpo.marcado, ator);
        break;
      case "resposta":
        if (!corpo.padraoId || !corpo.ciclo) return NextResponse.json({ erro: "Informe o padrão e o ciclo." }, { status: 400 });
        await salvarResposta(
          repo,
          slug,
          { padraoId: corpo.padraoId, ciclo: corpo.ciclo, atende: corpo.atende ?? null, texto: corpo.texto ?? "" },
          ator,
        );
        break;
      case "evidencia": {
        if (!corpo.padraoId || !corpo.descricao?.trim()) {
          return NextResponse.json({ erro: "A evidência descreve o fato." }, { status: 400 });
        }
        const evidenciaId = randomUUID();
        await enviarEvidencia(
          repo,
          slug,
          { id: evidenciaId, padraoId: corpo.padraoId, descricao: corpo.descricao, documentoIds: [] },
          ator,
        );
        if (corpo.documentoId) await vincularEvidencia(repo, slug, evidenciaId, corpo.documentoId, ator);
        extra.evidenciaId = evidenciaId;
        break;
      }
      case "vincular":
        if (!corpo.evidenciaId || !corpo.documentoId) {
          return NextResponse.json({ erro: "Informe a evidência e o documento." }, { status: 400 });
        }
        await vincularEvidencia(repo, slug, corpo.evidenciaId, corpo.documentoId, ator);
        break;
      case "transitar-evidencia":
        if (!corpo.evidenciaId || (corpo.etapa !== "conferida" && corpo.etapa !== "chancelada")) {
          return NextResponse.json({ erro: "Informe a evidência e a etapa." }, { status: 400 });
        }
        await transitarEvidencia(repo, slug, corpo.evidenciaId, corpo.etapa, ator);
        break;
      case "cumpre":
        if (!corpo.padraoId || !corpo.ciclo || !cicloValido(corpo.ciclo)) {
          return NextResponse.json({ erro: "Informe o padrão e o ciclo." }, { status: 400 });
        }
        await marcarCumpre(repo, slug, corpo.padraoId, corpo.ciclo, ator);
        break;
      case "area":
        if (!corpo.padraoId || !corpo.texto?.trim()) {
          return NextResponse.json({ erro: "Descreva a área de melhoria." }, { status: 400 });
        }
        await criarArea(repo, slug, corpo.texto, corpo.padraoId, ator);
        break;
      case "transitar-area":
        if (!corpo.areaId || !corpo.acao) return NextResponse.json({ erro: "Informe a área e a ação." }, { status: 400 });
        await transitarArea(repo, slug, corpo.areaId, corpo.acao, ator);
        break;
      case "avancar":
        await avancarEtapa(repo, slug, ator);
        break;
      case "complementar":
        await abrirComplementar(repo, slug, ator);
        break;
      default:
        return NextResponse.json({ erro: "Ação desconhecida." }, { status: 400 });
    }
    return NextResponse.json({ modo: repo.modo, ...extra });
  } catch (erro) {
    return responder(erro);
  }
}
