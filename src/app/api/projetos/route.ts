import { NextResponse } from "next/server";
import { hojeBrasil } from "@/domain/demo";
import { atorDoPedido } from "@/lib/documentos/ler";
import { responder } from "@/lib/http/responder";
import { obterRepo } from "@/lib/persistencia/obter";
import { criarProjeto, listarIndice } from "@/lib/persistencia/servico";
import type { EntradaCriacao } from "@/lib/persistencia/tipos";

export const runtime = "nodejs";

export async function GET(pedido: Request) {
  const repo = await obterRepo();
  const indice = await listarIndice(repo, atorDoPedido(pedido), hojeBrasil());
  return NextResponse.json(indice);
}

export async function POST(pedido: Request) {
  const repo = await obterRepo();
  const corpo = (await pedido.json()) as EntradaCriacao;
  try {
    const projeto = await criarProjeto(repo, corpo, atorDoPedido(pedido));
    return NextResponse.json({ modo: repo.modo, projeto }, { status: 201 });
  } catch (erro) {
    return responder(erro);
  }
}
