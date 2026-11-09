import { NextResponse } from "next/server";
import { podeEnviarBiblioteca, podeLerDocumento } from "@/domain/leituraDocumento";
import { responderLeitura, atorDoPedido } from "@/lib/documentos/ler";
import { receberArquivo } from "@/lib/documentos/receber";
import { criarStorage } from "@/lib/documentos/storage";
import { responder } from "@/lib/http/responder";
import { obterRepo } from "@/lib/persistencia/obter";
import { reclassificar, registrarArquivo } from "@/lib/persistencia/servico";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function GET(pedido: Request) {
  const repo = await obterRepo();
  const storage = criarStorage({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    chave: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  return responderLeitura(pedido, {
    autorizar: async (projetoId, perfil, usuarioId) =>
      podeLerDocumento({ perfil, usuarioId, projetoId, membros: await repo.membros(projetoId) }),
    ler: (caminho) => storage.port.get(caminho),
  });
}

export async function POST(pedido: Request) {
  const repo = await obterRepo();
  const ator = atorDoPedido(pedido);
  const form = await pedido.formData();
  const arquivo = form.get("arquivo");
  const projetoId = String(form.get("projetoId") ?? "");
  const documentoInformado = String(form.get("documentoId") ?? "");
  const classificacao = String(form.get("classificacao") ?? "Procedimento");
  const versao = Number(form.get("versao") ?? "1");
  if (!(arquivo instanceof File) || !projetoId || !Number.isInteger(versao) || versao < 1) {
    return NextResponse.json({ erro: "Informe o projeto, a versão e o arquivo." }, { status: 400 });
  }
  if (!podeEnviarBiblioteca(ator.perfil)) {
    return NextResponse.json({ erro: "Somente o Responsável do projeto e o Responsável pelo upload enviam arquivos." }, { status: 403 });
  }
  const membros = await repo.membros(projetoId);
  if (!podeLerDocumento({ perfil: ator.perfil, usuarioId: ator.usuarioId, projetoId, membros })) {
    return NextResponse.json({ erro: "Acesso negado a este projeto." }, { status: 403 });
  }
  const documentoId = documentoInformado || randomUUID();
  try {
    const recebido = await receberArquivo({
      projetoId,
      documentoId,
      versao,
      nome: arquivo.name,
      bytes: new Uint8Array(await arquivo.arrayBuffer()),
      mime: arquivo.type || "application/octet-stream",
      historico: false,
      jaNoProjeto: await repo.hashes(projetoId),
      storage: criarStorage({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        chave: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }).port,
    });
    const documento = await registrarArquivo(
      repo,
      {
        projetoId,
        documentoId,
        novo: !documentoInformado,
        classificacao,
        versao: {
          versao,
          caminho: recebido.caminho,
          sha256: recebido.sha256,
          tamanho: arquivo.size,
          mime: arquivo.type || "application/octet-stream",
          nomeArquivo: arquivo.name,
        },
      },
      ator,
    );
    return NextResponse.json({ ...recebido, documentoId: documento.id, modo: repo.modo });
  } catch (erro) {
    return responder(erro);
  }
}

export async function PATCH(pedido: Request) {
  const repo = await obterRepo();
  const ator = atorDoPedido(pedido);
  const corpo = (await pedido.json()) as { documentoId?: string; projetoId?: string; classificacao?: string };
  if (!corpo.documentoId || !corpo.projetoId || !corpo.classificacao) {
    return NextResponse.json({ erro: "Informe o documento, o projeto e a classificação." }, { status: 400 });
  }
  if (!podeEnviarBiblioteca(ator.perfil)) {
    return NextResponse.json({ erro: "Somente o Responsável do projeto e o Responsável pelo upload reclassificam." }, { status: 403 });
  }
  const membros = await repo.membros(corpo.projetoId);
  if (!podeLerDocumento({ perfil: ator.perfil, usuarioId: ator.usuarioId, projetoId: corpo.projetoId, membros })) {
    return NextResponse.json({ erro: "Acesso negado a este projeto." }, { status: 403 });
  }
  const documentos = await repo.documentos(corpo.projetoId);
  if (!documentos.some((item) => item.id === corpo.documentoId)) {
    return NextResponse.json({ erro: "Documento não encontrado." }, { status: 404 });
  }
  try {
    await reclassificar(repo, corpo.documentoId, corpo.classificacao, ator);
    return NextResponse.json({ modo: repo.modo });
  } catch (erro) {
    return responder(erro);
  }
}
