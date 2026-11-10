"use client";

import { useParams } from "next/navigation";
import { Relatorios } from "@/components/projetos/relatorios";

export default function Page() {
  return <Relatorios slug={useParams<{ slug: string }>().slug} />;
}
