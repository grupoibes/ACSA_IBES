"use client";

import { useParams } from "next/navigation";
import { ListaPadroes } from "@/components/projetos/padrao";

export default function Page() {
  return <ListaPadroes slug={useParams<{ slug: string }>().slug} />;
}
