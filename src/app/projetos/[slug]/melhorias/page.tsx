"use client";

import { useParams } from "next/navigation";
import { Melhorias } from "@/components/projetos/melhorias";

export default function Page() {
  return <Melhorias slug={useParams<{ slug: string }>().slug} />;
}
