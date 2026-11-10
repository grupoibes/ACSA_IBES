import { perfilCanonico } from "@/domain/leituraDocumento";

/**
 * Chancela da evidência e da área de melhoria.
 * Administrador, Backoffice, Tutor, Avaliador e Avaliador líder.
 * O Comitê aprova a resolução, não a evidência. O Autorizador confere e não chancela.
 */
const CHANCELA = new Set([
  "admin_ibes",
  "backoffice_ibes",
  "tutor_relatorio",
  "avaliador_ibes",
  "avaliador_lider",
]);

const CONFERE = new Set([
  "admin_ibes",
  "backoffice_ibes",
  "educador",
  "tutor_relatorio",
  "avaliador_lider",
  "avaliador_ibes",
  "conferente",
  "autorizador",
]);

const ENVIA = new Set([
  "admin_ibes",
  "backoffice_ibes",
  "avaliador_lider",
  "avaliador_ibes",
  "responsavel_projeto",
  "responsavel_upload",
  "autorizador",
]);

const PLANO = new Set(["responsavel_projeto", "responsavel_upload"]);

export function podeChancelarEvidencia(perfil: string): boolean {
  return CHANCELA.has(perfilCanonico(perfil));
}

/** A área de melhoria usa a mesma função da evidência. */
export function podeChancelarArea(perfil: string): boolean {
  return podeChancelarEvidencia(perfil);
}

export function podeConferirEvidencia(perfil: string): boolean {
  return CONFERE.has(perfilCanonico(perfil));
}

export function podeEnviarEvidencia(perfil: string): boolean {
  return ENVIA.has(perfilCanonico(perfil));
}

export function podeTrabalharPlano(perfil: string): boolean {
  return PLANO.has(perfilCanonico(perfil));
}

export function podeMarcarCumprePerfil(perfil: string): boolean {
  const canonico = perfilCanonico(perfil);
  return canonico === "autorizador" || canonico === "responsavel_projeto";
}

export function podeDiagnosticar(perfil: string): boolean {
  const canonico = perfilCanonico(perfil);
  return canonico === "admin_ibes" || canonico === "backoffice_ibes";
}

export function podeAvancarEtapa(perfil: string): boolean {
  return podeDiagnosticar(perfil);
}
