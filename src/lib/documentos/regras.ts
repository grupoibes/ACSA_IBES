import { createHash } from "node:crypto";

/**
 * PENDÊNCIA 47: 25 MB e a recusa de .zip e executáveis são provisórios.
 * O lote histórico não passa por este limite.
 */
export const LIMITE_ARQUIVO_NOVO_BYTES = 25 * 1024 * 1024;

/** file_size_limit provisório do bucket documentos. O plano Pro tem 100 GB. */
export const LIMITE_BUCKET_BYTES = 500 * 1024 * 1024;

export const URL_ASSINADA_SEGUNDOS = 120;

const EXTENSOES_BLOQUEADAS = new Set([
  "zip",
  "exe",
  "bat",
  "cmd",
  "com",
  "msi",
  "dll",
  "scr",
  "js",
  "sh",
  "ps1",
  "jar",
]);

const EXTENSOES_ACEITAS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "mp3",
  "txt",
]);

export function extensao(nome: string): string {
  const ponto = nome.lastIndexOf(".");
  if (ponto <= 0) return "";
  return nome.slice(ponto + 1).toLowerCase();
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function nomeNoCaminho(nome: string): string {
  return nome.replace(/[\\/]/g, "_").replace(/^\.+/, "") || "arquivo";
}

/** Arquivo novo: projeto/{id}/documentos/{doc}/v{n}/{arquivo}. */
export function caminhoVersao(projetoId: string, documentoId: string, versao: number, nome: string): string {
  return `projeto/${projetoId}/documentos/${documentoId}/v${versao}/${nomeNoCaminho(nome)}`;
}

export function arquivoNovoAceito(tamanho: number, nome: string): string | null {
  if (tamanho <= 0) return "O arquivo está vazio.";
  if (tamanho > LIMITE_ARQUIVO_NOVO_BYTES) return "O arquivo passa de 25 MB.";
  const tipo = extensao(nome);
  if (EXTENSOES_BLOQUEADAS.has(tipo)) return "Este tipo de arquivo não é aceito.";
  if (!EXTENSOES_ACEITAS.has(tipo)) return "Informe um arquivo com tipo aceito.";
  return null;
}
