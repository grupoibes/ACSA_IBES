import { NextResponse } from "next/server";
import { ErroHttp } from "@/lib/persistencia/tipos";

export function responder(erro: unknown) {
  if (erro instanceof ErroHttp) return NextResponse.json({ erro: erro.message }, { status: erro.status });
  const message = erro instanceof Error ? erro.message : "Não foi possível concluir.";
  const status = /já existe|duplicate|unique/i.test(message) ? 409 : /somente|permiss|42501/i.test(message) ? 403 : 400;
  return NextResponse.json({ erro: message }, { status });
}
