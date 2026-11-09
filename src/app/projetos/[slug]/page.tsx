"use client";

import { useParams } from "next/navigation";
import { Ficha } from "@/components/projetos/ficha";

export default function Page() {
  const params = useParams<{ slug: string }>();
  return <Ficha slug={params.slug} />;
}
