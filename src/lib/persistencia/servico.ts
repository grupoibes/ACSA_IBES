import { randomUUID } from "node:crypto";
import {
  converterCandidatura,
  devolverCandidatura,
  validarCandidatura,
  type Candidatura,
} from "@/domain/candidatura";
import { MANUAL_ME5, type DocumentoRegistro, type ProjetoRegistro, type VersaoDocumento } from "@/domain/demo";
import { filtrarIndice, linhasVisiveis, type LinhaIndice } from "@/domain/indice";
import { podeLerDocumento, perfilCanonico } from "@/domain/leituraDocumento";
import { codigoRepetido, montarProjetoDoZero, podeCriarProjeto, sugerirCodigo } from "@/domain/projetoZero";
import { prazoAutoavaliacao } from "@/lib/regras/prazos";
import { ErroHttp, type Ator, type EntradaCriacao, type Repo } from "@/lib/persistencia/tipos";

export type IndiceResposta = {
  modo: "sessao" | "banco";
  podeCriar: boolean;
  sugerido: string;
  hoje: string;
  linhas: LinhaIndice[];
  candidaturas: Candidatura[];
};

function anoDaAbertura(abertura: string): number {
  return Number(abertura.slice(0, 4)) || 2026;
}

export async function listarIndice(repo: Repo, ator: Ator, hoje: string, busca = ""): Promise<IndiceResposta> {
  const perfil = perfilCanonico(ator.perfil);
  const linhas = linhasVisiveis(await repo.linhas(hoje), perfil, await repo.projetosDoUsuario(ator.usuarioId));
  return {
    modo: repo.modo,
    podeCriar: podeCriarProjeto(perfil),
    sugerido: sugerirCodigo(anoDaAbertura(hoje), await repo.codigosOcupados()),
    hoje,
    linhas: filtrarIndice(linhas, busca),
    candidaturas: await repo.candidaturas(),
  };
}

export async function obterFicha(repo: Repo, slug: string, ator: Ator) {
  const projeto = await repo.projetoPorSlug(slug);
  if (!projeto) return null;
  const membros = await repo.membros(projeto.id);
  if (!podeLerDocumento({ perfil: ator.perfil, usuarioId: ator.usuarioId, projetoId: projeto.id, membros })) return null;
  return { projeto, documentos: await repo.documentos(projeto.id) };
}

export async function criarProjeto(repo: Repo, entrada: EntradaCriacao, ator: Ator): Promise<ProjetoRegistro> {
  const perfil = perfilCanonico(ator.perfil);
  if (!podeCriarProjeto(perfil)) {
    throw new ErroHttp("Somente administrador e backoffice criam projeto.", 403);
  }
  if (codigoRepetido(entrada.codigo, await repo.codigosProjeto())) {
    throw new ErroHttp(`O código ${entrada.codigo} já existe no índice de projetos.`, 409);
  }
  let candidatura: Candidatura | null = null;
  if (entrada.candidaturaId) {
    candidatura = await repo.obterCandidatura(entrada.candidaturaId);
    if (!candidatura) throw new ErroHttp("Candidatura não encontrada.", 404);
    if (candidatura.situacao !== "validada") {
      throw new ErroHttp("Crie o projeto a partir da candidatura validada.", 400);
    }
  }
  const montado = montarProjetoDoZero({
    codigo: entrada.codigo,
    instituicao: entrada.instituicao,
    unidade: entrada.unidade,
    tipoUnidade: entrada.tipoUnidade,
    grupo: entrada.grupo,
    manualId: entrada.manualId || MANUAL_ME5,
    abertura: entrada.abertura,
    origem: candidatura ? "candidatura" : "zero",
  });
  const registro: ProjetoRegistro = {
    id: randomUUID(),
    codigo: montado.codigo,
    instituicao: montado.instituicao,
    unidade: montado.unidade,
    tipoUnidade: montado.tipoUnidade,
    grupo: montado.grupo,
    manualId: montado.manualId,
    manual: "ME 5 1_07",
    abertura: montado.abertura,
    origem: montado.origem,
    estado: "diagnostico",
    etapa: "Diagnóstico",
    etapaFluxo: "diagnostico",
    ciclo: "inicial",
    prazoEtapa: prazoAutoavaliacao(montado.abertura),
    vencimento: null,
    abre: true,
    tipo: "inicial",
    origemCodigo: null,
    origemId: null,
    selo: "Criado do zero",
  };
  registro.id = await repo.inserirProjeto(registro, ator);
  if (candidatura) {
    const em = new Date().toISOString();
    await repo.salvarCandidatura(converterCandidatura(candidatura, registro.id, ator.usuarioId ?? perfil, em), ator);
  }
  return registro;
}

async function candidaturaRecebida(repo: Repo, id: string): Promise<Candidatura> {
  const candidatura = await repo.obterCandidatura(id);
  if (!candidatura) throw new ErroHttp("Candidatura não encontrada.", 404);
  return candidatura;
}

function exigirAvaliador(ator: Ator): string {
  const perfil = perfilCanonico(ator.perfil);
  if (!podeCriarProjeto(perfil)) {
    throw new ErroHttp("Somente administrador e backoffice tratam candidatura.", 403);
  }
  return perfil;
}

export async function validar(repo: Repo, id: string, ator: Ator, em: string): Promise<Candidatura> {
  const perfil = exigirAvaliador(ator);
  const atual = await candidaturaRecebida(repo, id);
  const proxima = validarCandidatura(atual, ator.usuarioId ?? perfil, em);
  await repo.salvarCandidatura(proxima, ator);
  return proxima;
}

export async function devolver(repo: Repo, id: string, motivo: string, ator: Ator, em: string): Promise<Candidatura> {
  const perfil = exigirAvaliador(ator);
  const atual = await candidaturaRecebida(repo, id);
  const proxima = devolverCandidatura(atual, motivo, ator.usuarioId ?? perfil, em);
  await repo.salvarCandidatura(proxima, ator);
  return proxima;
}

export async function registrarArquivo(
  repo: Repo,
  entrada: { projetoId: string; documentoId: string; novo: boolean; classificacao: string; versao: VersaoDocumento },
  ator: Ator,
): Promise<DocumentoRegistro> {
  if (!entrada.novo) {
    await repo.acrescentarVersao(entrada.documentoId, entrada.versao, ator);
    const lista = await repo.documentos(entrada.projetoId);
    const documento = lista.find((item) => item.id === entrada.documentoId);
    if (!documento) throw new ErroHttp("Documento não encontrado.", 404);
    return documento;
  }
  const documento: DocumentoRegistro = {
    id: entrada.documentoId,
    projetoId: entrada.projetoId,
    nome: entrada.versao.nomeArquivo.replace(/\.[^.]+$/, "") || entrada.versao.nomeArquivo,
    classificacao: entrada.classificacao,
    versoes: [entrada.versao],
  };
  await repo.inserirDocumento(documento, ator);
  return documento;
}

export async function reclassificar(repo: Repo, documentoId: string, classificacao: string, ator: Ator): Promise<void> {
  if (!classificacao.trim()) throw new ErroHttp("Informe a classificação.", 400);
  await repo.reclassificar(documentoId, classificacao.trim(), ator);
}
