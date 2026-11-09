import type { Candidatura } from "@/domain/candidatura";
import type { PadraoCatalogo } from "@/domain/catalogo";
import type {
  DocumentoRegistro,
  LinhaAuditoria,
  OrigemCriacao,
  ProjetoRegistro,
  VersaoDocumento,
} from "@/domain/demo";
import type { LinhaIndice } from "@/domain/indice";
import type { MembroProjeto } from "@/domain/leituraDocumento";
import type { EtapaEvidencia } from "@/domain/evidencia";
import type {
  AcaoArea,
  AreaRegistro,
  DiagnosticoRegistro,
  EmailRegistro,
  EvidenciaRegistro,
  RespostaRegistro,
} from "@/domain/rodada";

export type Ator = { perfil: string; usuarioId: string | null };

export type EntradaCriacao = {
  codigo: string;
  instituicao: string;
  unidade: string;
  tipoUnidade: string | null;
  grupo: string | null;
  manualId: string;
  abertura: string;
  origem: OrigemCriacao;
  candidaturaId: string | null;
};

export type DadosRodada = {
  padroes: PadraoCatalogo[];
  diagnostico: DiagnosticoRegistro | null;
  naoAplicaveis: string[];
  respostas: RespostaRegistro[];
  evidencias: EvidenciaRegistro[];
  areas: AreaRegistro[];
  emails: EmailRegistro[];
  auditoria: LinhaAuditoria[];
  origem: { codigo: string; evidencias: { id: string; descricao: string; etapa: EtapaEvidencia }[] } | null;
};

export type Repo = {
  modo: "sessao" | "banco";
  codigosProjeto(): Promise<string[]>;
  codigosOcupados(): Promise<string[]>;
  linhas(hoje: string): Promise<LinhaIndice[]>;
  projetoPorSlug(slug: string): Promise<ProjetoRegistro | null>;
  projetoPorId(id: string): Promise<ProjetoRegistro | null>;
  inserirProjeto(registro: ProjetoRegistro, ator: Ator): Promise<string>;
  candidaturas(): Promise<Candidatura[]>;
  obterCandidatura(id: string): Promise<Candidatura | null>;
  salvarCandidatura(candidatura: Candidatura, ator: Ator): Promise<void>;
  membros(projetoId: string): Promise<MembroProjeto[]>;
  projetosDoUsuario(usuarioId: string | null): Promise<string[]>;
  documentos(projetoId: string): Promise<DocumentoRegistro[]>;
  hashes(projetoId: string): Promise<{ sha256: string; caminho: string }[]>;
  inserirDocumento(documento: DocumentoRegistro, ator: Ator): Promise<void>;
  acrescentarVersao(documentoId: string, versao: VersaoDocumento, ator: Ator): Promise<void>;
  reclassificar(documentoId: string, classificacao: string, ator: Ator): Promise<void>;
  auditoria(): Promise<LinhaAuditoria[]>;
  dadosRodada(projetoId: string): Promise<DadosRodada>;
  salvarDiagnostico(registro: DiagnosticoRegistro, ator: Ator): Promise<void>;
  definirNaoAplicavel(projetoId: string, padraoId: string, marcado: boolean, ator: Ator): Promise<void>;
  salvarResposta(resposta: RespostaRegistro, ator: Ator): Promise<void>;
  enviarEvidencia(evidencia: EvidenciaRegistro, ator: Ator): Promise<void>;
  vincularEvidencia(evidenciaId: string, documentoId: string, ator: Ator): Promise<void>;
  transitarEvidencia(evidenciaId: string, etapa: "conferida" | "chancelada", ator: Ator): Promise<void>;
  marcarCumpre(projetoId: string, padraoId: string, ciclo: RespostaRegistro["ciclo"], ator: Ator): Promise<void>;
  criarArea(area: AreaRegistro, ator: Ator): Promise<void>;
  transitarArea(areaId: string, acao: AcaoArea, ator: Ator): Promise<void>;
  avancarEtapa(projetoId: string, ator: Ator): Promise<void>;
  abrirComplementar(origemId: string, ator: Ator): Promise<string>;
};

export class ErroHttp extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
