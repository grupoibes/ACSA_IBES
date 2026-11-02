export type ParecerComite = {
  voto: string;
};

export type BloqueioResolucao = "SEM_CONSENSO" | "PARECERES_INSUFICIENTES";

export type ResultadoResolucao =
  | { liberado: true; voto: string }
  | { liberado: false; motivo: BloqueioResolucao };

/**
 * O comitê decide por consenso: os 3 membros votam igual.
 * PENDÊNCIA 34: o que acontece quando não há consenso (nova rodada, desempate, troca de membro).
 */
export function podeResolver(pareceres: ParecerComite[]): ResultadoResolucao {
  if (pareceres.length < 3) {
    return { liberado: false, motivo: "PARECERES_INSUFICIENTES" };
  }
  const voto = pareceres[0]?.voto;
  if (voto && pareceres.every((parecer) => parecer.voto === voto)) {
    return { liberado: true, voto };
  }
  return { liberado: false, motivo: "SEM_CONSENSO" };
}

/** A justificativa continua obrigatória quando o nível final difere do calculado. */
export function exigeJustificativaNivel(nivelFinal: string | null, nivelCalculado: string | null): boolean {
  return nivelFinal !== nivelCalculado;
}
