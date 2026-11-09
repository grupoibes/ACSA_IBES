import { NextResponse } from "next/server";
import { hojeBrasil } from "@/domain/demo";
import { atorDoPedido } from "@/lib/documentos/ler";
import { obterRepo } from "@/lib/persistencia/obter";
import { obterFicha } from "@/lib/persistencia/servico";

export const runtime = "nodejs";

export async function GET(pedido: Request, contexto: { params: Promise<{ slug: string }> }) {
  const { slug } = await contexto.params;
  const repo = await obterRepo();
  const ficha = await obterFicha(repo, slug, atorDoPedido(pedido));
  if (!ficha) return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });
  return NextResponse.json({ ...ficha, hoje: hojeBrasil(), modo: repo.modo });
}
