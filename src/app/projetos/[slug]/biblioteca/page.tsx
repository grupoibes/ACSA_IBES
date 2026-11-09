"use client";

import { useParams } from "next/navigation";
import { Biblioteca } from "@/components/projetos/biblioteca";

export default function Page() {
  return <Biblioteca slug={useParams<{ slug: string }>().slug} />;
}
