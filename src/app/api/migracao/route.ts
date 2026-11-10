import { NextResponse } from "next/server";
import { hojeBrasil } from "@/domain/demo";
import { atorDoPedido } from "@/lib/documentos/ler";
import { responder } from "@/lib/http/responder";
import { obterRepo } from "@/lib/persistencia/obter";

export const runtime = "nodejs";

export async function GET(pedido: Request) {
  const repo = await obterRepo();
  const ator = atorDoPedido(pedido);
  try {
    const linhas = await repo.linhas(hojeBrasil());
    const primeiro = linhas[0];
    if (!primeiro) return NextResponse.json({ restrita: true, manuais: [], inventario: 0, etapas: [], staging: [] });
    const projeto = await repo.projetoPorId(primeiro.id);
    if (!projeto) return NextResponse.json({ restrita: true, manuais: [], inventario: 0, etapas: [], staging: [] });
    const painel = await repo.lerSegunda(projeto.id, ator, hojeBrasil());
    return NextResponse.json(painel.migracao);
  } catch (erro) {
    return responder(erro);
  }
}
