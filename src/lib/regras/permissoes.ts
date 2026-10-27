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

/** PENDÊNCIA 12: bloqueio provisório exige obrigatório respondido e com evidência chancelada. */
export function bloqueioAutoavaliacao(obrigatorio: boolean, respondido: boolean, chancelada: boolean): boolean {
  return obrigatorio && !(respondido && chancelada);
}
