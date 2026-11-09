import { NextResponse } from "next/server";
import { receberArquivo } from "@/lib/documentos/receber";
import { criarStorage } from "@/lib/documentos/storage";

export const runtime = "nodejs";

/** Biblioteca, evidência e diagnóstico passam por aqui. Sem credencial, o arquivo fica na memória do processo. */
export async function POST(pedido: Request) {
  const form = await pedido.formData();
  const arquivo = form.get("arquivo");
  const projetoId = String(form.get("projetoId") ?? "");
  const documentoId = String(form.get("documentoId") ?? "");
  const versao = Number(form.get("versao") ?? "1");
  if (!(arquivo instanceof File) || arquivo.size === 0 || !projetoId || !documentoId || !Number.isInteger(versao) || versao < 1) {
    return NextResponse.json({ erro: "Informe o projeto, o documento, a versão e o arquivo." }, { status: 400 });
  }
  const hashes = String(form.get("hashes") ?? "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((sha) => ({ sha256: sha, caminho: `projeto/${projetoId}/documentos/existente/v1/${sha}` }));
  try {
    const recebido = await receberArquivo({
      projetoId,
      documentoId,
      versao,
      nome: arquivo.name,
      bytes: new Uint8Array(await arquivo.arrayBuffer()),
      mime: arquivo.type || "application/octet-stream",
      historico: form.get("historico") === "1",
      jaNoProjeto: hashes,
      storage: criarStorage({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        chave: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }).port,
    });
    return NextResponse.json(recebido);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível receber o arquivo.";
    const status = mensagem.includes("25 MB") ? 413 : mensagem.includes("já está") ? 409 : 400;
    return NextResponse.json({ erro: mensagem }, { status });
  }
}
