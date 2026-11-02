import ExcelJS from "exceljs";

export type LinhaPadrao = {
  manual: string;
  codigo: string;
  ambito: string;
  ambitoNome: string;
  criterio: string;
  criterioNome: string;
  anexo: string;
  grupo: "I" | "II" | "III";
  obrigatorio: boolean;
  titulo: string;
  finalidade: string;
  naoSeAplicaManual: boolean;
  codigoNoPdf: string;
};

export type LinhaElemento = {
  manual: string;
  codigoPadrao: string;
  ordem: number;
  idSistema: string;
  elementoAvaliavel: string;
};

export type LinhaRequisito = {
  manual: string;
  codigoPadrao: string;
  ordem: number;
  idSistema: string;
  requisitoAvaliacao: string;
  provas: { codigo: string; nome: string }[];
};

export type LinhaProva = {
  manual: string;
  codigoProva: string;
  prova: string;
};

export type PlanilhaManual = {
  padroes: LinhaPadrao[];
  elementos: LinhaElemento[];
  requisitos: LinhaRequisito[];
  provas: LinhaProva[];
};

export type ResumoManual = {
  padroes: number;
  elementos: number;
  requisitos: number;
  provas: number;
  naManual: number;
};

export type DivergenciaTotal = {
  criterio: string;
  informado: number;
  naPlanilha: number;
};

export class TotaisDivergentes extends Error {
  divergencias: DivergenciaTotal[];

  constructor(divergencias: DivergenciaTotal[]) {
    super("Os totais por critério não batem com o informado.");
    this.name = "TotaisDivergentes";
    this.divergencias = divergencias;
  }
}

type Transacao = {
  inserir(tabela: string, linha: Record<string, unknown>): void;
};

type Banco = {
  transaction<T>(fn: (tx: Transacao) => T): T;
};

function celula(valor: ExcelJS.CellValue): string {
  if (valor == null) return "";
  if (typeof valor === "object" && "text" in valor && valor.text != null) return String(valor.text).trim();
  if (typeof valor === "object" && "richText" in valor) {
    return valor.richText.map((parte) => parte.text).join("").trim();
  }
  return String(valor).trim();
}

function sim(valor: string): boolean {
  return valor.toLocaleLowerCase("pt-BR") === "sim";
}

function cabecalhos(planilha: ExcelJS.Worksheet): Map<string, number> {
  const mapa = new Map<string, number>();
  const linha = planilha.getRow(1);
  linha.eachCell((celulaAtual, coluna) => {
    mapa.set(celula(celulaAtual.value).toLocaleLowerCase("pt-BR"), coluna);
  });
  return mapa;
}

function ler(planilha: ExcelJS.Worksheet, nome: string, coluna: Map<string, number>, linha: ExcelJS.Row): string {
  const indice = coluna.get(nome);
  if (!indice) throw new Error(`A aba ${planilha.name} não tem a coluna ${nome}.`);
  return celula(linha.getCell(indice).value);
}

function linhasDe(planilha: ExcelJS.Worksheet | undefined, nome: string): ExcelJS.Row[] {
  if (!planilha) throw new Error(`A planilha não tem a aba ${nome}.`);
  const saida: ExcelJS.Row[] = [];
  planilha.eachRow((linha, numero) => {
    if (numero > 1) saida.push(linha);
  });
  return saida;
}

function provasDaLista(texto: string): { codigo: string; nome: string }[] {
  if (!texto.trim()) return [];
  return texto.split(";").map((parte) => {
    const pedaco = parte.trim();
    const espaco = pedaco.indexOf(" ");
    if (espaco < 0) return { codigo: pedaco, nome: pedaco };
    return { codigo: pedaco.slice(0, espaco), nome: pedaco.slice(espaco + 1).trim() };
  });
}

export async function lerPlanilha(arquivo: ArrayBuffer | Buffer): Promise<PlanilhaManual> {
  const livro = new ExcelJS.Workbook();
  await livro.xlsx.load(arquivo as unknown as ExcelJS.Buffer);
  const abaPadroes = livro.getWorksheet("Padroes");
  const abaElementos = livro.getWorksheet("Elementos");
  const abaRequisitos = livro.getWorksheet("Requisitos_avaliacao");
  const abaProvas = livro.getWorksheet("Provas");
  const colunasPadroes = cabecalhos(abaPadroes ?? livro.addWorksheet("vazia"));

  const padroes = linhasDe(abaPadroes, "Padroes").map((linha) => {
    const grupo = ler(abaPadroes!, "grupo", colunasPadroes, linha);
    if (grupo !== "I" && grupo !== "II" && grupo !== "III") {
      throw new Error(`Grupo inválido em ${ler(abaPadroes!, "codigo", colunasPadroes, linha)}.`);
    }
    return {
      manual: ler(abaPadroes!, "manual", colunasPadroes, linha),
      codigo: ler(abaPadroes!, "codigo", colunasPadroes, linha),
      ambito: ler(abaPadroes!, "ambito", colunasPadroes, linha),
      ambitoNome: ler(abaPadroes!, "ambito_nome", colunasPadroes, linha),
      criterio: ler(abaPadroes!, "criterio", colunasPadroes, linha),
      criterioNome: ler(abaPadroes!, "criterio_nome", colunasPadroes, linha),
      anexo: ler(abaPadroes!, "anexo", colunasPadroes, linha),
      grupo,
      obrigatorio: sim(ler(abaPadroes!, "obrigatorio", colunasPadroes, linha)),
      titulo: ler(abaPadroes!, "titulo", colunasPadroes, linha),
      finalidade: ler(abaPadroes!, "finalidade", colunasPadroes, linha),
      naoSeAplicaManual: sim(ler(abaPadroes!, "nao_se_aplica_manual", colunasPadroes, linha)),
      codigoNoPdf: ler(abaPadroes!, "codigo_no_pdf", colunasPadroes, linha),
    } satisfies LinhaPadrao;
  });

  const colunasElementos = cabecalhos(abaElementos!);
  const elementos = linhasDe(abaElementos, "Elementos").map((linha) => ({
    manual: ler(abaElementos!, "manual", colunasElementos, linha),
    codigoPadrao: ler(abaElementos!, "codigo_padrao", colunasElementos, linha),
    ordem: Number(ler(abaElementos!, "ordem", colunasElementos, linha)),
    idSistema: ler(abaElementos!, "id_sistema", colunasElementos, linha),
    elementoAvaliavel: ler(abaElementos!, "elemento_avaliavel", colunasElementos, linha),
  }));

  const colunasRequisitos = cabecalhos(abaRequisitos!);
  const requisitos = linhasDe(abaRequisitos, "Requisitos_avaliacao").map((linha) => ({
    manual: ler(abaRequisitos!, "manual", colunasRequisitos, linha),
    codigoPadrao: ler(abaRequisitos!, "codigo_padrao", colunasRequisitos, linha),
    ordem: Number(ler(abaRequisitos!, "ordem", colunasRequisitos, linha)),
    idSistema: ler(abaRequisitos!, "id_sistema", colunasRequisitos, linha),
    requisitoAvaliacao: ler(abaRequisitos!, "requisito_avaliacao", colunasRequisitos, linha),
    provas: provasDaLista(ler(abaRequisitos!, "provas", colunasRequisitos, linha)),
  }));

  const colunasProvas = cabecalhos(abaProvas!);
  const provas = linhasDe(abaProvas, "Provas").map((linha) => ({
    manual: ler(abaProvas!, "manual", colunasProvas, linha),
    codigoProva: ler(abaProvas!, "codigo_prova", colunasProvas, linha),
    prova: ler(abaProvas!, "prova", colunasProvas, linha),
  }));

  return { padroes, elementos, requisitos, provas };
}

export function resumir(planilha: PlanilhaManual): ResumoManual {
  return {
    padroes: planilha.padroes.length,
    elementos: planilha.elementos.length,
    requisitos: planilha.requisitos.length,
    provas: planilha.provas.length,
    naManual: planilha.padroes.filter((padrao) => padrao.naoSeAplicaManual).length,
  };
}

export function contagemPorCriterio(planilha: PlanilhaManual): { criterio: string; total: number }[] {
  const contagem = new Map<string, number>();
  for (const padrao of planilha.padroes) {
    contagem.set(padrao.criterio, (contagem.get(padrao.criterio) ?? 0) + 1);
  }
  return [...contagem.entries()].map(([criterio, total]) => ({ criterio, total }));
}

/** Linhas `01 2`. O usuário informa a contagem antes da gravação. */
export function lerTotaisInformados(texto: string): Record<string, number> {
  const informados: Record<string, number> = {};
  for (const linha of texto.split(/\r?\n/)) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#")) continue;
    const casado = limpa.match(/^(\S+)\s+(\d+)$/);
    if (!casado) throw new Error(`Linha de total inválida: ${limpa}`);
    informados[casado[1]] = Number(casado[2]);
  }
  return informados;
}

export function validarTotais(planilha: PlanilhaManual, informados: Record<string, number>): DivergenciaTotal[] {
  const contagem = new Map<string, number>();
  for (const padrao of planilha.padroes) {
    contagem.set(padrao.criterio, (contagem.get(padrao.criterio) ?? 0) + 1);
  }
  const criterios = new Set([...contagem.keys(), ...Object.keys(informados)]);
  const divergencias: DivergenciaTotal[] = [];
  for (const criterio of criterios) {
    const informado = informados[criterio] ?? 0;
    const naPlanilha = contagem.get(criterio) ?? 0;
    if (informado !== naPlanilha) divergencias.push({ criterio, informado, naPlanilha });
  }
  return divergencias;
}

export function importarManual(planilha: PlanilhaManual, informados: Record<string, number>, banco: Banco): ResumoManual {
  const divergencias = validarTotais(planilha, informados);
  if (divergencias.length > 0) throw new TotaisDivergentes(divergencias);
  return banco.transaction((tx) => {
    for (const padrao of planilha.padroes) tx.inserir("padroes", { ...padrao });
    for (const elemento of planilha.elementos) tx.inserir("elementos_avaliaveis", { ...elemento });
    for (const requisito of planilha.requisitos) tx.inserir("requisitos_avaliacao", { ...requisito });
    for (const prova of planilha.provas) tx.inserir("provas", { ...prova });
    return resumir(planilha);
  });
}

export async function planilhaFicticia(): Promise<Buffer> {
  const livro = new ExcelJS.Workbook();
  const padroes = livro.addWorksheet("Padroes");
  padroes.addRow([
    "manual",
    "codigo",
    "ambito",
    "ambito_nome",
    "criterio",
    "criterio_nome",
    "anexo",
    "grupo",
    "obrigatorio",
    "titulo",
    "finalidade",
    "nao_se_aplica_manual",
    "codigo_no_pdf",
  ]);
  padroes.addRow(["ME 0 0_00", "ES 0 01.01_00", "I", "Âmbito de demonstração", "01", "Critério de demonstração", "Núcleo", "I", "Sim", "Padrão fictício de acolhimento", "Texto fictício de finalidade.", "Não", "ES 0 01.01_00"]);
  padroes.addRow(["ME 0 0_00", "ES 0 01.02_00", "I", "Âmbito de demonstração", "01", "Critério de demonstração", "Núcleo", "I", "Não", "Padrão fictício fora do escopo do manual", "Texto fictício de finalidade.", "Sim", "ES 0 01.02_00"]);
  padroes.addRow(["ME 0 0_00", "ES 0 02.01_00", "II", "Âmbito de apoio", "02", "Apoio de demonstração", "Anexo de demonstração", "II", "Não", "Padrão fictício de anexo", "Texto fictício de finalidade.", "Não", "ES 0 02.01_00"]);

  const elementos = livro.addWorksheet("Elementos");
  elementos.addRow(["manual", "codigo_padrao", "ordem", "id_sistema", "elemento_avaliavel"]);
  elementos.addRow(["ME 0 0_00", "ES 0 01.01_00", 1, "9001", "Elemento fictício 1"]);
  elementos.addRow(["ME 0 0_00", "ES 0 01.02_00", 1, "9002", "Elemento fictício 2"]);
  elementos.addRow(["ME 0 0_00", "ES 0 02.01_00", 1, "9003", "Elemento fictício 3"]);

  const requisitos = livro.addWorksheet("Requisitos_avaliacao");
  requisitos.addRow(["manual", "codigo_padrao", "ordem", "id_sistema", "requisito_avaliacao", "provas"]);
  requisitos.addRow(["ME 0 0_00", "ES 0 01.01_00", 1, "8001", "Requisito fictício de verificação", "D1 Documentação de exemplo; V1 Visita de exemplo"]);
  requisitos.addRow(["ME 0 0_00", "ES 0 02.01_00", 1, "8002", "Requisito fictício sem prova", ""]);

  const provas = livro.addWorksheet("Provas");
  provas.addRow(["manual", "codigo_prova", "prova"]);
  provas.addRow(["ME 0 0_00", "D1", "Documentação de exemplo"]);
  provas.addRow(["ME 0 0_00", "V1", "Visita de exemplo"]);

  const saida = await livro.xlsx.writeBuffer();
  return Buffer.from(saida);
}
