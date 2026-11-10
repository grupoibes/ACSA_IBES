import { NextResponse } from "next/server";
import { hojeBrasil } from "@/domain/demo";
import { podeLerDocumento } from "@/domain/leituraDocumento";
import { atorDoPedido } from "@/lib/documentos/ler";
import { responder } from "@/lib/http/responder";
import { obterRepo } from "@/lib/persistencia/obter";
import type { ComandoSegunda } from "@/lib/persistencia/segundaMemoria";
import { ErroHttp } from "@/lib/persistencia/tipos";

export const runtime = "nodejs";

async function projeto(repo: Awaited<ReturnType<typeof obterRepo>>, slug: string, perfil: string, usuarioId: string) {
  const encontrado = await repo.projetoPorSlug(slug);
  if (!encontrado) throw new ErroHttp("Projeto não encontrado.", 404);
  const membros = await repo.membros(encontrado.id);
  if (!podeLerDocumento({ perfil, usuarioId, projetoId: encontrado.id, membros })) {
    throw new ErroHttp("Acesso negado a este projeto.", 403);
  }
  return encontrado;
}

export async function GET(pedido: Request, contexto: { params: Promise<{ slug: string }> }) {
  const { slug } = await contexto.params;
  const repo = await obterRepo();
  const ator = atorDoPedido(pedido);
  try {
    const atual = await projeto(repo, slug, ator.perfil, ator.usuarioId ?? "");
    return NextResponse.json(await repo.lerSegunda(atual.id, ator, hojeBrasil()));
  } catch (erro) {
    return responder(erro);
  }
}

export async function POST(pedido: Request, contexto: { params: Promise<{ slug: string }> }) {
  const { slug } = await contexto.params;
  const repo = await obterRepo();
  const ator = atorDoPedido(pedido);
  try {
    const atual = await projeto(repo, slug, ator.perfil, ator.usuarioId ?? "");
    const comando = (await pedido.json()) as ComandoSegunda;
    const aviso = await repo.aplicarSegunda(atual.id, { ...comando, hoje: hojeBrasil() }, ator);
    return NextResponse.json({ aviso });
  } catch (erro) {
    return responder(erro);
  }
}
