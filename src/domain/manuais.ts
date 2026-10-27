/** Manual operacional das contagens. O mapeamento ME 2 1_05 não entra aqui. */
export const MANUAL_OPERACIONAL = "ME 5 1_07" as const;

/** Referência de estrutura do mapeamento. Proibido usar como denominador. */
export const MANUAL_REFERENCIA_ESTRUTURA = "ME 2 1_05" as const;

/** Quantidade citada no mapeamento. Não é total, nem mínimo, nem catálogo operacional. */
export const CONTAGEM_REFERENCIA_ESTRUTURA = 144;

export const PERFIS = [
  "admin_ibes",
  "responsavel_ibes",
  "avaliador_ibes",
  "gestor_instituicao",
  "profissional_instituicao",
] as const;

export type Perfil = (typeof PERFIS)[number];

export const PERFIS_INSTITUICAO = [
  "gestor_instituicao",
  "profissional_instituicao",
] as const satisfies readonly Perfil[];

export const PERFIS_ESTADO_TERMINAL = [
  "admin_ibes",
  "responsavel_ibes",
] as const satisfies readonly Perfil[];

export type Grupo = "I" | "II" | "III";

export type TipoAvaliacao = "certificacao" | "manutencao" | "recertificacao";

export type EstadoProjeto =
  | "rascunho"
  | "diagnostico"
  | "autoavaliacao"
  | "avaliacao"
  | "comite"
  | "certificado"
  | "recusado"
  | "abandonado";

export const ESTADOS_TERMINAIS = ["recusado", "abandonado"] as const satisfies readonly EstadoProjeto[];

export type Nivel = "avancado" | "otimo" | "excelente";

export type OrgaoComite = "ACSA" | "IBES";

/** Única origem admitida em 26/10. Outra origem exige decisão nova do IBES. */
export type OrigemNaoAplicavel = "diagnostico";

export interface Limiares {
  grupoIAvancado: number;
  grupoISuperior: number;
  grupoIIOtimo: number;
  grupoIIExcelente: number;
  grupoIIIExcelente: number;
}

/**
 * Limiares de concessão do programa de Unidades de Gestão Clínica anterior
 * à simplificação publicada no ME 5 1_08 (nesse, o Grupo III passou a 40%).
 * A contagem de padrões não mora aqui: vem das linhas do ME 5 1_07.
 */
export const LIMIARES_ME_5_1_07: Limiares = {
  grupoIAvancado: 70,
  grupoISuperior: 100,
  grupoIIOtimo: 40,
  grupoIIExcelente: 100,
  grupoIIIExcelente: 70,
};

/** Menor inteiro k tal que k/total >= percentual/100. Total 0 não exige cumprimento. */
export function minimoCumpridos(totalAplicavel: number, percentual: number): number {
  if (!Number.isInteger(totalAplicavel) || totalAplicavel < 0) {
    throw new Error("total aplicável inválido");
  }
  if (!Number.isInteger(percentual) || percentual < 0 || percentual > 100) {
    throw new Error("percentual inválido");
  }
  if (totalAplicavel === 0 || percentual === 0) return 0;
  if (percentual === 100) return totalAplicavel;
  return Math.floor((percentual * totalAplicavel + 99) / 100);
}

export function gruposNoEscopo(tipo: TipoAvaliacao): Grupo[] {
  if (tipo === "manutencao") return ["I", "II"];
  return ["I", "II", "III"];
}
