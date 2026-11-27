import { randomUUID } from "node:crypto";
import { catalogoFicticio, requisitosFicticios } from "@/domain/catalogo";
import { calcularNivel } from "@/domain/calcularNivel";
import type { EstadoDemo, LinhaAuditoria } from "@/domain/demo";
import { resultadoGravado, type ResultadoPadrao } from "@/domain/evidencia";
import { ehPerfilIbes } from "@/domain/leituraDocumento";
import { prazoComite } from "@/domain/comitePrazo";
import {
  AVALIACAO_2025,
  avisoLimiteUsuarios,
  clienteNaRestricao,
  contaAvaliador,
  ETAPAS_MIGRACAO,
  INVENTARIO_PROJETOS,
  janelaRestricao,
  LIMITE_USUARIOS_PADRAO,
  MANUAIS_MIGRACAO,
  nivelValido,
  ORG_MODELO,
  podeAgendar,
  podeConsolidarPontos,
  podeParecer,
  podeRegistrarResultado,
  podeVerRequisitos,
  pontosDoRelatorio,
  RESTRICAO_SEMANAS_ANTES,
  RESTRICAO_SEMANAS_DEPOIS,
  resolucaoPermitida,
  resultadoPermitido,
  textoRelatorio,
  votoValido,
  type AvaliacaoRegistro,
  type NivelPedido,
  type ParecerRegistro,
  type PontoRegistro,
  type ResolucaoRegistro,
  type ResultadoAvaliador,
  type ResultadoRodada,
  type StagingProjeto,
  type TipoAvaliacaoSegunda,
  type UpgradeRegistro,
  type UsuarioCliente,
  type VotoComite,
} from "@/domain/segunda";
import type { Ator } from "@/lib/persistencia/tipos";

export type ComandoSegunda = {
  tipo: string;
  dataVisita?: string;
  tipoAvaliacao?: TipoAvaliacaoSegunda;
  padraoId?: string;
  resultado?: string;
  observacao?: string;
  tipoPonto?: "forte" | "fraco";
  texto?: string;
  resultadoRodada?: ResultadoRodada;
  voto?: string;
  nivel?: string;
  semConflito?: boolean;
  numero?: string;
  nivelFinal?: string | null;
  justificativa?: string;
  motivo?: string;
  upgradeId?: string;
  nome?: string;
  email?: string;
  perfil?: string;
  hoje?: string;
};

export type PainelSegunda = {
  semanasAntes: number;
  semanasDepois: number;
  restricao: { inicio: string; fim: string; ativa: boolean } | null;
  avaliacao: AvaliacaoRegistro | null;
  resultados: {
    padraoId: string;
    codigo: string;
    titulo: string;
    grupo: string;
    resultado: ResultadoPadrao | null;
    observacao: string;
  }[];
  requisitos: { padraoId: string; ordem: number; texto: string; provas: string[] }[];
  pontos: PontoRegistro[];
  pareceres: ParecerRegistro[];
  resolucao: ResolucaoRegistro | null;
  bloqueioResolucao: string | null;
  prazoComite: string | null;
  prazoComiteVencido: boolean;
  nivelCalculado: string;
  upgrades: UpgradeRegistro[];
  usuarios: UsuarioCliente[];
  limiteUsuarios: number;
  ativos: number;
  avisoLimite: string | null;
  relatorio: string;
  indicadores: { grupo: string; nome: string; valor: string }[];
  log: LinhaAuditoria[];
  migracao: {
    manuais: typeof MANUAIS_MIGRACAO;
    inventario: number;
    etapas: typeof ETAPAS_MIGRACAO;
    staging: StagingProjeto[];
    restrita: boolean;
  };
  pode: {
    agendar: boolean;
    resultado: boolean;
    consolidar: boolean;
    parecer: boolean;
    upgrade: boolean;
    incluir: boolean;
    cadastrar: boolean;
    verRequisitos: boolean;
  };
};

function auditar(estado: EstadoDemo, tipo: string, acao: LinhaAuditoria["acao"], objeto: string) {
  estado.auditoria.unshift({ tipo, acao, objeto });
}

function email(estado: EstadoDemo, projetoId: string, destinatario: string, assunto: string, corpo: string) {
  estado.emails.unshift({
    id: randomUUID(),
    projetoId,
    destinatario,
    assunto,
    corpo,
    enviadoEm: null,
  });
  auditar(estado, "emails_enviados", "insert", "emails_enviados");
}

function avaliacaoDo(estado: EstadoDemo, projetoId: string): AvaliacaoRegistro {
  const atual = estado.avaliacoes.find((item) => item.projetoId === projetoId);
  if (atual) return atual;
  const criada: AvaliacaoRegistro = {
    id: randomUUID(),
    projetoId,
    rodada: 1,
    tipo: "certificacao",
    resultado: "em_curso",
    dataVisita: null,
    liderId: null,
    resultadoPositivoEm: null,
  };
  estado.avaliacoes.push(criada);
  return criada;
}

function recusar(condicao: boolean, mensagem: string) {
  if (condicao) throw new Error(mensagem);
}

export function aplicarSegundaMemoria(estado: EstadoDemo, projetoId: string, comando: ComandoSegunda, ator: Ator): string | null {
  const hoje = comando.hoje ?? new Date().toISOString().slice(0, 10);
  const avaliacao = avaliacaoDo(estado, projetoId);
  const restrito = clienteNaRestricao(hoje, avaliacao.dataVisita, ator.perfil, estado.semanasAntes, estado.semanasDepois);
  recusar(restrito && !ehPerfilIbes(ator.perfil), "O cliente só consulta durante a restrição da visita.");

  if (comando.tipo === "agendar") {
    recusar(!podeAgendar(ator.perfil), "Somente backoffice e administrador agendam a visita.");
    recusar(!comando.dataVisita, "Informe a data da visita.");
    avaliacao.dataVisita = comando.dataVisita ?? null;
    avaliacao.tipo = comando.tipoAvaliacao ?? avaliacao.tipo;
    auditar(estado, "avaliacoes", "update", avaliacao.id);
    email(estado, projetoId, "cliente e equipe", `Visita de ${avaliacao.tipo}`, `Visita agendada para ${avaliacao.dataVisita}.`);
    return null;
  }

  if (comando.tipo === "resultado") {
    recusar(!podeRegistrarResultado(ator.perfil), "Somente avaliador e avaliador líder registram o resultado.");
    recusar(!comando.padraoId || !comando.resultado || !resultadoGravado(comando.resultado), "Informe o padrão e o resultado.");
    const resultado = comando.resultado as ResultadoPadrao;
    recusar(!resultadoPermitido(avaliacao.tipo, resultado), "Este resultado não cabe neste tipo de avaliação.");
    const grupo = catalogoFicticio().find((item) => item.id === comando.padraoId)?.grupo;
    recusar(avaliacao.tipo === "manutencao" && grupo === "III", "A manutenção não avalia o Grupo III.");
    const existente = estado.resultadosAvaliador.find((item) => item.avaliacaoId === avaliacao.id && item.padraoId === comando.padraoId);
    if (existente) {
      existente.resultado = resultado;
      existente.observacao = comando.observacao ?? existente.observacao;
      auditar(estado, "resultados_padrao", "update", existente.id);
    } else {
      const criado: ResultadoAvaliador = {
        id: randomUUID(),
        avaliacaoId: avaliacao.id,
        padraoId: comando.padraoId!,
        resultado,
        observacao: comando.observacao ?? "",
      };
      estado.resultadosAvaliador.push(criado);
      auditar(estado, "resultados_padrao", "insert", criado.id);
    }
    return null;
  }

  if (comando.tipo === "ponto") {
    recusar(!podeRegistrarResultado(ator.perfil), "Somente avaliador e avaliador líder registram pontos.");
    recusar(!comando.texto?.trim() || (comando.tipoPonto !== "forte" && comando.tipoPonto !== "fraco"), "Descreva o ponto.");
    const ponto: PontoRegistro = {
      id: randomUUID(),
      avaliacaoId: avaliacao.id,
      tipo: comando.tipoPonto!,
      texto: comando.texto!.trim(),
      autorId: ator.usuarioId ?? "",
      consolidado: false,
    };
    estado.pontos.push(ponto);
    auditar(estado, "pontos_avaliacao", "insert", ponto.id);
    return null;
  }

  if (comando.tipo === "consolidar") {
    recusar(!podeConsolidarPontos(ator.perfil), "Somente o avaliador líder consolida os pontos.");
    for (const ponto of estado.pontos.filter((item) => item.avaliacaoId === avaliacao.id)) ponto.consolidado = true;
    auditar(estado, "pontos_avaliacao", "update", avaliacao.id);
    return null;
  }

  if (comando.tipo === "rodada") {
    recusar(!podeConsolidarPontos(ator.perfil), "Somente o avaliador líder define o resultado da rodada.");
    recusar(comando.resultadoRodada !== "em_curso" && comando.resultadoRodada !== "positiva" && comando.resultadoRodada !== "negativa", "Resultado inválido.");
    avaliacao.resultado = comando.resultadoRodada!;
    avaliacao.resultadoPositivoEm = comando.resultadoRodada === "positiva" ? hoje : comando.resultadoRodada === "em_curso" ? null : avaliacao.resultadoPositivoEm;
    if (comando.resultadoRodada === "negativa") {
      avaliacao.rodada += 1;
      avaliacao.resultado = "em_curso";
      avaliacao.resultadoPositivoEm = null;
      estado.resultadosAvaliador = estado.resultadosAvaliador.filter((item) => item.avaliacaoId !== avaliacao.id);
    }
    auditar(estado, "avaliacoes", "update", avaliacao.id);
    return null;
  }

  if (comando.tipo === "parecer") {
    recusar(!podeParecer(ator.perfil), "Somente membro do comitê registra parecer.");
    recusar(avaliacao.resultado !== "positiva", "O comitê só analisa resultado Positiva.");
    recusar(!comando.voto || !votoValido(comando.voto), "Voto inválido.");
    recusar(!comando.nivel || !nivelValido(comando.nivel), "Informe o nível proposto.");
    recusar(!comando.texto?.trim(), "Escreva o parecer.");
    recusar(comando.semConflito !== true, "A declaração de ausência de conflito é obrigatória.");
    const membroId = ator.usuarioId ?? "";
    const voto = comando.voto as VotoComite;
    const nivel = comando.nivel as NivelPedido;
    const existente = estado.pareceres.find((item) => item.avaliacaoId === avaliacao.id && item.membroId === membroId);
    if (existente) {
      existente.voto = voto;
      existente.nivelProposto = nivel;
      existente.texto = comando.texto!.trim();
      existente.semConflito = true;
      auditar(estado, "pareceres_comite", "update", existente.id);
    } else {
      const criado: ParecerRegistro = {
        id: randomUUID(),
        avaliacaoId: avaliacao.id,
        membroId,
        voto,
        nivelProposto: nivel,
        texto: comando.texto!.trim(),
        semConflito: true,
      };
      estado.pareceres.push(criado);
      auditar(estado, "pareceres_comite", "insert", criado.id);
    }
    return null;
  }

  if (comando.tipo === "resolucao") {
    recusar(!podeParecer(ator.perfil), "Somente membro do comitê registra a resolução.");
    recusar(avaliacao.resultado !== "positiva", "O comitê só analisa resultado Positiva.");
    const prazo = prazoComite(avaliacao.resultadoPositivoEm, hoje);
    recusar(prazo.vencido, "O prazo de 30 dias do comitê venceu.");
    const pareceres = estado.pareceres.filter((item) => item.avaliacaoId === avaliacao.id);
    const nivelFinal = comando.nivelFinal && nivelValido(comando.nivelFinal) ? comando.nivelFinal : null;
    const bloqueio = resolucaoPermitida(
      pareceres.map((item) => ({ voto: item.voto })),
      nivelFinal,
      nivelCalculado(estado, avaliacao) === "Abaixo de Avançado" ? null : nivelCodigo(nivelCalculado(estado, avaliacao)),
      comando.justificativa ?? "",
    );
    recusar(Boolean(bloqueio), bloqueio ?? "Resolução bloqueada.");
    recusar(estado.resolucoes.some((item) => item.avaliacaoId === avaliacao.id), "A resolução desta rodada já foi registrada.");
    recusar(!comando.numero?.trim(), "Informe o número da resolução.");
    const decisao = pareceres[0]?.voto ?? "conceder";
    const criada: ResolucaoRegistro = {
      id: randomUUID(),
      avaliacaoId: avaliacao.id,
      projetoId,
      numero: comando.numero!.trim(),
      decisao,
      nivelFinal: decisao === "conceder" ? nivelFinal : null,
      justificativa: comando.justificativa ?? "",
      pontuacao: pontuacao(estado, avaliacao),
    };
    estado.resolucoes.push(criada);
    auditar(estado, "resolucoes_comite", "insert", criada.id);
    if (decisao === "conceder") {
      const projeto = estado.projetos.find((item) => item.id === projetoId);
      if (projeto) {
        projeto.estado = "certificado";
        projeto.etapaFluxo = "certificacao";
        projeto.etapa = "Certificação";
        auditar(estado, "projetos", "update", projeto.id);
        auditar(estado, "certificados", "insert", projeto.id);
      }
      email(estado, projetoId, "responsável e backoffice", "Resolução do comitê", `Resolução ${criada.numero} concedeu a certificação.`);
    }
    return null;
  }

  if (comando.tipo === "upgrade") {
    recusar(ator.perfil !== "responsavel_projeto" && ator.perfil !== "gestor_instituicao", "Só o Responsável do projeto solicita upgrade.");
    recusar(!comando.nivel || !nivelValido(comando.nivel), "Informe o nível.");
    recusar(!comando.motivo?.trim(), "Informe o motivo.");
    const pedido: UpgradeRegistro = {
      id: randomUUID(),
      projetoId,
      nivelPedido: comando.nivel as NivelPedido,
      motivo: comando.motivo!.trim(),
      situacao: "recebida",
    };
    estado.upgrades.push(pedido);
    auditar(estado, "pedidos_upgrade", "insert", pedido.id);
    email(estado, projetoId, "backoffice", "Pedido de upgrade", `Pedido de ${comando.nivel}: ${pedido.motivo}`);
    return null;
  }

  if (comando.tipo === "incluir-upgrade") {
    recusar(!podeAgendar(ator.perfil), "Somente backoffice e administrador incluem o upgrade.");
    const pedido = estado.upgrades.find((item) => item.id === comando.upgradeId && item.projetoId === projetoId);
    recusar(!pedido, "Pedido não encontrado.");
    pedido!.situacao = "incluida";
    auditar(estado, "pedidos_upgrade", "update", pedido!.id);
    return null;
  }

  if (comando.tipo === "usuario") {
    recusar(
      !["responsavel_projeto", "gestor_instituicao", "backoffice_ibes", "admin_ibes", "responsavel_ibes"].includes(ator.perfil),
      "Sem permissão para cadastrar usuário.",
    );
    recusar(!comando.nome?.trim() || !comando.email?.trim() || !comando.perfil, "Informe nome, e-mail e perfil.");
    const criado: UsuarioCliente = {
      id: randomUUID(),
      organizacaoId: ORG_MODELO,
      nome: comando.nome!.trim(),
      email: comando.email!.trim(),
      perfil: comando.perfil!,
      ativo: true,
    };
    estado.usuariosCliente.push(criado);
    auditar(estado, "usuarios", "insert", criado.id);
    email(estado, projetoId, criado.email, "Credenciais", "Envio de credenciais registrado, sem SMTP.");
    const ativos = estado.usuariosCliente.filter((item) => item.organizacaoId === ORG_MODELO && item.ativo).length;
    return avisoLimiteUsuarios(ativos, estado.limiteUsuarios, ator.perfil);
  }

  throw new Error("Ação desconhecida.");
}

function nivelCodigo(rotulo: string): string | null {
  if (rotulo === "Avançado") return "avancado";
  if (rotulo === "Ótimo") return "otimo";
  if (rotulo === "Excelente") return "excelente";
  return null;
}

function nivelCalculado(estado: EstadoDemo, avaliacao: AvaliacaoRegistro): string {
  try {
    return nivelDoCalculo(estado, avaliacao);
  } catch {
    return "Abaixo de Avançado";
  }
}

function nivelDoCalculo(estado: EstadoDemo, avaliacao: AvaliacaoRegistro): string {
  const resultados = new Map(
    estado.resultadosAvaliador.filter((item) => item.avaliacaoId === avaliacao.id).map((item) => [item.padraoId, item.resultado]),
  );
  const na = new Set(estado.naoAplicaveis.filter((item) => item.projetoId === avaliacao.projetoId).map((item) => item.padraoId));
  const calculo = calcularNivel({
    manual: "PF",
    tipo: avaliacao.tipo === "manutencao" ? "manutencao" : avaliacao.tipo === "recertificacao" ? "recertificacao" : "certificacao",
    padroes: catalogoFicticio().map((padrao) => ({
      id: padrao.id,
      grupo: padrao.grupo,
      obrigatorio: padrao.obrigatorio,
      imprescindivel: false,
      cumprido: contaAvaliador(resultados.get(padrao.id) ?? null),
      naoAplicavel: padrao.naoSeAplicaManual || na.has(padrao.id),
    })),
  });
  if (calculo.nivel === "avancado") return "Avançado";
  if (calculo.nivel === "otimo") return "Ótimo";
  if (calculo.nivel === "excelente") return "Excelente";
  return "Abaixo de Avançado";
}

function pontuacao(estado: EstadoDemo, avaliacao: AvaliacaoRegistro): string {
  const linhas = estado.resultadosAvaliador.filter((item) => item.avaliacaoId === avaliacao.id && item.resultado !== "pendente");
  if (linhas.length === 0) return "0";
  const cumpridos = linhas.filter((item) => contaAvaliador(item.resultado)).length;
  return (Math.round((cumpridos * 1000) / linhas.length) / 10).toFixed(1);
}

export function lerSegundaMemoria(estado: EstadoDemo, projetoId: string, ator: Ator, hoje: string): PainelSegunda {
  const avaliacao = estado.avaliacoes.find((item) => item.projetoId === projetoId) ?? null;
  const projeto = estado.projetos.find((item) => item.id === projetoId);
  const janela = avaliacao?.dataVisita ? janelaRestricao(avaliacao.dataVisita, estado.semanasAntes, estado.semanasDepois) : null;
  const resultadosAval = avaliacao ? estado.resultadosAvaliador.filter((item) => item.avaliacaoId === avaliacao.id) : [];
  const mapa = new Map(resultadosAval.map((item) => [item.padraoId, item]));
  const ver = podeVerRequisitos(ator.perfil);
  const pontos = avaliacao ? estado.pontos.filter((item) => item.avaliacaoId === avaliacao.id) : [];
  const pareceres = avaliacao ? estado.pareceres.filter((item) => item.avaliacaoId === avaliacao.id) : [];
  const resolucao = avaliacao ? estado.resolucoes.find((item) => item.avaliacaoId === avaliacao.id) ?? null : null;
  const nivel = avaliacao ? nivelCalculado(estado, avaliacao) : "Abaixo de Avançado";
  const prazo = prazoComite(avaliacao?.resultadoPositivoEm ?? null, hoje);
  const linhas = catalogoFicticio()
    .filter((padrao) => !padrao.naoSeAplicaManual)
    .map((padrao) => {
      const gravado = mapa.get(padrao.id);
      return {
        padraoId: padrao.id,
        codigo: padrao.codigo,
        titulo: padrao.titulo,
        grupo: padrao.grupo,
        resultado: gravado?.resultado ?? null,
        observacao: gravado?.observacao ?? "",
      };
    });
  const ativos = estado.usuariosCliente.filter((item) => item.ativo && item.organizacaoId === ORG_MODELO).length;
  const relatorio = textoRelatorio({
    codigo: projeto?.codigo ?? "",
    instituicao: projeto?.instituicao ?? "",
    rodada: avaliacao?.rodada ?? 1,
    tipo: avaliacao?.tipo ?? "certificacao",
    dataVisita: avaliacao?.dataVisita ?? null,
    resultadoRodada: avaliacao?.resultado ?? "em_curso",
    linhas,
    pontos,
    nivel,
  });
  const bloqueio =
    avaliacao && avaliacao.resultado === "positiva" && !resolucao
      ? resolucaoPermitida(
          pareceres.map((item) => ({ voto: item.voto })),
          null,
          nivelCodigo(nivel),
          " ",
        )
      : null;
  return {
    semanasAntes: estado.semanasAntes,
    semanasDepois: estado.semanasDepois,
    restricao: janela
      ? { ...janela, ativa: clienteNaRestricao(hoje, avaliacao?.dataVisita ?? null, "responsavel_projeto", estado.semanasAntes, estado.semanasDepois) }
      : null,
    avaliacao,
    resultados: linhas.filter((linha) => linha.grupo !== "III" || avaliacao?.tipo !== "manutencao"),
    requisitos: ver
      ? requisitosFicticios().map((item) => ({
          padraoId: item.padraoId,
          ordem: item.ordem,
          texto: item.texto,
          provas: item.provas.map((prova) => prova.nome),
        }))
      : [],
    pontos,
    pareceres,
    resolucao,
    bloqueioResolucao: bloqueio,
    prazoComite: prazo.prazo,
    prazoComiteVencido: prazo.vencido,
    nivelCalculado: nivel,
    upgrades: estado.upgrades.filter((item) => item.projetoId === projetoId),
    usuarios: estado.usuariosCliente,
    limiteUsuarios: estado.limiteUsuarios,
    ativos,
    avisoLimite: avisoLimiteUsuarios(ativos, estado.limiteUsuarios, ator.perfil),
    relatorio,
    indicadores: [
      { grupo: "Avaliação", nome: "Padrões com resultado do avaliador", valor: String(resultadosAval.filter((item) => item.resultado !== "pendente").length) },
      { grupo: "Avaliação", nome: "Pontos consolidados", valor: String(pontosDoRelatorio(pontos).length) },
      { grupo: "Projeto", nome: "Usuários ativos do cliente", valor: `${ativos}/${estado.limiteUsuarios}` },
      { grupo: "Comitê", nome: "Pareceres", valor: String(pareceres.length) },
    ],
    log: estado.auditoria.slice(0, 40),
    migracao: {
      manuais: MANUAIS_MIGRACAO,
      inventario: INVENTARIO_PROJETOS,
      etapas: ETAPAS_MIGRACAO,
      staging: ehPerfilIbes(ator.perfil) ? estado.staging : [],
      restrita: !ehPerfilIbes(ator.perfil),
    },
    pode: {
      agendar: podeAgendar(ator.perfil),
      resultado: podeRegistrarResultado(ator.perfil),
      consolidar: podeConsolidarPontos(ator.perfil),
      parecer: podeParecer(ator.perfil),
      upgrade: ator.perfil === "responsavel_projeto" || ator.perfil === "gestor_instituicao",
      incluir: podeAgendar(ator.perfil),
      cadastrar: ["responsavel_projeto", "gestor_instituicao", "backoffice_ibes", "admin_ibes", "responsavel_ibes"].includes(ator.perfil),
      verRequisitos: ver,
    },
  };
}

export function visitaDoEstado(estado: EstadoDemo, projetoId: string): string | null {
  return estado.avaliacoes.find((item) => item.projetoId === projetoId)?.dataVisita ?? null;
}

export const SEMANAS_PADRAO = { antes: RESTRICAO_SEMANAS_ANTES, depois: RESTRICAO_SEMANAS_DEPOIS };
export const LIMITE_PADRAO = LIMITE_USUARIOS_PADRAO;
