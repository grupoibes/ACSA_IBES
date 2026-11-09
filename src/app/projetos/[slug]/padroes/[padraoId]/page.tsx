"use client";

import { useParams, useSearchParams } from "next/navigation";
import { FichaPadrao } from "@/components/projetos/padrao";
import { cicloValido } from "@/domain/rodada";

export default function Page() {
  const { slug, padraoId } = useParams<{ slug: string; padraoId: string }>();
  const ciclo = useSearchParams().get("ciclo");
  return <FichaPadrao slug={slug} padraoId={padraoId} cicloInicial={ciclo && cicloValido(ciclo) ? ciclo : "inicial"} />;
}
