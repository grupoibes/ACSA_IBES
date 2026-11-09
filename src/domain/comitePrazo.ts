function somarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  const y = data.getUTCFullYear();
  const m = String(data.getUTCMonth() + 1).padStart(2, "0");
  const d = String(data.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 30 dias a partir de avaliacoes.resultado_positivo_em. No dia do prazo a etapa ainda segue. */
export const PRAZO_COMITE_DIAS = 30;

export function prazoComite(
  resultadoPositivoEm: string | null,
  hoje: string,
): { prazo: string | null; vencido: boolean } {
  if (!resultadoPositivoEm) return { prazo: null, vencido: false };
  const prazo = somarDias(resultadoPositivoEm, PRAZO_COMITE_DIAS);
  return { prazo, vencido: hoje > prazo };
}
