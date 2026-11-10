export type Papel =
  | "resp"
  | "upload"
  | "conf"
  | "chan"
  | "back"
  | "aval"
  | "lider"
  | "comite"
  | "comite2"
  | "admin";

const CLIENTE: Papel[] = ["resp", "upload", "conf", "chan"];

export function perfilCliente(papel: Papel): boolean {
  return CLIENTE.includes(papel);
}

export function podeRegistrarDiagnostico(papel: Papel): boolean {
  return papel === "back" || papel === "admin";
}

export function podeAlterarEstado(papel: Papel): boolean {
  return papel === "back" || papel === "admin";
}

export function podeAbrirRodada(papel: Papel): boolean {
  return papel === "back" || papel === "admin";
}

export function podeMarcarCumpre(papel: Papel): boolean {
  return papel === "chan" || papel === "resp";
}

export function podeRegistrarParecer(papel: Papel): boolean {
  return papel === "comite" || papel === "comite2";
}

/** Fechado em 28/10: o obrigatório aplicável sai da autoavaliação com Cumpre e evidência chancelada. PENDÊNCIA 50: obrigatório cumprido só por área de melhoria concluída libera a saída da autoavaliação? (hoje: não). */
export function bloqueioAutoavaliacao(obrigatorio: boolean, cumpre: boolean, chancelada: boolean): boolean {
  return obrigatorio && !(cumpre && chancelada);
}
