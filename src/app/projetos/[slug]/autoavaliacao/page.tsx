"use client";

import { useParams } from "next/navigation";
import { Autoavaliacao } from "@/components/projetos/autoavaliacao";

export default function Page() {
  return <Autoavaliacao slug={useParams<{ slug: string }>().slug} />;
}
