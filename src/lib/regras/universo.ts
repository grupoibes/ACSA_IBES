import type { Grupo } from "./nivel";

export type PadraoUniverso = {
  grupo: Grupo;
  obrigatorio: boolean;
  anexoId: string | null;
  naoSeAplicaManual: boolean;
  naoSeAplicaDiagnostico: boolean;
};

export function universoPadroes(padroes: PadraoUniverso[], anexosDoProjeto: readonly string[]): PadraoUniverso[] {
  const anexos = new Set(anexosDoProjeto);
  return padroes.filter((padrao) => {
    if (padrao.anexoId && !anexos.has(padrao.anexoId)) return false;
    if (padrao.naoSeAplicaManual) return false;
    if (padrao.naoSeAplicaDiagnostico) return false;
    return true;
  });
}

export function contagemPorGrupo(padroes: PadraoUniverso[]): Record<Grupo | "total", number> {
  const conta = { I: 0, II: 0, III: 0, total: padroes.length };
  for (const padrao of padroes) conta[padrao.grupo] += 1;
  return conta;
}

export function afirmarDiagnosticoPodeAlterar(padrao: { naoSeAplicaManual: boolean }): void {
  if (padrao.naoSeAplicaManual) {
    throw new Error("Padrão não se aplica no manual e não pode ser alterado no Diagnóstico.");
  }
}

export function faixa(opcoes: {
  grupo: Grupo;
  total: number;
  naoSeAplicaManual?: number;
  obrigatorios?: number;
  anexoId?: string | null;
}): PadraoUniverso[] {
  const na = opcoes.naoSeAplicaManual ?? 0;
  const obrigatorios = opcoes.obrigatorios ?? 0;
  return Array.from({ length: opcoes.total }, (_, indice) => ({
    grupo: opcoes.grupo,
    obrigatorio: indice < obrigatorios,
    anexoId: opcoes.anexoId ?? null,
    naoSeAplicaManual: indice >= opcoes.total - na,
    naoSeAplicaDiagnostico: false,
  }));
}
