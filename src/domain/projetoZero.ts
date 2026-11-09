import { prazoAutoavaliacao } from "@/lib/regras/prazos";

/**
 * PENDÊNCIA 48: o código nasce sugerido e pode ser editado.
 * Quem cria, nesta versão, é Administrador ou Backoffice.
 * responsavel_ibes continua valendo como apelido do Backoffice (pendência 49).
 */
const PERFIS_CRIAR = new Set(["admin_ibes", "backoffice_ibes", "responsavel_ibes"]);

export type OrigemProjeto = "zero" | "candidatura";

export type EntradaProjetoZero = {
  codigo: string;
  instituicao: string;
  unidade: string;
  tipoUnidade: string | null;
  grupo: string | null;
  manualId: string;
  abertura: string;
  origem: OrigemProjeto;
};

export function podeCriarProjeto(perfil: string): boolean {
  return PERFIS_CRIAR.has(perfil);
}

export function codigoEditavelValido(codigo: string): boolean {
  return /^[0-9]{4}\/[0-9]{3}$/.test(codigo);
}

export function sugerirCodigo(ano: number, codigos: readonly string[]): string {
  const usados = new Set(
    codigos.filter((codigo) => codigo.startsWith(`${ano}/`)).map((codigo) => codigo.replace(/-C$/, "")),
  );
  let numero = 1;
  let sugerido = "";
  do {
    sugerido = `${ano}/${String(numero).padStart(3, "0")}`;
    numero += 1;
  } while (usados.has(sugerido));
  return sugerido;
}

export function codigoRepetido(codigo: string, existentes: readonly string[]): boolean {
  return existentes.includes(codigo);
}

export function deCandidatura(
  candidatura: { codigo: string; instituicao: string; unidade: string },
  resto: Omit<EntradaProjetoZero, "codigo" | "instituicao" | "unidade" | "origem">,
): EntradaProjetoZero {
  return {
    ...resto,
    codigo: candidatura.codigo,
    instituicao: candidatura.instituicao,
    unidade: candidatura.unidade,
    origem: "candidatura",
  };
}

export function montarProjetoDoZero(entrada: EntradaProjetoZero) {
  if (!codigoEditavelValido(entrada.codigo)) {
    throw new Error("Código de projeto inválido. Use AAAA/NNN.");
  }
  if (!entrada.instituicao.trim() || !entrada.unidade.trim()) {
    throw new Error("Informe a instituição e a unidade.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.abertura)) {
    throw new Error("Data de abertura inválida.");
  }
  return {
    codigo: entrada.codigo,
    instituicao: entrada.instituicao.trim(),
    unidade: entrada.unidade.trim(),
    tipoUnidade: entrada.tipoUnidade,
    grupo: entrada.grupo,
    manualId: entrada.manualId,
    abertura: entrada.abertura,
    origem: entrada.origem,
    estado: "diagnostico" as const,
    biblioteca: [] as const,
    prazo: prazoAutoavaliacao(entrada.abertura),
    email: {
      destinatario: "Responsável do projeto",
      assunto: `Projeto ${entrada.codigo} aberto na etapa Diagnóstico`,
      enviado: false as const,
    },
  };
}
