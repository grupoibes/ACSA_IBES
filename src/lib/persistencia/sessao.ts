import type { Candidatura } from "@/domain/candidatura";
import {
  criarEstadoDemo,
  linhaDoProjeto,
  projetoPorSlug,
  type DocumentoRegistro,
  type EstadoDemo,
  type ProjetoRegistro,
  type VersaoDocumento,
} from "@/domain/demo";
import {
  abrirComplementarMemoria,
  avancarEtapaMemoria,
  criarAreaMemoria,
  dadosDoEstado,
  definirNaoAplicavelMemoria,
  enviarEvidenciaMemoria,
  marcarCumpreMemoria,
  salvarDiagnosticoMemoria,
  salvarRespostaMemoria,
  transitarAreaMemoria,
  transitarEvidenciaMemoria,
  vincularEvidenciaMemoria,
} from "@/lib/persistencia/rodadaMemoria";
import { aplicarSegundaMemoria, lerSegundaMemoria, visitaDoEstado } from "@/lib/persistencia/segundaMemoria";
import type { Repo } from "@/lib/persistencia/tipos";

const globalDemo = globalThis as unknown as { __acsasEstado?: EstadoDemo };

export function obterEstadoGlobal(): EstadoDemo {
  if (!globalDemo.__acsasEstado) globalDemo.__acsasEstado = criarEstadoDemo();
  return globalDemo.__acsasEstado;
}

export function reiniciarEstadoGlobal(): void {
  const atual = obterEstadoGlobal();
  const novo = criarEstadoDemo();
  atual.projetos.splice(0, atual.projetos.length, ...novo.projetos);
  atual.candidaturas.splice(0, atual.candidaturas.length, ...novo.candidaturas);
  atual.documentos.splice(0, atual.documentos.length, ...novo.documentos);
  atual.auditoria.splice(0, atual.auditoria.length, ...novo.auditoria);
  atual.membros.splice(0, atual.membros.length, ...novo.membros);
  atual.diagnosticos.splice(0, atual.diagnosticos.length, ...novo.diagnosticos);
  atual.naoAplicaveis.splice(0, atual.naoAplicaveis.length, ...novo.naoAplicaveis);
  atual.respostas.splice(0, atual.respostas.length, ...novo.respostas);
  atual.evidencias.splice(0, atual.evidencias.length, ...novo.evidencias);
  atual.areas.splice(0, atual.areas.length, ...novo.areas);
  atual.emails.splice(0, atual.emails.length, ...novo.emails);
  atual.avaliacoes.splice(0, atual.avaliacoes.length, ...novo.avaliacoes);
  atual.resultadosAvaliador.splice(0, atual.resultadosAvaliador.length, ...novo.resultadosAvaliador);
  atual.pontos.splice(0, atual.pontos.length, ...novo.pontos);
  atual.pareceres.splice(0, atual.pareceres.length, ...novo.pareceres);
  atual.resolucoes.splice(0, atual.resolucoes.length, ...novo.resolucoes);
  atual.upgrades.splice(0, atual.upgrades.length, ...novo.upgrades);
  atual.usuariosCliente.splice(0, atual.usuariosCliente.length, ...novo.usuariosCliente);
  atual.staging.splice(0, atual.staging.length, ...novo.staging);
  atual.semanasAntes = novo.semanasAntes;
  atual.semanasDepois = novo.semanasDepois;
  atual.limiteUsuarios = novo.limiteUsuarios;
}

export function criarRepoSessao(estado: EstadoDemo = criarEstadoDemo()): Repo {
  return {
    modo: "sessao",
    async codigosProjeto() {
      return estado.projetos.map((item) => item.codigo);
    },
    async codigosOcupados() {
      const abertas = estado.candidaturas.filter((item) => item.situacao !== "convertida").map((item) => item.codigo);
      return [...estado.projetos.map((item) => item.codigo), ...abertas];
    },
    async linhas(hoje) {
      return estado.projetos.map((item) => linhaDoProjeto(item, hoje));
    },
    async projetoPorSlug(slug) {
      return projetoPorSlug(estado.projetos, slug);
    },
    async projetoPorId(id) {
      return estado.projetos.find((item) => item.id === id) ?? null;
    },
    async inserirProjeto(registro: ProjetoRegistro) {
      estado.projetos.push(registro);
      estado.auditoria.unshift({ tipo: "projetos", acao: "insert", objeto: registro.id });
      return registro.id;
    },
    async candidaturas() {
      return estado.candidaturas.map((item) => ({ ...item }));
    },
    async obterCandidatura(id) {
      const candidatura = estado.candidaturas.find((item) => item.id === id);
      return candidatura ? { ...candidatura } : null;
    },
    async salvarCandidatura(candidatura: Candidatura) {
      const indice = estado.candidaturas.findIndex((item) => item.id === candidatura.id);
      if (indice < 0) throw new Error("Candidatura não encontrada.");
      estado.candidaturas[indice] = candidatura;
      estado.auditoria.unshift({ tipo: "candidaturas", acao: "update", objeto: candidatura.id });
    },
    async membros(projetoId) {
      return estado.membros.filter((item) => item.projetoId === projetoId);
    },
    async projetosDoUsuario(usuarioId) {
      if (!usuarioId) return [];
      return estado.membros.filter((item) => item.usuarioId === usuarioId).map((item) => item.projetoId);
    },
    async documentos(projetoId) {
      return estado.documentos.filter((item) => item.projetoId === projetoId).map(clonarDocumento);
    },
    async hashes(projetoId) {
      return estado.documentos
        .filter((item) => item.projetoId === projetoId)
        .flatMap((item) => item.versoes.map((versao) => ({ sha256: versao.sha256, caminho: versao.caminho })));
    },
    async inserirDocumento(documento: DocumentoRegistro) {
      estado.documentos.push(documento);
      estado.auditoria.unshift({ tipo: "documentos", acao: "insert", objeto: documento.id });
    },
    async acrescentarVersao(documentoId: string, versao: VersaoDocumento) {
      const documento = estado.documentos.find((item) => item.id === documentoId);
      if (!documento) throw new Error("Documento não encontrado.");
      documento.versoes.push(versao);
      estado.auditoria.unshift({ tipo: "documento_versoes", acao: "insert", objeto: documentoId });
    },
    async reclassificar(documentoId, classificacao) {
      const documento = estado.documentos.find((item) => item.id === documentoId);
      if (!documento) throw new Error("Documento não encontrado.");
      documento.classificacao = classificacao;
      estado.auditoria.unshift({ tipo: "documentos", acao: "update", objeto: documentoId });
    },
    async auditoria() {
      return [...estado.auditoria];
    },
    async dadosRodada(projetoId) {
      return dadosDoEstado(estado, projetoId);
    },
    async salvarDiagnostico(registro) {
      salvarDiagnosticoMemoria(estado, registro);
    },
    async definirNaoAplicavel(projetoId, padraoId, marcado) {
      definirNaoAplicavelMemoria(estado, projetoId, padraoId, marcado);
    },
    async salvarResposta(resposta) {
      salvarRespostaMemoria(estado, resposta);
    },
    async enviarEvidencia(evidencia) {
      enviarEvidenciaMemoria(estado, evidencia);
    },
    async vincularEvidencia(evidenciaId, documentoId) {
      vincularEvidenciaMemoria(estado, evidenciaId, documentoId);
    },
    async transitarEvidencia(evidenciaId, etapa, ator) {
      transitarEvidenciaMemoria(estado, evidenciaId, etapa, ator.perfil);
    },
    async marcarCumpre(projetoId, padraoId, ciclo, ator) {
      marcarCumpreMemoria(estado, projetoId, padraoId, ciclo, ator.perfil);
    },
    async criarArea(area, ator) {
      criarAreaMemoria(estado, area, ator.perfil);
    },
    async transitarArea(areaId, acao, ator) {
      transitarAreaMemoria(estado, areaId, acao, ator.perfil);
    },
    async avancarEtapa(projetoId, ator) {
      avancarEtapaMemoria(estado, projetoId, ator.perfil);
    },
    async abrirComplementar(origemId) {
      return abrirComplementarMemoria(estado, origemId).id;
    },
    async dataVisita(projetoId) {
      return visitaDoEstado(estado, projetoId);
    },
    async semanasRestricao() {
      return { antes: estado.semanasAntes, depois: estado.semanasDepois };
    },
    async lerSegunda(projetoId, ator, hoje) {
      return lerSegundaMemoria(estado, projetoId, ator, hoje);
    },
    async aplicarSegunda(projetoId, comando, ator) {
      return aplicarSegundaMemoria(estado, projetoId, comando, ator);
    },
  };
}

function clonarDocumento(documento: DocumentoRegistro): DocumentoRegistro {
  return { ...documento, versoes: documento.versoes.map((versao) => ({ ...versao })) };
}

export function repoSessaoGlobal(): Repo {
  return criarRepoSessao(obterEstadoGlobal());
}
