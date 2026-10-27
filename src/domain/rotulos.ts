import type {
  EstadoProjeto,
  Grupo,
  Nivel,
  Perfil,
  TipoAvaliacao,
} from "@/domain/manuais";

export const ROTULO_PERFIL: Record<Perfil, string> = {
  admin_ibes: "Admin IBES",
  responsavel_ibes: "Responsável IBES",
  avaliador_ibes: "Avaliador IBES",
  membro_comite: "Membro do comitê",
  gestor_instituicao: "Gestor da instituição",
  profissional_instituicao: "Profissional da instituição",
};

export const ROTULO_NIVEL: Record<Nivel, string> = {
  avancado: "Avançada",
  otimo: "Ótima",
  excelente: "Excelente",
};

export const ROTULO_TIPO: Record<TipoAvaliacao, string> = {
  certificacao: "Certificação",
  manutencao: "Manutenção",
  recertificacao: "Recertificação",
};

export const ROTULO_ESTADO: Record<EstadoProjeto, string> = {
  rascunho: "Rascunho",
  diagnostico: "Diagnóstico",
  autoavaliacao: "Autoavaliação",
  avaliacao: "Avaliação",
  comite: "Comitê",
  certificado: "Certificado",
  recusado: "Recusado",
  abandonado: "Abandonado",
};

export const ROTULO_GRUPO: Record<Grupo, string> = {
  I: "Grupo I",
  II: "Grupo II",
  III: "Grupo III",
};

export function formatarData(isoDate: string): string {
  const [ano, mes, dia] = isoDate.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}
