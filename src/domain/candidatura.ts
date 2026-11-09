export const SITUACOES_CANDIDATURA = ["recebida", "validada", "devolvida", "convertida"] as const;

export type SituacaoCandidatura = (typeof SITUACOES_CANDIDATURA)[number];

export type Candidatura = {
  id: string;
  codigo: string;
  instituicao: string;
  situacao: SituacaoCandidatura;
  motivoDevolucao: string | null;
  avaliadaPor: string | null;
  avaliadaEm: string | null;
  projetoId: string | null;
  recebidaEm: string;
};

export const ROTULO_SITUACAO: Record<SituacaoCandidatura, string> = {
  recebida: "Aguardando validação",
  validada: "Validada",
  devolvida: "Devolvida para correção",
  convertida: "Projeto aberto",
};

function exigirRecebida(candidatura: Candidatura): void {
  if (candidatura.situacao !== "recebida") {
    throw new Error("Esta candidatura não está aguardando validação.");
  }
}

export function validarCandidatura(candidatura: Candidatura, ator: string, em: string): Candidatura {
  exigirRecebida(candidatura);
  return {
    ...candidatura,
    situacao: "validada",
    motivoDevolucao: null,
    avaliadaPor: ator,
    avaliadaEm: em,
    projetoId: null,
  };
}

/** Devolver sem motivo é recusado no domínio. O banco repete a mesma exigência. */
export function devolverCandidatura(candidatura: Candidatura, motivo: string, ator: string, em: string): Candidatura {
  exigirRecebida(candidatura);
  const texto = motivo.trim();
  if (!texto) throw new Error("Informe o motivo da devolução.");
  return {
    ...candidatura,
    situacao: "devolvida",
    motivoDevolucao: texto,
    avaliadaPor: ator,
    avaliadaEm: em,
    projetoId: null,
  };
}

export function converterCandidatura(candidatura: Candidatura, projetoId: string, ator: string, em: string): Candidatura {
  if (candidatura.situacao !== "validada") {
    throw new Error("Crie o projeto a partir da candidatura validada.");
  }
  if (!projetoId) throw new Error("Informe o projeto.");
  return {
    ...candidatura,
    situacao: "convertida",
    projetoId,
    avaliadaPor: candidatura.avaliadaPor ?? ator,
    avaliadaEm: candidatura.avaliadaEm ?? em,
  };
}
