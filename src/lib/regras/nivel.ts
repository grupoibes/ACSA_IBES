/** Percentuais por manual. PENDÊNCIA 30: o manual operacional depois do contrato. */
export type Grupo = "I" | "II" | "III";
export type Nivel = "avancado" | "otimo" | "excelente";
export type TipoAvaliacao = "certificacao" | "manutencao" | "recertificacao";

export type RegraNivel = {
  nivel: Nivel;
  grupo: Grupo;
  percentual: number;
  exigeObrigatorios: boolean;
};

/** Tabela do Beta v0.3. O mínimo arredonda para cima. */
export const REGRAS_V03: RegraNivel[] = [
  { nivel: "avancado", grupo: "I", percentual: 70, exigeObrigatorios: true },
  { nivel: "avancado", grupo: "II", percentual: 0, exigeObrigatorios: false },
  { nivel: "avancado", grupo: "III", percentual: 0, exigeObrigatorios: false },
  { nivel: "otimo", grupo: "I", percentual: 100, exigeObrigatorios: true },
  { nivel: "otimo", grupo: "II", percentual: 40, exigeObrigatorios: false },
  { nivel: "otimo", grupo: "III", percentual: 0, exigeObrigatorios: false },
  { nivel: "excelente", grupo: "I", percentual: 100, exigeObrigatorios: true },
  { nivel: "excelente", grupo: "II", percentual: 100, exigeObrigatorios: false },
  { nivel: "excelente", grupo: "III", percentual: 40, exigeObrigatorios: false },
];

export type PadraoConta = {
  grupo: Grupo;
  obrigatorio: boolean;
  aplicavel: boolean;
  cumpre: boolean;
};

const ORDEM: Nivel[] = ["excelente", "otimo", "avancado"];

export function minimoCumpridos(total: number, percentual: number): number {
  if (total <= 0 || percentual <= 0) return 0;
  return Math.ceil((total * percentual) / 100);
}

/** Mesma formatação do protótipo: 139/142 vira 97,9%. */
export function percentualCumprido(cumpridos: number, aplicaveis: number): string {
  if (!aplicaveis) return "—";
  const valor = (cumpridos * 100) / aplicaveis;
  const umaCasa = Math.round(valor * 10) / 10;
  const texto = Number.isInteger(umaCasa) ? String(Math.round(valor)) : umaCasa.toFixed(1).replace(".", ",");
  return `${texto}%`;
}

export function gruposNoEscopo(tipo: TipoAvaliacao): Grupo[] {
  if (tipo === "manutencao") return ["I", "II"];
  return ["I", "II", "III"];
}

export function calcularNivel(
  padroes: PadraoConta[],
  regras: RegraNivel[] = REGRAS_V03,
  tipo: TipoAvaliacao = "certificacao",
): Nivel | null {
  const escopo = new Set(gruposNoEscopo(tipo));
  const aplicaveis = padroes.filter((padrao) => padrao.aplicavel);

  function doGrupo(grupo: Grupo) {
    return aplicaveis.filter((padrao) => padrao.grupo === grupo);
  }

  function atinge(nivel: Nivel) {
    const doNivel = regras.filter((regra) => regra.nivel === nivel);
    return doNivel.every((regra) => {
      if (!escopo.has(regra.grupo)) return regra.percentual <= 0;
      const grupo = doGrupo(regra.grupo);
      const cumpridos = grupo.filter((padrao) => padrao.cumpre).length;
      if (cumpridos < minimoCumpridos(grupo.length, regra.percentual)) return false;
      if (!regra.exigeObrigatorios) return true;
      const obrigatorios = grupo.filter((padrao) => padrao.obrigatorio);
      return obrigatorios.every((padrao) => padrao.cumpre);
    });
  }

  return ORDEM.find((nivel) => atinge(nivel)) ?? null;
}
