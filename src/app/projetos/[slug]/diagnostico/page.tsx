"use client";

import { useParams } from "next/navigation";
import { Diagnostico } from "@/components/projetos/diagnostico";

export default function Page() {
  return <Diagnostico slug={useParams<{ slug: string }>().slug} />;
}
