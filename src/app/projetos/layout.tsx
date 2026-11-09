"use client";

import type { ReactNode } from "react";
import { Casco } from "@/components/casco/casco";

export default function Layout({ children }: { children: ReactNode }) {
  return <Casco>{children}</Casco>;
}
