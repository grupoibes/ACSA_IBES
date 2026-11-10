"use client";

import { useParams } from "next/navigation";
import { Log } from "@/components/projetos/log";

export default function Page() {
  return <Log slug={useParams<{ slug: string }>().slug} />;
}
