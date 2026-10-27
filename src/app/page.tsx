"use client";

import dynamic from "next/dynamic";

const AcsasApp = dynamic(() => import("@/components/acsas-app").then((modulo) => modulo.AcsasApp), {
  ssr: false,
});

export default function Home() {
  return <AcsasApp />;
}
