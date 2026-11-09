import { NextResponse } from "next/server";
import { atorDoPedido } from "@/lib/documentos/ler";
import { responder } from "@/lib/http/responder";
import { obterPainel } from "@/lib/persistencia/acoesRodada";
import { obterRepo } from "@/lib/persistencia/obter";

export const runtime = "nodejs";

export async function GET(pedido: Request, contexto: { params: Promise<{ slug: string }> }) {
  const { slug } = await contexto.params;
  const ciclo = new URL(pedido.url).searchParams.get("ciclo") ?? undefined;
  try {
    const painel = await obterPainel(await obterRepo(), slug, atorDoPedido(pedido), ciclo);
    return NextResponse.json(painel);
  } catch (erro) {
    return responder(erro);
  }
}
