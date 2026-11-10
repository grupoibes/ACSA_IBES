"use client";

import { useParams } from "next/navigation";
import { Perfis } from "@/components/projetos/perfis";

export default function Page() {
  return <Perfis slug={useParams<{ slug: string }>().slug} />;
}
