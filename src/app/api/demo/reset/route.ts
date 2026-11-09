import { NextResponse } from "next/server";
import { reiniciarStorageMemoria } from "@/lib/documentos/storage";
import { obterRepo } from "@/lib/persistencia/obter";
import { reiniciarEstadoGlobal } from "@/lib/persistencia/sessao";

export const runtime = "nodejs";

export async function POST() {
  const repo = await obterRepo();
  if (repo.modo !== "sessao") {
    return NextResponse.json({ erro: "O banco local não é reiniciado por esta rota." }, { status: 409 });
  }
  reiniciarEstadoGlobal();
  reiniciarStorageMemoria();
  return NextResponse.json({ modo: "sessao" });
}
