import type { Candidatura } from "@/domain/candidatura";
import { situacaoDaLinha, type LinhaIndice } from "@/domain/indice";
import type { MembroProjeto } from "@/domain/leituraDocumento";
import { slugParaCodigo } from "@/domain/slug";
import { prazoAutoavaliacao } from "@/lib/regras/prazos";

export const ID_2025_009 = "a2025009-0009-4000-8000-000000000009";
export const ID_2023_014_C = "a2023014-014c-4000-8000-0000000000c1";
export const ID_ZERO = "a2026014-0014-4000-8000-000000000014";
export const MANUAL_ME5 = "11111111-1111-4111-8111-111111111111";

export const USUARIO_RESPONSAVEL = "66666666-6666-4666-8666-666666666663";
export const USUARIO_UPLOAD = "66666666-6666-4666-8666-666666666669";
export const USUARIO_OUTRO = "66666666-6666-4666-8666-666666666668";
export const USUARIO_CONFERENTE = "66666666-6666-4666-8666-66666666666a";
export const USUARIO_AUTORIZADOR = "66666666-6666-4666-8666-666666666667";
export const USUARIO_BACKOFFICE = "66666666-6666-4666-8666-666666666662";

export const CLASSES_DOCUMENTO = [
  "Procedimento",
  "Ata",
  "Registro de treinamento",
  "Relatório de auditoria",
  "Indicador",
  "Política",
  "Contrato",
] as const;

export const TIPOS_UNIDADE = [
  "Hospital geral",
  "Hospital especializado",
  "Clínica",
  "Centro de diagnóstico",
  "Policlínica",
  "Unidade de gestão clínica",
] as const;

export type OrigemCriacao = "zero" | "candidatura" | null;

export type ProjetoRegistro = {
  id: string;
  codigo: string;
  instituicao: string;
  unidade: string;
  tipoUnidade: string | null;
  grupo: string | null;
  manualId: string;
  manual: string;
  abertura: string;
  origem: OrigemCriacao;
  estado: "diagnostico" | "autoavaliacao" | "avaliacao" | "certificado";
  etapa: string;
  prazoEtapa: string;
  vencimento: string | null;
  abre: boolean;
  tipo: "inicial" | "complementar";
  origemCodigo: string | null;
  selo: string;
};

export type VersaoDocumento = {
  versao: number;
  caminho: string;
  sha256: string;
  tamanho: number;
  mime: string;
  nomeArquivo: string;
};

export type DocumentoRegistro = {
  id: string;
  projetoId: string;
  nome: string;
  classificacao: string;
  versoes: VersaoDocumento[];
};

export type LinhaAuditoria = { tipo: string; acao: "insert" | "update"; objeto: string };

export type EstadoDemo = {
  projetos: ProjetoRegistro[];
  candidaturas: Candidatura[];
  documentos: DocumentoRegistro[];
  auditoria: LinhaAuditoria[];
  membros: MembroProjeto[];
};

export type PerfilTela = {
  id: string;
  canonico: string;
  rotulo: string;
  grupo: "Cliente" | "IBES";
  usuarioId: string;
};

export const PERFIS_TELA: PerfilTela[] = [
  { id: "resp", canonico: "responsavel_projeto", rotulo: "Responsável do projeto", grupo: "Cliente", usuarioId: USUARIO_RESPONSAVEL },
  { id: "upload", canonico: "responsavel_upload", rotulo: "Responsável pelo upload", grupo: "Cliente", usuarioId: USUARIO_UPLOAD },
  { id: "conf", canonico: "conferente", rotulo: "Conferente", grupo: "Cliente", usuarioId: USUARIO_CONFERENTE },
  { id: "chan", canonico: "autorizador", rotulo: "Autorizador", grupo: "Cliente", usuarioId: USUARIO_AUTORIZADOR },
  { id: "back", canonico: "backoffice_ibes", rotulo: "Backoffice IBES", grupo: "IBES", usuarioId: USUARIO_BACKOFFICE },
  { id: "edu", canonico: "educador", rotulo: "Educador", grupo: "IBES", usuarioId: "66666666-6666-4666-8666-666666666671" },
  { id: "tutor", canonico: "tutor_relatorio", rotulo: "Tutor de relatório", grupo: "IBES", usuarioId: "66666666-6666-4666-8666-666666666672" },
  { id: "comite", canonico: "membro_comite", rotulo: "Membro do Comitê de Certificação", grupo: "IBES", usuarioId: "66666666-6666-4666-8666-666666666664" },
  { id: "lider", canonico: "avaliador_lider", rotulo: "Avaliador líder", grupo: "IBES", usuarioId: "66666666-6666-4666-8666-666666666673" },
  { id: "aval", canonico: "avaliador_ibes", rotulo: "Avaliador", grupo: "IBES", usuarioId: "66666666-6666-4666-8666-666666666661" },
  { id: "admin", canonico: "admin_ibes", rotulo: "Administrador IBES", grupo: "IBES", usuarioId: "66666666-6666-4666-8666-666666666674" },
];

export function hojeBrasil(data = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(data);
}

function projeto(parcial: ProjetoRegistro): ProjetoRegistro {
  return parcial;
}

export function projetosIniciais(): ProjetoRegistro[] {
  const aberturaModelo = "2026-04-09";
  const aberturaZero = "2026-11-01";
  const aberturaComplementar = "2026-10-15";
  return [
    projeto({
      id: ID_2025_009,
      codigo: "2025/009",
      instituicao: "Hospital Modelo de Demonstração",
      unidade: "Hospital geral",
      tipoUnidade: "Hospital geral",
      grupo: null,
      manualId: MANUAL_ME5,
      manual: "ME 5 1_07",
      abertura: aberturaModelo,
      origem: null,
      estado: "autoavaliacao",
      etapa: "Autoavaliação",
      prazoEtapa: prazoAutoavaliacao(aberturaModelo),
      vencimento: null,
      abre: true,
      tipo: "inicial",
      origemCodigo: null,
      selo: "—",
    }),
    projeto({
      id: ID_ZERO,
      codigo: "2026/014",
      instituicao: "Clínica Fictícia de Teste",
      unidade: "Ambulatório",
      tipoUnidade: "Clínica",
      grupo: null,
      manualId: MANUAL_ME5,
      manual: "ME 5 1_07",
      abertura: aberturaZero,
      origem: "zero",
      estado: "diagnostico",
      etapa: "Diagnóstico",
      prazoEtapa: prazoAutoavaliacao(aberturaZero),
      vencimento: null,
      abre: true,
      tipo: "inicial",
      origemCodigo: null,
      selo: "Criado do zero",
    }),
    projeto({
      id: "a2025006-0006-4000-8000-000000000006",
      codigo: "2025/006",
      instituicao: "Clínica Exemplo Norte",
      unidade: "Clínica",
      tipoUnidade: "Clínica",
      grupo: null,
      manualId: MANUAL_ME5,
      manual: "ME 5 1_07",
      abertura: "2024-06-15",
      origem: null,
      estado: "certificado",
      etapa: "Manutenção 1",
      prazoEtapa: "2027-05-30",
      vencimento: "2027-06-15",
      abre: false,
      tipo: "inicial",
      origemCodigo: null,
      selo: "ACSA (migrado)",
    }),
    projeto({
      id: "a2024011-0011-4000-8000-000000000011",
      codigo: "2024/011",
      instituicao: "Centro de Diagnóstico Fictício",
      unidade: "Diagnóstico",
      tipoUnidade: "Centro de diagnóstico",
      grupo: null,
      manualId: MANUAL_ME5,
      manual: "ME 28 1_01 + Imagem",
      abertura: "2023-12-10",
      origem: null,
      estado: "certificado",
      etapa: "Manutenção 2",
      prazoEtapa: "2026-12-10",
      vencimento: "2026-11-30",
      abre: false,
      tipo: "inicial",
      origemCodigo: null,
      selo: "ACSA (migrado)",
    }),
    projeto({
      id: "a2024003-0003-4000-8000-000000000003",
      codigo: "2024/003",
      instituicao: "Hospital Regional de Teste",
      unidade: "Hospital",
      tipoUnidade: "Hospital geral",
      grupo: null,
      manualId: MANUAL_ME5,
      manual: "ME 2 1_05",
      abertura: "2024-11-05",
      origem: null,
      estado: "avaliacao",
      etapa: "Avaliação",
      prazoEtapa: "2026-11-05",
      vencimento: null,
      abre: false,
      tipo: "inicial",
      origemCodigo: null,
      selo: "—",
    }),
    projeto({
      id: "a2023014-0014-4000-8000-000000000014",
      codigo: "2023/014",
      instituicao: "Policlínica Exemplo Sul",
      unidade: "Policlínica",
      tipoUnidade: "Policlínica",
      grupo: null,
      manualId: MANUAL_ME5,
      manual: "ME 5 1_07",
      abertura: "2021-10-15",
      origem: null,
      estado: "certificado",
      etapa: "Recertificação",
      prazoEtapa: "2026-10-15",
      vencimento: "2026-10-31",
      abre: false,
      tipo: "inicial",
      origemCodigo: null,
      selo: "ACSA (migrado)",
    }),
    projeto({
      id: ID_2023_014_C,
      codigo: "2023/014-C",
      instituicao: "Policlínica Exemplo Sul",
      unidade: "Policlínica",
      tipoUnidade: "Policlínica",
      grupo: null,
      manualId: MANUAL_ME5,
      manual: "ME 5 1_07",
      abertura: aberturaComplementar,
      origem: null,
      estado: "autoavaliacao",
      etapa: "Autoavaliação",
      prazoEtapa: prazoAutoavaliacao(aberturaComplementar),
      vencimento: null,
      abre: true,
      tipo: "complementar",
      origemCodigo: "2023/014",
      selo: "Complementar de 2023/014",
    }),
  ];
}

export function candidaturasIniciais(): Candidatura[] {
  return [
    {
      id: "b2026015-0015-4000-8000-000000000015",
      codigo: "2026/015",
      instituicao: "Clínica Exemplo Leste",
      situacao: "recebida",
      motivoDevolucao: null,
      avaliadaPor: null,
      avaliadaEm: null,
      projetoId: null,
      recebidaEm: "2026-10-20",
    },
    {
      id: "b2026016-0016-4000-8000-000000000016",
      codigo: "2026/016",
      instituicao: "Hospital Fictício do Vale",
      situacao: "recebida",
      motivoDevolucao: null,
      avaliadaPor: null,
      avaliadaEm: null,
      projetoId: null,
      recebidaEm: "2026-10-23",
    },
  ];
}

export function membrosIniciais(): MembroProjeto[] {
  const doModelo = [USUARIO_RESPONSAVEL, USUARIO_UPLOAD, USUARIO_CONFERENTE, USUARIO_AUTORIZADOR];
  return [
    ...doModelo.map((usuarioId) => ({ usuarioId, projetoId: ID_2025_009 })),
    { usuarioId: USUARIO_OUTRO, projetoId: ID_2023_014_C },
  ];
}

export function criarEstadoDemo(): EstadoDemo {
  return {
    projetos: projetosIniciais(),
    candidaturas: candidaturasIniciais(),
    documentos: [],
    auditoria: [],
    membros: membrosIniciais(),
  };
}

export function catalogoInicial(hoje: string): { projetos: ProjetoRegistro[]; candidaturas: Candidatura[]; linhas: LinhaIndice[] } {
  const projetos = projetosIniciais();
  return {
    projetos,
    candidaturas: candidaturasIniciais(),
    linhas: projetos.map((item) => linhaDoProjeto(item, hoje)),
  };
}

export function projetoPorSlug(projetos: readonly ProjetoRegistro[], slug: string): ProjetoRegistro | null {
  const codigo = slugParaCodigo(slug);
  if (!codigo) return null;
  const encontrado = projetos.find((item) => item.codigo === codigo);
  if (!encontrado?.abre) return null;
  return encontrado;
}

export function linhaDoProjeto(registro: ProjetoRegistro, hoje: string): LinhaIndice {
  return {
    id: registro.id,
    codigo: registro.codigo,
    cliente: registro.instituicao,
    manual: registro.manual,
    etapa: registro.etapa,
    prazoEtapa: registro.prazoEtapa,
    vencimento: registro.vencimento,
    selo: registro.selo,
    abre: registro.abre,
    ...situacaoDaLinha(hoje, registro.prazoEtapa, registro.vencimento),
  };
}
