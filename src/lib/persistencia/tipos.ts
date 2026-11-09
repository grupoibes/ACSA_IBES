import type { Candidatura } from "@/domain/candidatura";
import type {
  DocumentoRegistro,
  LinhaAuditoria,
  OrigemCriacao,
  ProjetoRegistro,
  VersaoDocumento,
} from "@/domain/demo";
import type { LinhaIndice } from "@/domain/indice";
import type { MembroProjeto } from "@/domain/leituraDocumento";

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
};

export class ErroHttp extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
