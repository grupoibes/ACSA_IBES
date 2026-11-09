"use client";

import { useParams } from "next/navigation";
import { Workflow } from "@/components/projetos/workflow";

export default function Page() {
  return <Workflow slug={useParams<{ slug: string }>().slug} />;
}
