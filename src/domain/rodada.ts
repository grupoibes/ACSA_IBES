import { aplicaveis, type GrupoPadrao, type PadraoCatalogo } from "@/domain/catalogo";
import {
  podeAvancarEtapa,
  podeChancelarArea,
  podeConferirEvidencia,
  podeDiagnosticar,
  podeEnviarEvidencia,
  podeMarcarCumprePerfil,
  podeTrabalharPlano,
} from "@/domain/chancela";
import { estadoEvidencia, type EtapaEvidencia } from "@/domain/evidencia";
import { ehPerfilIbes } from "@/domain/leituraDocumento";
import { formatarData } from "@/domain/rotulos";
import { bloqueioAutoavaliacao } from "@/lib/regras/permissoes";
import { PRAZOS_ETAPA, prazoAutoavaliacao, prazoManutencao, prazoRecertificacao } from "@/lib/regras/prazos";

export const CICLOS = ["inicial", "manutencao_1", "manutencao_2", "manutencao_3", "recertificacao"] as const;
export type Ciclo = (typeof CICLOS)[number];

export const ROTULO_CICLO: Record<Ciclo, string> = {
  inicial: "Inicial",
  manutencao_1: "Manutenção 1",
  manutencao_2: "Manutenção 2",
  manutencao_3: "Manutenção 3",
  recertificacao: "Recertificação",
};

export function cicloValido(valor: string): valor is Ciclo {
  return (CICLOS as readonly string[]).includes(valor);
}

export type RespostaRegistro = {
  projetoId: string;
  padraoId: string;
  ciclo: Ciclo;
  atende: boolean | null;
  texto: string;
  cumpre: boolean;
};

/** A manutenção grava outra linha. Não substitui a resposta do ciclo inicial. */
export function gravarResposta(lista: readonly RespostaRegistro[], nova: RespostaRegistro): RespostaRegistro[] {
  const restante = lista.filter(
    (item) => !(item.projetoId === nova.projetoId && item.padraoId === nova.padraoId && item.ciclo === nova.ciclo),
  );
  return [...restante, { ...nova }];
}

export const FASES_AREA = [
  "detectada",
  "planejada",
  "aguardando_conferencia",
  "aguardando_chancela",
  "concluida",
] as const;
export type FaseArea = (typeof FASES_AREA)[number];

export const ROTULO_FASE: Record<FaseArea, string> = {
  detectada: "Detectada",
  planejada: "Planejada",
  aguardando_conferencia: "Aguardando conferência",
  aguardando_chancela: "Aguardando chancela",
  concluida: "Concluída",
};

export type AcaoArea = "planejar" | "concluir" | "conferir" | "chancelar";

export function acaoDaFase(fase: FaseArea): AcaoArea | null {
  if (fase === "detectada") return "planejar";
  if (fase === "planejada") return "concluir";
  if (fase === "aguardando_conferencia") return "conferir";
  if (fase === "aguardando_chancela") return "chancelar";
  return null;
}

export function rotuloAcaoArea(acao: AcaoArea): string {
  if (acao === "planejar") return "Planejar";
  if (acao === "concluir") return "Concluir";
  if (acao === "conferir") return "Conferir";
  return "Chancelar";
}

export function proximaFase(fase: FaseArea): FaseArea | null {
  const indice = FASES_AREA.indexOf(fase);
  return FASES_AREA[indice + 1] ?? null;
}

export function podeExecutarAcaoArea(perfil: string, acao: AcaoArea): boolean {
  if (acao === "planejar" || acao === "concluir") return podeTrabalharPlano(perfil);
  if (acao === "conferir") return podeConferirEvidencia(perfil);
  return podeChancelarArea(perfil);
}

export type DiagnosticoRegistro = {
  projetoId: string;
  avaliadorId: string;
  realizadoEm: string;
  anexoNome: string;
  anexoCaminho: string;
};

export type EvidenciaRegistro = {
  id: string;
  projetoId: string;
  padraoId: string;
  descricao: string;
  etapa: EtapaEvidencia;
  documentoIds: string[];
};

export type AreaRegistro = {
  id: string;
  projetoId: string;
  padraoId: string;
  texto: string;
  fase: FaseArea;
  responsavelId: string | null;
  inicio: string | null;
  fim: string | null;
};

export type EmailRegistro = {
  id: string;
  projetoId: string;
  destinatario: string;
  assunto: string;
  corpo: string;
  enviadoEm: string | null;
};

export type SeloPadrao = "Ausente" | "Pendente" | "Chancelada" | "Não se aplica";

export function seloDoPadrao(aplicavel: boolean, etapas: readonly EtapaEvidencia[]): SeloPadrao {
  if (!aplicavel) return "Não se aplica";
  const estado = estadoEvidencia(etapas);
  if (estado === "ausente") return "Ausente";
  if (estado === "pendente") return "Pendente";
  return "Chancelada";
}

export type ResumoGrupo = {
  grupo: GrupoPadrao;
  total: number;
  cumpridos: number;
  ausentes: number;
  pendentes: number;
  vazio: boolean;
  rotulo: string;
};

export function resumoGrupos(
  padroes: readonly PadraoCatalogo[],
  naoAplicaveis: ReadonlySet<string>,
  evidencias: readonly EvidenciaRegistro[],
  respostas: readonly RespostaRegistro[],
  ciclo: Ciclo,
): ResumoGrupo[] {
  return (["I", "II", "III"] as const).map((grupo) => {
    const doGrupo = aplicaveis(
      padroes.filter((padrao) => padrao.grupo === grupo),
      naoAplicaveis,
    );
    if (doGrupo.length === 0) {
      return { grupo, total: 0, cumpridos: 0, ausentes: 0, pendentes: 0, vazio: true, rotulo: "—" };
    }
    let cumpridos = 0;
    let ausentes = 0;
    let pendentes = 0;
    for (const padrao of doGrupo) {
      const etapas = evidencias.filter((item) => item.padraoId === padrao.id).map((item) => item.etapa);
      const selo = seloDoPadrao(true, etapas);
      if (selo === "Ausente") ausentes += 1;
      if (selo === "Pendente") pendentes += 1;
      const resposta = respostas.find((item) => item.padraoId === padrao.id && item.ciclo === ciclo);
      if (resposta?.cumpre && selo === "Chancelada") cumpridos += 1;
    }
    return {
      grupo,
      total: doGrupo.length,
      cumpridos,
      ausentes,
      pendentes,
      vazio: false,
      rotulo: `${cumpridos} de ${doGrupo.length}`,
    };
  });
}

export type ItemSaida = { obrigatorio: boolean; aplicavel: boolean; cumpre: boolean; chancelada: boolean };

/** Fechado em 28/10: sair da autoavaliação exige Cumpre e evidência chancelada em todo obrigatório aplicável. */
export function saidaAutoavaliacaoBloqueada(itens: readonly ItemSaida[]): boolean {
  return itens.some((item) => bloqueioAutoavaliacao(item.obrigatorio && item.aplicavel, item.cumpre, item.chancelada));
}

export function itensDeSaida(
  padroes: readonly PadraoCatalogo[],
  naoAplicaveis: ReadonlySet<string>,
  evidencias: readonly EvidenciaRegistro[],
  respostas: readonly RespostaRegistro[],
  ciclo: Ciclo,
): ItemSaida[] {
  return padroes.map((padrao) => {
    const aplicavel = !padrao.naoSeAplicaManual && !naoAplicaveis.has(padrao.id);
    const chancelada = evidencias.some((item) => item.padraoId === padrao.id && item.etapa === "chancelada");
    const cumpre = respostas.some((item) => item.padraoId === padrao.id && item.ciclo === ciclo && item.cumpre);
    return { obrigatorio: padrao.obrigatorio, aplicavel, cumpre, chancelada };
  });
}

export function cumprePermitido(entrada: {
  perfil: string;
  atende: boolean | null;
  evidenciaChancelada: boolean;
  areaConcluida: boolean;
}): string | null {
  if (!podeMarcarCumprePerfil(entrada.perfil)) return "Somente o responsável do projeto ou o autorizador marcam Cumpre.";
  if (entrada.atende !== true) return "Cumpre exige a resposta Sim neste ciclo.";
  if (!entrada.evidenciaChancelada && !entrada.areaConcluida) {
    return "Cumpre exige evidência chancelada ou área concluída e chancelada.";
  }
  return null;
}

export const ETAPAS_FLUXO = ["diagnostico", "solicitacao", "autoavaliacao", "avaliacao", "certificacao"] as const;
export type EtapaFluxo = (typeof ETAPAS_FLUXO)[number];

export const ROTULO_ETAPA: Record<EtapaFluxo, string> = {
  diagnostico: "Diagnóstico",
  solicitacao: "Solicitação",
  autoavaliacao: "Autoavaliação",
  avaliacao: "Avaliação",
  certificacao: "Certificação",
};

export function etapaFluxoValida(valor: string): valor is EtapaFluxo {
  return (ETAPAS_FLUXO as readonly string[]).includes(valor);
}

export function proximaEtapa(atual: EtapaFluxo): EtapaFluxo | null {
  const indice = ETAPAS_FLUXO.indexOf(atual);
  return ETAPAS_FLUXO[indice + 1] ?? null;
}

export function estadoDaEtapa(etapa: EtapaFluxo): "diagnostico" | "autoavaliacao" | "avaliacao" | "certificado" {
  if (etapa === "autoavaliacao") return "autoavaliacao";
  if (etapa === "avaliacao") return "avaliacao";
  if (etapa === "certificacao") return "certificado";
  return "diagnostico";
}

export function fluxoDoEstado(estado: string): EtapaFluxo {
  if (estado === "autoavaliacao") return "autoavaliacao";
  if (estado === "avaliacao") return "avaliacao";
  if (estado === "certificado") return "certificacao";
  return "diagnostico";
}

export type LinhaPrazo = { etapa: string; prazo: string; quando: string };

export function linhasPrazo(projeto: { abertura: string; vencimento: string | null }): LinhaPrazo[] {
  const unidade = "Unidade a confirmar (dias ou meses)";
  return [
    { etapa: "Diagnóstico", prazo: String(PRAZOS_ETAPA.diagnostico), quando: unidade },
    { etapa: "Candidatura", prazo: String(PRAZOS_ETAPA.candidatura), quando: unidade },
    { etapa: "Autoavaliação", prazo: "12 meses", quando: formatarData(prazoAutoavaliacao(projeto.abertura)) },
    { etapa: "Avaliação", prazo: "Sem prazo de visita", quando: "A visita não tem prazo" },
    { etapa: "Comitê", prazo: "30 dias", quando: "Conta do resultado positivo e trava a etapa" },
    {
      etapa: "Manutenção",
      prazo: "30 meses",
      quando: projeto.vencimento ? formatarData(prazoManutencao(projeto.vencimento)) : "Conta da certificação",
    },
    {
      etapa: "Recertificação",
      prazo: "60 meses",
      quando: projeto.vencimento ? formatarData(prazoRecertificacao(projeto.vencimento)) : "Conta da certificação",
    },
    { etapa: "Nova avaliação após resultado negativo", prazo: String(PRAZOS_ETAPA.novaAvaliacaoAposNegativa), quando: unidade },
  ];
}

export function codigoComplementar(codigo: string): string {
  if (!/^[0-9]{4}\/[0-9]{3}$/.test(codigo)) {
    throw new Error("O complementar nasce de um código AAAA/NNN.");
  }
  return `${codigo}-C`;
}

export type LinhaPadrao = PadraoCatalogo & {
  aplicavel: boolean;
  visivel: boolean;
  selo: SeloPadrao;
  atende: boolean | null;
  texto: string;
  cumpre: boolean;
};

export type PainelRodada = {
  aplicaveis: number;
  ciclo: Ciclo;
  linhas: LinhaPadrao[];
  resumo: ResumoGrupo[];
  diagnostico: DiagnosticoRegistro | null;
  evidencias: EvidenciaRegistro[];
  areas: (AreaRegistro & { codigo: string })[];
  emails: EmailRegistro[];
  auditoria: { tipo: string; acao: string; objeto: string }[];
  origem: { codigo: string; evidencias: { id: string; descricao: string; etapa: EtapaEvidencia }[] } | null;
  prazos: LinhaPrazo[];
  etapaFluxo: EtapaFluxo;
  proxima: EtapaFluxo | null;
  saidaBloqueada: boolean;
  pode: {
    diagnostico: boolean;
    avancar: boolean;
    cumpre: boolean;
    conferir: boolean;
    chancelar: boolean;
    enviar: boolean;
    plano: boolean;
  };
};

export function montarPainel(entrada: {
  perfil: string;
  projeto: { abertura: string; vencimento: string | null; etapaFluxo: EtapaFluxo; ciclo: Ciclo };
  ciclo: Ciclo;
  padroes: readonly PadraoCatalogo[];
  diagnostico: DiagnosticoRegistro | null;
  naoAplicaveis: readonly string[];
  respostas: readonly RespostaRegistro[];
  evidencias: readonly EvidenciaRegistro[];
  areas: readonly AreaRegistro[];
  emails: readonly EmailRegistro[];
  auditoria: readonly { tipo: string; acao: string; objeto: string }[];
  origem: PainelRodada["origem"];
}): PainelRodada {
  const na = new Set(entrada.naoAplicaveis);
  const ibes = ehPerfilIbes(entrada.perfil);
  const linhas = entrada.padroes.map((padrao) => {
    const aplicavel = !padrao.naoSeAplicaManual && !na.has(padrao.id);
    const etapas = entrada.evidencias.filter((item) => item.padraoId === padrao.id).map((item) => item.etapa);
    const resposta = entrada.respostas.find((item) => item.padraoId === padrao.id && item.ciclo === entrada.ciclo);
    return {
      ...padrao,
      aplicavel,
      visivel: ibes || aplicavel,
      selo: seloDoPadrao(aplicavel, etapas),
      atende: resposta?.atende ?? null,
      texto: resposta?.texto ?? "",
      cumpre: resposta?.cumpre ?? false,
    };
  });
  const podeDiagnostico = podeDiagnosticar(entrada.perfil);
  return {
    aplicaveis: aplicaveis(entrada.padroes, na).length,
    ciclo: entrada.ciclo,
    linhas: podeDiagnostico || ibes ? linhas : linhas.filter((linha) => linha.visivel),
    resumo: resumoGrupos(entrada.padroes, na, entrada.evidencias, entrada.respostas, entrada.ciclo),
    diagnostico: podeDiagnostico ? entrada.diagnostico : null,
    evidencias: [...entrada.evidencias],
    areas: entrada.areas.map((area) => ({
      ...area,
      codigo: entrada.padroes.find((padrao) => padrao.id === area.padraoId)?.codigo ?? "",
    })),
    emails: [...entrada.emails],
    auditoria: [...entrada.auditoria],
    origem: entrada.origem,
    prazos: linhasPrazo(entrada.projeto),
    etapaFluxo: entrada.projeto.etapaFluxo,
    proxima: proximaEtapa(entrada.projeto.etapaFluxo),
    saidaBloqueada: saidaAutoavaliacaoBloqueada(
      itensDeSaida(entrada.padroes, na, entrada.evidencias, entrada.respostas, entrada.projeto.ciclo),
    ),
    pode: {
      diagnostico: podeDiagnostico,
      avancar: podeAvancarEtapa(entrada.perfil),
      cumpre: podeMarcarCumprePerfil(entrada.perfil),
      conferir: podeConferirEvidencia(entrada.perfil),
      chancelar: podeChancelarArea(entrada.perfil),
      enviar: podeEnviarEvidencia(entrada.perfil),
      plano: podeTrabalharPlano(entrada.perfil),
    },
  };
}
