import {
  ESTADOS_TERMINAIS,
  PERFIS_ESTADO_TERMINAL,
  PERFIS_INSTITUICAO,
  type EstadoProjeto,
  type OrigemNaoAplicavel,
  type Perfil,
} from "@/domain/manuais";

export function perfilInstituicao(perfil: Perfil): boolean {
  return (PERFIS_INSTITUICAO as readonly Perfil[]).includes(perfil);
}

/** Espelho da policy de padroes_nao_aplicaveis: instituição não lê a tabela. */
export function podeVerNaoAplicaveis(perfil: Perfil): boolean {
  return !perfilInstituicao(perfil);
}

export function podeRegistrarNaoAplicavel(perfil: Perfil): boolean {
  return podeVerNaoAplicaveis(perfil);
}

export function podeDefinirEstadoTerminal(perfil: Perfil): boolean {
  return (PERFIS_ESTADO_TERMINAL as readonly Perfil[]).includes(perfil);
}

export function podeEditarDiagnostico(perfil: Perfil): boolean {
  return !perfilInstituicao(perfil);
}

export function podeAbrirRodada(perfil: Perfil): boolean {
  return !perfilInstituicao(perfil);
}

export function estadoExigePerfilTerminal(estado: EstadoProjeto): boolean {
  return (ESTADOS_TERMINAIS as readonly EstadoProjeto[]).includes(estado);
}

export function origemNaoAplicavelAdmitida(origem: string): origem is OrigemNaoAplicavel {
  return origem === "diagnostico";
}

/** Ausente deixou de ser resultado de conformidade em 26/10. */
export function conformidadePermitida(valor: string): valor is "cumprido" | "nao_cumprido" {
  return valor === "cumprido" || valor === "nao_cumprido";
}
