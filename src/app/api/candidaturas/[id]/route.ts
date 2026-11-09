import { NextResponse } from "next/server";
import { atorDoPedido } from "@/lib/documentos/ler";
import { responder } from "@/lib/http/responder";
import { obterRepo } from "@/lib/persistencia/obter";
import { devolver, validar } from "@/lib/persistencia/servico";

export const runtime = "nodejs";

export async function POST(pedido: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params;
  const corpo = (await pedido.json()) as { acao?: string; motivo?: string };
  const repo = await obterRepo();
  const em = new Date().toISOString();
  try {
    const candidatura =
      corpo.acao === "devolver"
        ? await devolver(repo, id, corpo.motivo ?? "", atorDoPedido(pedido), em)
        : await validar(repo, id, atorDoPedido(pedido), em);
    return NextResponse.json({ modo: repo.modo, candidatura });
  } catch (erro) {
    return responder(erro);
  }
}
