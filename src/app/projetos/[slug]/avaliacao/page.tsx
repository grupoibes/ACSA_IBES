"use client";

import { useParams } from "next/navigation";
import { Avaliacao } from "@/components/projetos/avaliacao";

export default function Page() {
  return <Avaliacao slug={useParams<{ slug: string }>().slug} />;
}
