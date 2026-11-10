import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { podeDiagnosticar } from "@/domain/chancela";
import { podeLerDocumento } from "@/domain/leituraDocumento";
import { atorDoPedido } from "@/lib/documentos/ler";
import { receberArquivo } from "@/lib/documentos/receber";
import { criarStorage } from "@/lib/documentos/storage";
import { responder } from "@/lib/http/responder";
import { salvarDiagnostico } from "@/lib/persistencia/acoesRodada";
import { obterRepo } from "@/lib/persistencia/obter";
import { registrarArquivo } from "@/lib/persistencia/servico";

export const runtime = "nodejs";

export async function POST(pedido: Request, contexto: { params: Promise<{ slug: string }> }) {
  const { slug } = await contexto.params;
  const repo = await obterRepo();
  const ator = atorDoPedido(pedido);
  if (!podeDiagnosticar(ator.perfil)) {
    return NextResponse.json({ erro: "Somente backoffice e administrador registram o diagnóstico." }, { status: 403 });
  }
  const projeto = await repo.projetoPorSlug(slug);
  if (!projeto) return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });
  const membros = await repo.membros(projeto.id);
  if (!podeLerDocumento({ perfil: ator.perfil, usuarioId: ator.usuarioId, projetoId: projeto.id, membros })) {
    return NextResponse.json({ erro: "Acesso negado a este projeto." }, { status: 403 });
  }
  const form = await pedido.formData();
  const arquivo = form.get("arquivo");
  const avaliadorId = String(form.get("avaliadorId") ?? "");
  const realizadoEm = String(form.get("realizadoEm") ?? "");
  if (!(arquivo instanceof File) || !avaliadorId || !realizadoEm) {
    return NextResponse.json({ erro: "Informe o avaliador, a data e o relatório." }, { status: 400 });
  }
  const documentoId = randomUUID();
  try {
    const recebido = await receberArquivo({
      projetoId: projeto.id,
      documentoId,
      versao: 1,
      nome: arquivo.name,
      bytes: new Uint8Array(await arquivo.arrayBuffer()),
      mime: arquivo.type || "application/pdf",
      historico: false,
      jaNoProjeto: await repo.hashes(projeto.id),
      storage: criarStorage({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        chave: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }).port,
    });
    await registrarArquivo(
      repo,
      {
        projetoId: projeto.id,
        documentoId,
        novo: true,
        classificacao: "Relatório de auditoria",
        versao: {
          versao: 1,
          caminho: recebido.caminho,
          sha256: recebido.sha256,
          tamanho: arquivo.size,
          mime: arquivo.type || "application/pdf",
          nomeArquivo: arquivo.name,
        },
      },
      ator,
    );
    await salvarDiagnostico(
      repo,
      slug,
      { avaliadorId, realizadoEm, anexoNome: arquivo.name, anexoCaminho: recebido.caminho },
      ator,
    );
    return NextResponse.json({ caminho: recebido.caminho, modo: repo.modo });
  } catch (erro) {
    return responder(erro);
  }
}
