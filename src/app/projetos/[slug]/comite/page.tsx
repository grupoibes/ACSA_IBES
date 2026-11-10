"use client";

import { useParams } from "next/navigation";
import { Comite } from "@/components/projetos/comite";

export default function Page() {
  return <Comite slug={useParams<{ slug: string }>().slug} />;
}
