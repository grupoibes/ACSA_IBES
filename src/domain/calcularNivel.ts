import {
  CONTAGEM_REFERENCIA_ESTRUTURA,
  gruposNoEscopo,
  LIMIARES_ME_5_1_07,
  MANUAL_REFERENCIA_ESTRUTURA,
  minimoCumpridos,
  type Grupo,
  type Limiares,
  type Nivel,
  type TipoAvaliacao,
} from "@/domain/manuais";

export interface PadraoNoCalculo {
  id: string;
  grupo: Grupo;
  obrigatorio: boolean;
  imprescindivel: boolean;
  cumprido: boolean;
  naoAplicavel: boolean;
}

export interface EntradaNivel {
  manual: string;
  tipo: TipoAvaliacao;
  padroes: PadraoNoCalculo[];
  limiares?: Limiares;
}

export interface GateGrupo {
  nome: Nivel;
  percentual: number;
  minimoCumpridos: number;
  atingido: boolean;
}

export interface ResumoGrupo {
  grupo: Grupo;
  noEscopo: boolean;
  totalManual: number;
  excluidosNaoAplicaveis: number;
  totalAplicavel: number;
  cumpridos: number;
  percentual: number | null;
  minimoPercentual: number | null;
  minimoCumpridos: number | null;
  obrigatoriosAplicaveis: number;
  obrigatoriosCumpridos: number;
  imprescindiveisAplicaveis: number;
  imprescindiveisCumpridos: number;
  gates: GateGrupo[];
}

export interface ResultadoNivel {
  manual: string;
  tipo: TipoAvaliacao;
  nivel: Nivel | null;
  grupos: ResumoGrupo[];
  catalogoContado: number;
  referenciaEstruturaIgnorada: {
    manual: typeof MANUAL_REFERENCIA_ESTRUTURA;
    padroes: typeof CONTAGEM_REFERENCIA_ESTRUTURA;
  };
}

const ORDEM: Grupo[] = ["I", "II", "III"];

function resumir(
  grupo: Grupo,
  padroes: PadraoNoCalculo[],
  noEscopo: boolean,
  limiares: Limiares,
): ResumoGrupo {
  const doGrupo = padroes.filter((padrao) => padrao.grupo === grupo);
  const aplicaveis = doGrupo.filter((padrao) => !padrao.naoAplicavel);
  const cumpridos = aplicaveis.filter((padrao) => padrao.cumprido).length;
  const totalAplicavel = aplicaveis.length;
  const obrigatorios = aplicaveis.filter((padrao) => padrao.obrigatorio);
  const imprescindiveis = aplicaveis.filter((padrao) => padrao.imprescindivel);
  const minimoPercentual = noEscopo ? limiarPrincipal(grupo, limiares) : null;

  const gates = noEscopo
    ? gatesDoGrupo(grupo, limiares).map((gate) => {
        const minimo = minimoCumpridos(totalAplicavel, gate.percentual);
        return {
          nome: gate.nome,
          percentual: gate.percentual,
          minimoCumpridos: minimo,
          atingido: cumpridos >= minimo,
        };
      })
    : [];

  return {
    grupo,
    noEscopo,
    totalManual: doGrupo.length,
    excluidosNaoAplicaveis: doGrupo.length - totalAplicavel,
    totalAplicavel,
    cumpridos,
    percentual:
      totalAplicavel === 0 ? null : Math.round((cumpridos * 1000) / totalAplicavel) / 10,
    minimoPercentual,
    minimoCumpridos:
      minimoPercentual === null ? null : minimoCumpridos(totalAplicavel, minimoPercentual),
    obrigatoriosAplicaveis: obrigatorios.length,
    obrigatoriosCumpridos: obrigatorios.filter((padrao) => padrao.cumprido).length,
    imprescindiveisAplicaveis: imprescindiveis.length,
    imprescindiveisCumpridos: imprescindiveis.filter((padrao) => padrao.cumprido).length,
    gates,
  };
}

function limiarPrincipal(grupo: Grupo, limiares: Limiares): number {
  if (grupo === "I") return limiares.grupoIAvancado;
  if (grupo === "II") return limiares.grupoIIOtimo;
  return limiares.grupoIIIExcelente;
}

function gatesDoGrupo(grupo: Grupo, limiares: Limiares): Array<{ nome: Nivel; percentual: number }> {
  if (grupo === "I") {
    return [
      { nome: "avancado", percentual: limiares.grupoIAvancado },
      { nome: "otimo", percentual: limiares.grupoISuperior },
      { nome: "excelente", percentual: limiares.grupoISuperior },
    ];
  }
  if (grupo === "II") {
    return [
      { nome: "otimo", percentual: limiares.grupoIIOtimo },
      { nome: "excelente", percentual: limiares.grupoIIExcelente },
    ];
  }
  return [{ nome: "excelente", percentual: limiares.grupoIIIExcelente }];
}

function grupo(grupos: ResumoGrupo[], codigo: Grupo): ResumoGrupo {
  const encontrado = grupos.find((item) => item.grupo === codigo);
  if (!encontrado) throw new Error(`grupo ${codigo} ausente do resumo`);
  return encontrado;
}

function percentualAtingido(resumo: ResumoGrupo, nome: Nivel): boolean {
  const gate = resumo.gates.find((item) => item.nome === nome);
  return resumo.noEscopo && gate !== undefined && gate.atingido;
}

function obrigatoriosFechados(resumo: ResumoGrupo): boolean {
  return resumo.obrigatoriosCumpridos === resumo.obrigatoriosAplicaveis;
}

function imprescindiveisFechados(resumo: ResumoGrupo): boolean {
  return resumo.imprescindiveisCumpridos === resumo.imprescindiveisAplicaveis;
}

function conceder(grupos: ResumoGrupo[], tipo: TipoAvaliacao): Nivel | null {
  const primeiro = grupo(grupos, "I");
  const segundo = grupo(grupos, "II");
  const terceiro = grupo(grupos, "III");

  const avancado = percentualAtingido(primeiro, "avancado") && obrigatoriosFechados(primeiro);
  const otimo =
    percentualAtingido(primeiro, "otimo") &&
    percentualAtingido(segundo, "otimo") &&
    obrigatoriosFechados(primeiro) &&
    imprescindiveisFechados(segundo);
  const excelente =
    tipo !== "manutencao" &&
    percentualAtingido(primeiro, "excelente") &&
    percentualAtingido(segundo, "excelente") &&
    percentualAtingido(terceiro, "excelente") &&
    obrigatoriosFechados(primeiro) &&
    imprescindiveisFechados(segundo);

  if (excelente) return "excelente";
  if (otimo) return "otimo";
  if (avancado) return "avancado";
  return null;
}

/**
 * Nível a partir dos padrões aplicáveis do manual importado.
 * O 144 de ME 2 1_05 permanece referência de estrutura e não é denominador.
 * Padrão não aplicável sai do total e do mínimo de cada gate.
 * Manutenção não avalia o Grupo III, então não concede Excelente.
 */
export function calcularNivel(entrada: EntradaNivel): ResultadoNivel {
  const limiares = entrada.limiares ?? LIMIARES_ME_5_1_07;
  const escopo = new Set(gruposNoEscopo(entrada.tipo));
  const vistos = new Set<string>();

  for (const padrao of entrada.padroes) {
    if (vistos.has(padrao.id)) throw new Error(`padrão duplicado: ${padrao.id}`);
    vistos.add(padrao.id);
    if (padrao.obrigatorio && padrao.grupo !== "I") {
      throw new Error("obrigatório só existe no Grupo I");
    }
    if (padrao.imprescindivel && padrao.grupo !== "II") {
      throw new Error("imprescindível só existe no Grupo II");
    }
  }

  const grupos = ORDEM.map((codigo) =>
    resumir(codigo, entrada.padroes, escopo.has(codigo), limiares),
  );

  return {
    manual: entrada.manual,
    tipo: entrada.tipo,
    nivel: conceder(grupos, entrada.tipo),
    grupos,
    catalogoContado: entrada.padroes.length,
    referenciaEstruturaIgnorada: {
      manual: MANUAL_REFERENCIA_ESTRUTURA,
      padroes: CONTAGEM_REFERENCIA_ESTRUTURA,
    },
  };
}

/** Mínimo que o grupo teria se o não aplicável continuasse no denominador. */
export function minimoSeContasseExcluidos(resumo: ResumoGrupo): number | null {
  if (resumo.minimoPercentual === null) return null;
  return minimoCumpridos(resumo.totalManual, resumo.minimoPercentual);
}
