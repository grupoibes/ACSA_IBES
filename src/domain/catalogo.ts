export type GrupoPadrao = "I" | "II" | "III";

export type PadraoCatalogo = {
  id: string;
  codigo: string;
  titulo: string;
  grupo: GrupoPadrao;
  criterio: string;
  obrigatorio: boolean;
  naoSeAplicaManual: boolean;
};

/** Texto de demonstração. Não é enunciado de manual. */
export const ELEMENTO_FICTICIO =
  "Elemento fictício de demonstração. O enunciado oficial do manual não entra nesta versão.";

const BLOCOS: { grupo: GrupoPadrao; quantidade: number; obrigatorios: number }[] = [
  { grupo: "I", quantidade: 65, obrigatorios: 41 },
  { grupo: "II", quantidade: 24, obrigatorios: 0 },
  { grupo: "III", quantidade: 12, obrigatorios: 0 },
];

export function idPadrao(ordem: number): string {
  return `f1000000-0000-4000-8000-${String(ordem).padStart(12, "0")}`;
}

/**
 * Núcleo fictício com a contagem publicada do ME 5 1_07:
 * 101 listados, 65/24/12 por grupo, 41 obrigatórios, 2 não se aplicam no manual (1 GII e 1 GIII).
 * O cálculo fica em 99. Não copia texto oficial.
 */
export function catalogoFicticio(): PadraoCatalogo[] {
  const itens: PadraoCatalogo[] = [];
  let ordem = 0;
  for (const bloco of BLOCOS) {
    for (let indice = 0; indice < bloco.quantidade; indice += 1) {
      ordem += 1;
      const criterio = String(((ordem - 1) % 11) + 1).padStart(2, "0");
      const sequencia = String(indice + 1).padStart(2, "0");
      const ultimoDoBloco = indice === bloco.quantidade - 1;
      itens.push({
        id: idPadrao(ordem),
        codigo: `PF ${bloco.grupo} ${criterio}.${sequencia}_00`,
        titulo: `Padrão fictício ${bloco.grupo} ${criterio}.${sequencia}`,
        grupo: bloco.grupo,
        criterio,
        obrigatorio: indice < bloco.obrigatorios,
        naoSeAplicaManual: bloco.grupo !== "I" && ultimoDoBloco,
      });
    }
  }
  return itens;
}

export function aplicaveis(padroes: readonly PadraoCatalogo[], naoAplicaveisDiagnostico: ReadonlySet<string>): PadraoCatalogo[] {
  return padroes.filter((padrao) => !padrao.naoSeAplicaManual && !naoAplicaveisDiagnostico.has(padrao.id));
}

export type ProvaFicticia = { codigo: string; nome: string };

export type RequisitoFicticio = {
  id: string;
  padraoId: string;
  ordem: number;
  texto: string;
  provas: ProvaFicticia[];
};

/** Provas de demonstração. O nome é o tipo da prova, não um enunciado de manual. */
export const PROVAS_FICTICIAS: readonly ProvaFicticia[] = [
  { codigo: "DOC", nome: "Documentação" },
  { codigo: "VIS", nome: "Visita" },
  { codigo: "ENT", nome: "Entrevista" },
];

/** Requisitos fictícios do primeiro padrão. Visíveis só para perfis do IBES. */
export function requisitosFicticios(): RequisitoFicticio[] {
  const padraoId = idPadrao(1);
  return [
    {
      id: "f3000001-0001-4000-8000-000000000001",
      padraoId,
      ordem: 1,
      texto: "Requisito fictício de demonstração, comprovado na visita.",
      provas: [PROVAS_FICTICIAS[0], PROVAS_FICTICIAS[1]],
    },
    {
      id: "f3000001-0001-4000-8000-000000000002",
      padraoId,
      ordem: 2,
      texto: "Requisito fictício de demonstração, comprovado em entrevista.",
      provas: [PROVAS_FICTICIAS[2]],
    },
  ];
}
