import {
  podeAbrirRodada,
  podeDefinirEstadoTerminal,
  podeRegistrarNaoAplicavel,
  podeVerNaoAplicaveis,
  estadoExigePerfilTerminal,
  origemNaoAplicavelAdmitida,
} from "@/domain/acesso";
import { calcularNivel, type EntradaNivel, type ResultadoNivel } from "@/domain/calcularNivel";
import {
  LIMIARES_ME_5_1_07,
  MANUAL_OPERACIONAL,
  type EstadoProjeto,
  type Grupo,
  type OrigemNaoAplicavel,
  type Perfil,
  type TipoAvaliacao,
} from "@/domain/manuais";

export interface PadraoCatalogo {
  id: string;
  codigo: string;
  titulo: string;
  grupo: Grupo;
  obrigatorio: boolean;
  imprescindivel: boolean;
}

export interface Diagnostico {
  avaliador: string;
  data: string;
  anexoNome: string;
}

export interface NaoAplicavel {
  padraoId: string;
  origem: OrigemNaoAplicavel;
}

export interface Avaliacao {
  id: string;
  rodada: number;
  tipo: TipoAvaliacao;
  conformidades: Record<string, boolean>;
}

export interface Evidencia {
  id: string;
  padraoId: string;
  avaliacaoId: string;
  rodada: number;
  descricao: string;
  criadaEm: string;
}

export interface HistoricoEstado {
  de: EstadoProjeto | null;
  para: EstadoProjeto;
  perfil: Perfil;
  motivo: string;
  em: string;
}

export interface Projeto {
  id: string;
  instituicao: string;
  nome: string;
  manual: typeof MANUAL_OPERACIONAL;
  catalogoOficial: boolean;
  estado: EstadoProjeto;
  historico: HistoricoEstado[];
  diagnostico: Diagnostico;
  naoAplicaveis: NaoAplicavel[];
  padroes: PadraoCatalogo[];
  avaliacoes: Avaliacao[];
  evidencias: Evidencia[];
}

export function criarProjetoAmostra(): Projeto {
  const padroes: PadraoCatalogo[] = [
    padrao("5.01.01", "A pessoa recebe informação para consentir o cuidado", "I", true, false),
    padrao("5.01.02", "A identificação é conferida antes da dispensação", "I", true, false),
    padrao("5.02.01", "O atendimento preserva a privacidade", "I", true, false),
    padrao("5.05.01", "Medicamentos de alta vigilância têm barreira e dupla checagem", "I", true, false),
    padrao("5.01.03", "A orientação de alta chega por escrito", "I", false, false),
    padrao("5.03.01", "O horário de entrega cobre a continuidade do tratamento", "I", false, false),
    padrao("5.04.01", "O sistema registra prescrição, dispensação e devolução", "II", false, true),
    padrao("5.06.01", "O lote dispensado é rastreável até o paciente", "II", false, false),
    padrao("5.06.02", "A sala de manipulação estéril tem fluxo separado", "II", false, false),
    padrao("5.11.01", "Resultados assistenciais são publicados para a rede", "III", false, false),
    padrao("5.11.02", "Há projeto de ensino com resultado compartilhado", "III", false, false),
    padrao("5.11.03", "Há ação de uso racional aberta à comunidade", "III", false, false),
  ];

  const cumpridosRodada2 = new Set([
    "5.01.01",
    "5.01.02",
    "5.02.01",
    "5.05.01",
    "5.01.03",
    "5.03.01",
    "5.04.01",
    "5.11.01",
  ]);

  const avaliacao1 = "rodada-1";
  const avaliacao2 = "rodada-2";

  return {
    id: "serra-verde-farmacia",
    instituicao: "Hospital Serra Verde",
    nome: "UGC Farmácia",
    manual: MANUAL_OPERACIONAL,
    catalogoOficial: false,
    estado: "avaliacao",
    historico: [
      {
        de: null,
        para: "rascunho",
        perfil: "admin_ibes",
        motivo: "Abertura do projeto",
        em: "2026-08-01T09:00:00-03:00",
      },
      {
        de: "rascunho",
        para: "diagnostico",
        perfil: "admin_ibes",
        motivo: "Relatório de diagnóstico anexado",
        em: "2026-08-12T14:30:00-03:00",
      },
      {
        de: "diagnostico",
        para: "autoavaliacao",
        perfil: "responsavel_ibes",
        motivo: "Instituição iniciou o registro de evidências",
        em: "2026-08-18T10:00:00-03:00",
      },
      {
        de: "autoavaliacao",
        para: "avaliacao",
        perfil: "responsavel_ibes",
        motivo: "Visita da rodada 2",
        em: "2026-10-03T08:15:00-03:00",
      },
    ],
    diagnostico: {
      avaliador: "Helena Prado",
      data: "2026-08-12",
      anexoNome: "relatorio-diagnostico-serra-verde.pdf",
    },
    naoAplicaveis: [{ padraoId: "5.06.02", origem: "diagnostico" }],
    padroes,
    avaliacoes: [
      {
        id: avaliacao1,
        rodada: 1,
        tipo: "certificacao",
        conformidades: {
          "5.01.01": true,
          "5.01.02": false,
          "5.02.01": true,
          "5.05.01": true,
          "5.01.03": false,
          "5.03.01": true,
          "5.04.01": false,
          "5.06.01": false,
          "5.11.01": false,
          "5.11.02": false,
          "5.11.03": false,
        },
      },
      {
        id: avaliacao2,
        rodada: 2,
        tipo: "certificacao",
        conformidades: Object.fromEntries(
          padroes
            .filter((item) => item.id !== "5.06.02")
            .map((item) => [item.id, cumpridosRodada2.has(item.id)]),
        ),
      },
    ],
    evidencias: [
      {
        id: "ev-1",
        padraoId: "5.01.02",
        avaliacaoId: avaliacao1,
        rodada: 1,
        descricao: "POP de dispensação revisado em março, com checklist de identificação.",
        criadaEm: "2026-09-02T11:20:00-03:00",
      },
      {
        id: "ev-2",
        padraoId: "5.01.02",
        avaliacaoId: avaliacao2,
        rodada: 2,
        descricao: "Observação de 8 dispensações em 02/10. A identificação foi conferida em todas.",
        criadaEm: "2026-10-03T16:40:00-03:00",
      },
      {
        id: "ev-3",
        padraoId: "5.04.01",
        avaliacaoId: avaliacao2,
        rodada: 2,
        descricao: "Amostra de 30 prescrições com dispensação e devolução localizáveis no sistema.",
        criadaEm: "2026-10-03T17:05:00-03:00",
      },
    ],
  };
}

export function entradaDaAvaliacao(projeto: Projeto, avaliacaoId: string): EntradaNivel {
  const avaliacao = projeto.avaliacoes.find((item) => item.id === avaliacaoId);
  if (!avaliacao) throw new Error("avaliação inexistente");
  const excluidos = new Set(projeto.naoAplicaveis.map((item) => item.padraoId));
  return {
    manual: projeto.manual,
    tipo: avaliacao.tipo,
    limiares: LIMIARES_ME_5_1_07,
    padroes: projeto.padroes.map((padrao) => ({
      id: padrao.id,
      grupo: padrao.grupo,
      obrigatorio: padrao.obrigatorio,
      imprescindivel: padrao.imprescindivel,
      naoAplicavel: excluidos.has(padrao.id),
      cumprido: avaliacao.conformidades[padrao.id] === true,
    })),
  };
}

export function nivelDaAvaliacao(projeto: Projeto, avaliacaoId: string): ResultadoNivel {
  return calcularNivel(entradaDaAvaliacao(projeto, avaliacaoId));
}

export function padroesVisiveis(projeto: Projeto, perfil: Perfil): PadraoCatalogo[] {
  if (podeVerNaoAplicaveis(perfil)) return projeto.padroes;
  const ocultos = new Set(projeto.naoAplicaveis.map((item) => item.padraoId));
  return projeto.padroes.filter((padrao) => !ocultos.has(padrao.id));
}

export function alterarEstado(
  projeto: Projeto,
  perfil: Perfil,
  estado: EstadoProjeto,
  motivo: string,
  em: string,
): Projeto {
  if (estadoExigePerfilTerminal(estado) && !podeDefinirEstadoTerminal(perfil)) {
    throw new Error(
      `apenas admin_ibes e responsavel_ibes podem alterar o estado para ${estado}`,
    );
  }
  const texto = motivo.trim();
  if (!texto) throw new Error("a mudança de estado exige um motivo, gravado no histórico");
  if (estado === projeto.estado) return projeto;
  return {
    ...projeto,
    estado,
    historico: [
      ...projeto.historico,
      { de: projeto.estado, para: estado, perfil, motivo: texto, em },
    ],
  };
}

export function definirTipo(
  projeto: Projeto,
  avaliacaoId: string,
  tipo: TipoAvaliacao,
): Projeto {
  return {
    ...projeto,
    avaliacoes: projeto.avaliacoes.map((avaliacao) =>
      avaliacao.id === avaliacaoId ? { ...avaliacao, tipo } : avaliacao,
    ),
  };
}

export function definirCumprido(
  projeto: Projeto,
  avaliacaoId: string,
  padraoId: string,
  cumprido: boolean,
): Projeto {
  if (projeto.naoAplicaveis.some((item) => item.padraoId === padraoId)) {
    throw new Error("padrão não aplicável não recebe conformidade");
  }
  return {
    ...projeto,
    avaliacoes: projeto.avaliacoes.map((avaliacao) => {
      if (avaliacao.id !== avaliacaoId) return avaliacao;
      return {
        ...avaliacao,
        conformidades: { ...avaliacao.conformidades, [padraoId]: cumprido },
      };
    }),
  };
}

export function abrirRodada(projeto: Projeto, perfil: Perfil): Projeto {
  if (!podeAbrirRodada(perfil)) {
    throw new Error("a instituição não abre rodada de avaliação");
  }
  const ultima = projeto.avaliacoes.reduce((maior, avaliacao) =>
    avaliacao.rodada > maior.rodada ? avaliacao : maior,
  );
  const nova: Avaliacao = {
    id: `rodada-${ultima.rodada + 1}-${crypto.randomUUID()}`,
    rodada: ultima.rodada + 1,
    tipo: ultima.tipo,
    conformidades: {},
  };
  return { ...projeto, avaliacoes: [...projeto.avaliacoes, nova] };
}

export function adicionarEvidencia(
  projeto: Projeto,
  avaliacaoId: string,
  padraoId: string,
  descricao: string,
  criadaEm: string,
): Projeto {
  const avaliacao = projeto.avaliacoes.find((item) => item.id === avaliacaoId);
  if (!avaliacao) throw new Error("avaliação inexistente");
  const texto = descricao.trim();
  if (!texto) throw new Error("a evidência precisa de uma descrição");
  if (projeto.naoAplicaveis.some((item) => item.padraoId === padraoId)) {
    throw new Error("padrão não aplicável não recebe evidência nesta tela");
  }
  const evidencia: Evidencia = {
    id: `ev-${crypto.randomUUID()}`,
    padraoId,
    avaliacaoId,
    rodada: avaliacao.rodada,
    descricao: texto,
    criadaEm,
  };
  return { ...projeto, evidencias: [...projeto.evidencias, evidencia] };
}

export function marcarNaoAplicavel(
  projeto: Projeto,
  perfil: Perfil,
  padraoId: string,
  origem: string,
): Projeto {
  if (!podeRegistrarNaoAplicavel(perfil)) {
    throw new Error("perfis da instituição não registram padrão não aplicável");
  }
  if (!origemNaoAplicavelAdmitida(origem)) {
    throw new Error("a origem de padrão não aplicável é diagnostico");
  }
  if (!projeto.diagnostico.anexoNome || !projeto.diagnostico.avaliador || !projeto.diagnostico.data) {
    throw new Error("o não aplicável depende do diagnóstico do projeto");
  }
  if (projeto.naoAplicaveis.some((item) => item.padraoId === padraoId)) return projeto;
  return {
    ...projeto,
    naoAplicaveis: [...projeto.naoAplicaveis, { padraoId, origem }],
    avaliacoes: projeto.avaliacoes.map((avaliacao) => {
      const conformidades = { ...avaliacao.conformidades };
      delete conformidades[padraoId];
      return { ...avaliacao, conformidades };
    }),
  };
}

export function retirarNaoAplicavel(projeto: Projeto, perfil: Perfil, padraoId: string): Projeto {
  if (!podeRegistrarNaoAplicavel(perfil)) {
    throw new Error("perfis da instituição não alteram padrão não aplicável");
  }
  return {
    ...projeto,
    naoAplicaveis: projeto.naoAplicaveis.filter((item) => item.padraoId !== padraoId),
  };
}

export function atualizarDiagnostico(projeto: Projeto, diagnostico: Diagnostico): Projeto {
  if (!diagnostico.avaliador.trim() || !diagnostico.data || !diagnostico.anexoNome.trim()) {
    throw new Error("o diagnóstico registra avaliador, data e anexo do relatório");
  }
  return {
    ...projeto,
    diagnostico: {
      avaliador: diagnostico.avaliador.trim(),
      data: diagnostico.data,
      anexoNome: diagnostico.anexoNome.trim(),
    },
  };
}

function padrao(
  codigo: string,
  titulo: string,
  grupo: Grupo,
  obrigatorio: boolean,
  imprescindivel: boolean,
): PadraoCatalogo {
  return { id: codigo, codigo, titulo, grupo, obrigatorio, imprescindivel };
}
