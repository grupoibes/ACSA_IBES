import { prazoAutoavaliacao } from "@/lib/regras/prazos";

export type SeloOrigem = "Criado do zero" | "IBES" | "ACSA (migrado)" | "—" | `Complementar de ${string}`;

export type LinhaIndice = {
  id: string;
  codigo: string;
  cliente: string;
  manual: string;
  etapa: string;
  prazoEtapa: string;
  vencimento: string | null;
  selo: SeloOrigem | string;
  abre: boolean;
  situacao: "Vencido" | "No prazo" | `Vence em ${number} dias`;
  classeSituacao: "bad" | "ok" | "warn";
};

export function diasEntre(hoje: string, alvo: string): number {
  const a = Date.parse(`${hoje}T12:00:00Z`);
  const b = Date.parse(`${alvo}T12:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function situacaoDaLinha(hoje: string, prazoEtapa: string, vencimento: string | null): Pick<LinhaIndice, "situacao" | "classeSituacao"> {
  const dias = diasEntre(hoje, vencimento ?? prazoEtapa);
  if (dias < 0) return { situacao: "Vencido", classeSituacao: "bad" };
  if (dias <= 60) return { situacao: `Vence em ${dias} dias`, classeSituacao: "warn" };
  return { situacao: "No prazo", classeSituacao: "ok" };
}

/** Busca em código, cliente e manual. A linha que fica conserva o selo. */
export function filtrarIndice(linhas: readonly LinhaIndice[], busca: string): LinhaIndice[] {
  const texto = busca.trim().toLowerCase();
  if (!texto) return [...linhas];
  return linhas.filter((linha) =>
    [linha.codigo, linha.cliente, linha.manual].some((campo) => campo.toLowerCase().includes(texto)),
  );
}

export function janelaCalculada(abertura: string): { abertura: string; fim: string } {
  return { abertura, fim: prazoAutoavaliacao(abertura) };
}

const PERFIS_IBES = new Set([
  "admin_ibes",
  "backoffice_ibes",
  "educador",
  "tutor_relatorio",
  "membro_comite",
  "avaliador_lider",
  "avaliador_ibes",
  "responsavel_ibes",
]);

export function perfilEnxergaTodos(perfil: string): boolean {
  return PERFIS_IBES.has(perfil);
}

export function linhasVisiveis(
  linhas: readonly LinhaIndice[],
  perfil: string,
  projetosDoUsuario: readonly string[],
): LinhaIndice[] {
  if (perfilEnxergaTodos(perfil)) return [...linhas];
  const meus = new Set(projetosDoUsuario);
  return linhas.filter((linha) => meus.has(linha.id));
}
