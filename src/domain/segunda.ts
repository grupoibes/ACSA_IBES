import type { ResultadoPadrao } from "@/domain/evidencia";
import { resultadoContaNoNumerador } from "@/domain/evidencia";
import { ehPerfilIbes, perfilCanonico } from "@/domain/leituraDocumento";
import { exigeJustificativaNivel, podeResolver, type ParecerComite } from "@/lib/regras/comite";

/** PENDÊNCIA 51: a restrição continua depois da visita? Hoje o padrão é 5 semanas antes e 0 depois. */
export const RESTRICAO_SEMANAS_ANTES = 5;
export const RESTRICAO_SEMANAS_DEPOIS = 0;

/** PENDÊNCIA 52: 40 usuários é limite rígido ou volume esperado? Hoje é configuração e não bloqueia. */
export const LIMITE_USUARIOS_PADRAO = 40;

export const VOTOS_COMITE = ["conceder", "nao_conceder", "pedir_resposta"] as const;
export type VotoComite = (typeof VOTOS_COMITE)[number];

export const NIVELS = ["avancado", "otimo", "excelente"] as const;
export type NivelPedido = (typeof NIVELS)[number];

export function somarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
  const y = data.getUTCFullYear();
  const m = String(data.getUTCMonth() + 1).padStart(2, "0");
  const d = String(data.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Da data agendada para trás (semanas antes) até a própria visita mais as semanas depois. Os dois extremos entram. */
export function janelaRestricao(
  dataVisita: string,
  semanasAntes = RESTRICAO_SEMANAS_ANTES,
  semanasDepois = RESTRICAO_SEMANAS_DEPOIS,
): { inicio: string; fim: string } {
  return {
    inicio: somarDias(dataVisita, -semanasAntes * 7),
    fim: somarDias(dataVisita, semanasDepois * 7),
  };
}

export function clienteNaRestricao(
  hoje: string,
  dataVisita: string | null,
  perfil: string,
  semanasAntes = RESTRICAO_SEMANAS_ANTES,
  semanasDepois = RESTRICAO_SEMANAS_DEPOIS,
): boolean {
  if (ehPerfilIbes(perfil) || !dataVisita) return false;
  const janela = janelaRestricao(dataVisita, semanasAntes, semanasDepois);
  return hoje >= janela.inicio && hoje <= janela.fim;
}

export function avisoLimiteUsuarios(ativos: number, limite: number, perfil: string): string | null {
  if (ativos <= limite) return null;
  const canonico = perfilCanonico(perfil);
  if (canonico !== "backoffice_ibes" && canonico !== "admin_ibes") return null;
  return `A organização passou de ${limite} usuários ativos e está com ${ativos}. O cadastro segue aberto.`;
}

export function podeVerRequisitos(perfil: string): boolean {
  return ehPerfilIbes(perfil);
}

export function podeRegistrarResultado(perfil: string): boolean {
  const canonico = perfilCanonico(perfil);
  return canonico === "avaliador_ibes" || canonico === "avaliador_lider";
}

export function podeConsolidarPontos(perfil: string): boolean {
  return perfilCanonico(perfil) === "avaliador_lider";
}

export function podeAgendar(perfil: string): boolean {
  const canonico = perfilCanonico(perfil);
  return canonico === "backoffice_ibes" || canonico === "admin_ibes";
}

export function podeParecer(perfil: string): boolean {
  return perfilCanonico(perfil) === "membro_comite";
}

export function votoValido(voto: string): voto is VotoComite {
  return (VOTOS_COMITE as readonly string[]).includes(voto);
}

export function nivelValido(nivel: string): nivel is NivelPedido {
  return (NIVELS as readonly string[]).includes(nivel);
}

/** Certificação grava cumpre ou nao_cumpre. Manutenção grava mantem ou nao_mantem. */
export function resultadoPermitido(tipo: "certificacao" | "manutencao" | "recertificacao", resultado: ResultadoPadrao): boolean {
  if (resultado === "pendente") return true;
  if (tipo === "manutencao") return resultado === "mantem" || resultado === "nao_mantem";
  return resultado === "cumpre" || resultado === "nao_cumpre";
}

/** O resultado gravado pelo avaliador prevalece sobre o Cumpre da autoavaliação. */
export function resultadoPrevalente(avaliador: ResultadoPadrao | null): ResultadoPadrao | null {
  return avaliador;
}

export function contaAvaliador(resultado: ResultadoPadrao | null): boolean {
  return resultadoContaNoNumerador(resultado);
}

export type PontoRegistro = {
  id: string;
  avaliacaoId: string;
  tipo: "forte" | "fraco";
  texto: string;
  autorId: string;
  consolidado: boolean;
};

/** Só o que o avaliador líder consolidou entra no relatório. */
export function pontosDoRelatorio(pontos: readonly PontoRegistro[]): PontoRegistro[] {
  return pontos.filter((ponto) => ponto.consolidado);
}

export type LinhaRelatorio = {
  codigo: string;
  titulo: string;
  resultado: ResultadoPadrao | null;
  observacao: string;
};

export function textoRelatorio(entrada: {
  codigo: string;
  instituicao: string;
  rodada: number;
  tipo: string;
  dataVisita: string | null;
  resultadoRodada: string;
  linhas: readonly LinhaRelatorio[];
  pontos: readonly PontoRegistro[];
  nivel: string;
}): string {
  const pontos = pontosDoRelatorio(entrada.pontos);
  const fortes = pontos.filter((ponto) => ponto.tipo === "forte").map((ponto) => ponto.texto);
  const fracos = pontos.filter((ponto) => ponto.tipo === "fraco").map((ponto) => ponto.texto);
  const verificados = entrada.linhas.filter((linha) => linha.resultado && linha.resultado !== "pendente");
  return [
    "Relatório de avaliação",
    `Projeto ${entrada.codigo} · ${entrada.instituicao}`,
    `Rodada ${entrada.rodada} · ${entrada.tipo} · visita ${entrada.dataVisita ?? "sem data"}`,
    `Resultado da rodada: ${entrada.resultadoRodada}`,
    "",
    "Padrões verificados",
    ...(verificados.length
      ? verificados.map((linha) => `${linha.codigo} · ${linha.titulo} · ${linha.resultado} · ${linha.observacao || "sem observação"}`)
      : ["Nenhum padrão verificado pelo avaliador."]),
    "",
    "Pontos consolidados",
    `Fortes: ${fortes.length ? fortes.join(" ") : "nenhum"}`,
    `Fracos: ${fracos.length ? fracos.join(" ") : "nenhum"}`,
    "",
    `Nível calculado: ${entrada.nivel}`,
    "Texto de demonstração. Nenhum enunciado de manual entra neste relatório.",
  ].join("\n");
}

export function pdfDeTexto(texto: string): Uint8Array {
  const seguro = texto
    .replace(/[^\x20-\x7E\n]/g, " ")
    .split("\n")
    .map((linha, indice) => `(${linha.replace(/[()\\]/g, " ")} ) Tj T*`)
    .join(" ");
  const fluxo = `BT /F1 11 Tf 48 760 Td 14 TL ${seguro} ET`;
  const objetos = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${fluxo.length} >> stream\n${fluxo}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];
  let corpo = "%PDF-1.4\n";
  const offsets = [0];
  for (const objeto of objetos) {
    offsets.push(corpo.length);
    corpo += objeto;
  }
  const xref = corpo.length;
  let tabela = `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (let indice = 1; indice < offsets.length; indice += 1) {
    tabela += `${String(offsets[indice]).padStart(10, "0")} 00000 n \n`;
  }
  corpo += `${tabela}trailer << /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(corpo);
}

export function resolucaoPermitida(
  pareceres: readonly ParecerComite[],
  nivelFinal: string | null,
  nivelCalculado: string | null,
  justificativa: string,
): string | null {
  const consenso = podeResolver([...pareceres]);
  if (!consenso.liberado) return consenso.motivo === "SEM_CONSENSO" ? "Sem consenso." : "Faltam pareceres.";
  if (exigeJustificativaNivel(nivelFinal, nivelCalculado) && !justificativa.trim()) {
    return "A justificativa é obrigatória quando o nível final difere do calculado.";
  }
  return null;
}

export const MANUAIS_MIGRACAO = [
  { codigo: "ME 2 1_05", nome: "Centros hospitalares", padroes: 144, anexos: "nenhum", elementos: 456, requisitos: 523 },
  { codigo: "ME 5 1_07", nome: "Unidades de gestão clínica", padroes: 159, anexos: "Laboratório, Hemodiálise e Imagem", elementos: 425, requisitos: 628 },
  { codigo: "ME 28 1_01", nome: "Centros sem internação", padroes: 118, anexos: "Diálise e Imagem", elementos: 342, requisitos: 320 },
] as const;

export const INVENTARIO_PROJETOS = 72;

export const ETAPAS_MIGRACAO = [
  { nome: "Manuais contados", situacao: "Concluído" },
  { nome: "Inventário de projetos", situacao: "Concluído" },
  { nome: "Leitura do staging por projeto", situacao: "Em demonstração" },
  { nome: "Exportação formal", situacao: "Em negociação" },
  { nome: "Anexos da exportação", situacao: "A fazer" },
] as const;

export type TipoAvaliacaoSegunda = "certificacao" | "manutencao" | "recertificacao";
export type ResultadoRodada = "em_curso" | "positiva" | "negativa";

export type AvaliacaoRegistro = {
  id: string;
  projetoId: string;
  rodada: number;
  tipo: TipoAvaliacaoSegunda;
  resultado: ResultadoRodada;
  dataVisita: string | null;
  liderId: string | null;
  resultadoPositivoEm: string | null;
};

export type ResultadoAvaliador = {
  id: string;
  avaliacaoId: string;
  padraoId: string;
  resultado: ResultadoPadrao;
  observacao: string;
};

export type ParecerRegistro = {
  id: string;
  avaliacaoId: string;
  membroId: string;
  voto: VotoComite;
  nivelProposto: NivelPedido;
  texto: string;
  semConflito: boolean;
};

export type ResolucaoRegistro = {
  id: string;
  avaliacaoId: string;
  projetoId: string;
  numero: string;
  decisao: VotoComite;
  nivelFinal: NivelPedido | null;
  justificativa: string;
  pontuacao: string;
};

export type UpgradeRegistro = {
  id: string;
  projetoId: string;
  nivelPedido: NivelPedido;
  motivo: string;
  situacao: "recebida" | "incluida";
};

export type UsuarioCliente = {
  id: string;
  organizacaoId: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
};

export type StagingProjeto = {
  codigo: string;
  instituicao: string;
  documentos: number;
  vinculos: number;
};

export const ORG_MODELO = "01000000-0000-4000-8000-000000000001";
export const AVALIACAO_2025 = "a1000009-0009-4000-8000-000000000009";
