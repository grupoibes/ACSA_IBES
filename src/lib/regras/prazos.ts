/** PENDÊNCIA 21: a unidade destes números (dia ou mês) não foi fechada. Ficam só como configuração. */
export const PRAZOS_ETAPA = {
  diagnostico: 1,
  candidatura: 2,
  novaAvaliacaoAposNegativa: 6,
} as const;

function somarMeses(iso: string, meses: number): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0)).getUTCDate();
  const diaFinal = Math.min(dia, ultimoDia);
  const marcada = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), diaFinal));
  const y = marcada.getUTCFullYear();
  const m = String(marcada.getUTCMonth() + 1).padStart(2, "0");
  const d = String(marcada.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Janela única, contada da abertura: a unidade conclui a autoavaliação e solicita a auditoria. */
export function prazoAutoavaliacao(abertura: string): string {
  return somarMeses(abertura, 12);
}

export function prazoManutencao(certificacao: string): string {
  return somarMeses(certificacao, 30);
}

export function prazoRecertificacao(certificacao: string): string {
  return somarMeses(certificacao, 60);
}
