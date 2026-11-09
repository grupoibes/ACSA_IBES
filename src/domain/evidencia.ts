/** Etapa gravada. Não há devolução. */
export type EtapaEvidencia = "enviada" | "conferida" | "chancelada";

/**
 * Ausente: padrão aplicável sem nenhuma evidência anexada.
 * Pendente: evidência enviada ou conferida, ainda sem chancela.
 */
export type EstadoEvidencia = "ausente" | "pendente" | "chancelada";

/** Resultado gravado em resultados_padrao. Ausente não entra nesta lista. */
export type ResultadoPadrao = "cumpre" | "nao_cumpre" | "mantem" | "nao_mantem" | "pendente";

const RESULTADOS: readonly ResultadoPadrao[] = [
  "cumpre",
  "nao_cumpre",
  "mantem",
  "nao_mantem",
  "pendente",
];

export function resultadoGravado(valor: string): valor is ResultadoPadrao {
  return (RESULTADOS as readonly string[]).includes(valor);
}

export function estadoEvidencia(etapas: readonly EtapaEvidencia[]): EstadoEvidencia {
  if (etapas.length === 0) return "ausente";
  if (etapas.includes("chancelada")) return "chancelada";
  return "pendente";
}

/** mantem conta como cumpre. pendente, nao_cumpre e nao_mantem não contam. */
export function resultadoContaNoNumerador(resultado: ResultadoPadrao | null | undefined): boolean {
  return resultado === "cumpre" || resultado === "mantem";
}

/** Sem chancela, nem cumpre nem mantem entram no numerador. */
export function contaNoNumerador(
  resultado: ResultadoPadrao | null | undefined,
  etapas: readonly EtapaEvidencia[],
): boolean {
  return resultadoContaNoNumerador(resultado) && estadoEvidencia(etapas) === "chancelada";
}
