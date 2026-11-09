import type { PerfilTela } from "@/domain/demo";

export const CHAVE_ATOR = "acsas-ator";

export function lerAtor(): PerfilTela | null {
  if (typeof window === "undefined") return null;
  const bruto = sessionStorage.getItem(CHAVE_ATOR);
  if (!bruto) return null;
  return JSON.parse(bruto) as PerfilTela;
}

export function gravarAtor(ator: PerfilTela): void {
  sessionStorage.setItem(CHAVE_ATOR, JSON.stringify(ator));
}

export function sair(): void {
  sessionStorage.removeItem(CHAVE_ATOR);
}

export function cabecalhos(ator: PerfilTela, json = false): HeadersInit {
  return {
    "x-acsas-perfil": ator.canonico,
    "x-acsas-usuario": ator.usuarioId,
    ...(json ? { "content-type": "application/json" } : {}),
  };
}
