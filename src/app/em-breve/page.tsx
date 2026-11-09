"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Casco, nomeTela } from "@/components/casco/casco";

function Aviso() {
  const tela = useSearchParams().get("tela");
  return (
    <div className="sec">
      <h1>{nomeTela(tela)}</h1>
      <p className="note">Esta tela entra na próxima rodada.</p>
    </div>
  );
}

export default function Page() {
  return (
    <Casco>
      <Suspense>
        <Aviso />
      </Suspense>
    </Casco>
  );
}
