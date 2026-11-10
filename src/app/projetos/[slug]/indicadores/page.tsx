"use client";

import { useParams } from "next/navigation";
import { Indicadores } from "@/components/projetos/indicadores";

export default function Page() {
  return <Indicadores slug={useParams<{ slug: string }>().slug} />;
}
