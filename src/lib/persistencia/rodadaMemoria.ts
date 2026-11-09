import { randomUUID } from "node:crypto";
import { catalogoFicticio } from "@/domain/catalogo";
import { afirmarDiagnosticoPodeAlterar } from "@/lib/regras/universo";
import {
  acaoDaFase,
  codigoComplementar,
  estadoDaEtapa,
  gravarResposta,
  itensDeSaida,
  podeExecutarAcaoArea,
  proximaEtapa,
  proximaFase,
  ROTULO_ETAPA,
  saidaAutoavaliacaoBloqueada,
  type AcaoArea,
  type AreaRegistro,
  type DiagnosticoRegistro,
  type EmailRegistro,
  type EvidenciaRegistro,
  type RespostaRegistro,
} from "@/domain/rodada";
import {
  podeAvancarEtapa,
  podeChancelarEvidencia,
  podeConferirEvidencia,
  podeEnviarEvidencia,
  podeMarcarCumprePerfil,
  podeTrabalharPlano,
} from "@/domain/chancela";
import type { EstadoDemo, LinhaAuditoria, ProjetoRegistro } from "@/domain/demo";
import type { DadosRodada } from "@/lib/persistencia/tipos";

function auditar(estado: EstadoDemo, tipo: string, acao: LinhaAuditoria["acao"], objeto: string) {
  estado.auditoria.unshift({ tipo, acao, objeto });
}

export function dadosDoEstado(estado: EstadoDemo, projetoId: string): DadosRodada {
  const projeto = estado.projetos.find((item) => item.id === projetoId) ?? null;
  const origem = projeto?.origemId ? estado.projetos.find((item) => item.id === projeto.origemId) ?? null : null;
  return {
    padroes: catalogoFicticio(),
    diagnostico: estado.diagnosticos.find((item) => item.projetoId === projetoId) ?? null,
    naoAplicaveis: estado.naoAplicaveis.filter((item) => item.projetoId === projetoId).map((item) => item.padraoId),
    respostas: estado.respostas.filter((item) => item.projetoId === projetoId).map((item) => ({ ...item })),
    evidencias: estado.evidencias
      .filter((item) => item.projetoId === projetoId)
      .map((item) => ({ ...item, documentoIds: [...item.documentoIds] })),
    areas: estado.areas.filter((item) => item.projetoId === projetoId).map((item) => ({ ...item })),
    emails: estado.emails.filter((item) => item.projetoId === projetoId).map((item) => ({ ...item })),
    auditoria: estado.auditoria.slice(0, 12).map((item) => ({ ...item })),
    origem: origem
      ? {
          codigo: origem.codigo,
          evidencias: estado.evidencias
            .filter((item) => item.projetoId === origem.id)
            .map((item) => ({ id: item.id, descricao: item.descricao, etapa: item.etapa })),
        }
      : null,
  };
}

export function salvarDiagnosticoMemoria(estado: EstadoDemo, registro: DiagnosticoRegistro) {
  if (!registro.anexoNome.trim() || !registro.anexoCaminho.trim()) {
    throw new Error("O diagnóstico precisa do relatório.");
  }
  const indice = estado.diagnosticos.findIndex((item) => item.projetoId === registro.projetoId);
  if (indice >= 0) estado.diagnosticos[indice] = registro;
  else estado.diagnosticos.push(registro);
  auditar(estado, "diagnosticos", indice >= 0 ? "update" : "insert", registro.projetoId);
}

export function definirNaoAplicavelMemoria(estado: EstadoDemo, projetoId: string, padraoId: string, marcado: boolean) {
  if (!estado.diagnosticos.some((item) => item.projetoId === projetoId)) {
    throw new Error("Grave o diagnóstico antes de marcar não se aplica.");
  }
  const padrao = catalogoFicticio().find((item) => item.id === padraoId);
  if (!padrao) throw new Error("Padrão não encontrado.");
  afirmarDiagnosticoPodeAlterar(padrao);
  const indice = estado.naoAplicaveis.findIndex((item) => item.projetoId === projetoId && item.padraoId === padraoId);
  if (marcado && indice < 0) {
    estado.naoAplicaveis.push({ projetoId, padraoId });
    auditar(estado, "padroes_nao_aplicaveis", "insert", padraoId);
  }
  if (!marcado && indice >= 0) {
    estado.naoAplicaveis.splice(indice, 1);
    auditar(estado, "padroes_nao_aplicaveis", "delete", padraoId);
  }
}

export function salvarRespostaMemoria(estado: EstadoDemo, resposta: RespostaRegistro) {
  const existente = estado.respostas.find(
    (item) => item.projetoId === resposta.projetoId && item.padraoId === resposta.padraoId && item.ciclo === resposta.ciclo,
  );
  const gravada = { ...resposta, cumpre: existente?.cumpre ?? false };
  const outras = estado.respostas.filter((item) => item.projetoId !== resposta.projetoId);
  const doProjeto = gravarResposta(
    estado.respostas.filter((item) => item.projetoId === resposta.projetoId),
    gravada,
  );
  estado.respostas.splice(0, estado.respostas.length, ...outras, ...doProjeto);
  auditar(estado, "respostas_padrao", existente ? "update" : "insert", resposta.padraoId);
}

export function enviarEvidenciaMemoria(estado: EstadoDemo, evidencia: EvidenciaRegistro) {
  if (!evidencia.descricao.trim()) throw new Error("A evidência descreve o fato.");
  estado.evidencias.push({ ...evidencia, etapa: "enviada", documentoIds: [...evidencia.documentoIds] });
  auditar(estado, "evidencias", "insert", evidencia.id);
}

export function vincularEvidenciaMemoria(estado: EstadoDemo, evidenciaId: string, documentoId: string) {
  const evidencia = estado.evidencias.find((item) => item.id === evidenciaId);
  if (!evidencia) throw new Error("Evidência não encontrada.");
  if (!evidencia.documentoIds.includes(documentoId)) evidencia.documentoIds.push(documentoId);
  auditar(estado, "evidencias_arquivos", "insert", evidenciaId);
}

export function transitarEvidenciaMemoria(estado: EstadoDemo, evidenciaId: string, etapa: "conferida" | "chancelada", perfil: string) {
  const evidencia = estado.evidencias.find((item) => item.id === evidenciaId);
  if (!evidencia) throw new Error("Evidência não encontrada.");
  if (etapa === "conferida") {
    if (!podeConferirEvidencia(perfil)) throw new Error("Sem permissão para conferir.");
    if (evidencia.etapa !== "enviada") throw new Error("A evidência não está enviada.");
  } else {
    if (!podeChancelarEvidencia(perfil)) throw new Error("Sem permissão para chancelar.");
    if (evidencia.etapa !== "conferida") throw new Error("A evidência não está conferida.");
  }
  evidencia.etapa = etapa;
  auditar(estado, "evidencias", "update", evidenciaId);
}

export function marcarCumpreMemoria(estado: EstadoDemo, projetoId: string, padraoId: string, ciclo: RespostaRegistro["ciclo"], perfil: string) {
  if (!podeMarcarCumprePerfil(perfil)) throw new Error("Sem permissão para marcar Cumpre.");
  const resposta = estado.respostas.find((item) => item.projetoId === projetoId && item.padraoId === padraoId && item.ciclo === ciclo);
  const evidenciaChancelada = estado.evidencias.some(
    (item) => item.projetoId === projetoId && item.padraoId === padraoId && item.etapa === "chancelada",
  );
  const areaConcluida = estado.areas.some(
    (item) => item.projetoId === projetoId && item.padraoId === padraoId && item.fase === "concluida",
  );
  if (!resposta || resposta.atende !== true) throw new Error("Cumpre exige a resposta Sim neste ciclo.");
  if (!evidenciaChancelada && !areaConcluida) throw new Error("Cumpre exige evidência chancelada ou área concluída e chancelada.");
  resposta.cumpre = true;
  auditar(estado, "respostas_padrao", "update", padraoId);
}

export function criarAreaMemoria(estado: EstadoDemo, area: AreaRegistro, perfil: string) {
  if (!podeTrabalharPlano(perfil)) throw new Error("Sem permissão para abrir área de melhoria.");
  if (!area.texto.trim()) throw new Error("Descreva a área de melhoria.");
  estado.areas.push({ ...area, fase: "detectada" });
  auditar(estado, "areas_melhoria", "insert", area.id);
}

export function transitarAreaMemoria(estado: EstadoDemo, areaId: string, acao: AcaoArea, perfil: string) {
  const area = estado.areas.find((item) => item.id === areaId);
  if (!area) throw new Error("Área de melhoria não encontrada.");
  if (acaoDaFase(area.fase) !== acao) throw new Error("A fase da área de melhoria não pode pular.");
  if (!podeExecutarAcaoArea(perfil, acao)) throw new Error("Sem permissão para chancelar.");
  const destino = proximaFase(area.fase);
  if (!destino) throw new Error("A área já está concluída.");
  area.fase = destino;
  auditar(estado, "areas_melhoria", "update", areaId);
}

export function avancarEtapaMemoria(estado: EstadoDemo, projetoId: string, perfil: string): EmailRegistro {
  if (!podeAvancarEtapa(perfil)) throw new Error("Sem permissão para avançar a etapa.");
  const projeto = estado.projetos.find((item) => item.id === projetoId);
  if (!projeto) throw new Error("Projeto não encontrado.");
  const destino = proximaEtapa(projeto.etapaFluxo);
  if (!destino) throw new Error("Não há próxima etapa.");
  if (projeto.etapaFluxo === "autoavaliacao") {
    const dados = dadosDoEstado(estado, projetoId);
    const bloqueada = saidaAutoavaliacaoBloqueada(
      itensDeSaida(dados.padroes, new Set(dados.naoAplicaveis), dados.evidencias, dados.respostas, projeto.ciclo),
    );
    if (bloqueada) {
      throw new Error("A saída da autoavaliação exige Cumpre e evidência chancelada em todo obrigatório aplicável.");
    }
  }
  projeto.etapaFluxo = destino;
  projeto.estado = estadoDaEtapa(destino);
  projeto.etapa = ROTULO_ETAPA[destino];
  const email: EmailRegistro = {
    id: randomUUID(),
    projetoId,
    destinatario: "Responsável do projeto",
    assunto: `Projeto ${projeto.codigo} avançou para ${ROTULO_ETAPA[destino]}`,
    corpo: "Aviso registrado nesta base. O envio por SMTP não está ligado.",
    enviadoEm: null,
  };
  estado.emails.unshift(email);
  auditar(estado, "projetos", "update", projetoId);
  auditar(estado, "emails_enviados", "insert", email.id);
  return email;
}

export function abrirComplementarMemoria(estado: EstadoDemo, origemId: string): ProjetoRegistro {
  const origem = estado.projetos.find((item) => item.id === origemId);
  if (!origem) throw new Error("Projeto não encontrado.");
  if (origem.estado !== "certificado" && origem.etapaFluxo !== "certificacao") {
    throw new Error("O complementar nasce de um projeto certificado.");
  }
  const codigo = codigoComplementar(origem.codigo);
  if (estado.projetos.some((item) => item.codigo === codigo)) throw new Error("O código complementar já existe.");
  const registro: ProjetoRegistro = {
    ...origem,
    id: randomUUID(),
    codigo,
    estado: "diagnostico",
    etapa: "Diagnóstico",
    etapaFluxo: "diagnostico",
    ciclo: "inicial",
    tipo: "complementar",
    origemCodigo: origem.codigo,
    origemId: origem.id,
    origem: "zero",
    selo: `Complementar de ${origem.codigo}`,
    abre: true,
    vencimento: null,
  };
  estado.projetos.push(registro);
  auditar(estado, "projetos", "insert", registro.id);
  return registro;
}
