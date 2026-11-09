import { URL_ASSINADA_SEGUNDOS, arquivoNovoAceito, caminhoVersao, sha256 } from "./regras";
import type { StoragePort } from "./storage";

export type ArquivoJaNoProjeto = { sha256: string; caminho: string };

export type ArquivoRecebido = {
  caminho: string;
  sha256: string;
  url: string;
  compartilhado: boolean;
};

/**
 * Evidência e diagnóstico usam esta mesma entrada.
 * Upload novo recusa duplicata no projeto. O lote histórico compartilha o objeto.
 */
export async function receberArquivo(
  entrada: {
    projetoId: string;
    documentoId: string;
    versao: number;
    nome: string;
    bytes: Uint8Array;
    mime: string;
    historico: boolean;
    jaNoProjeto: readonly ArquivoJaNoProjeto[];
    storage: StoragePort;
  },
): Promise<ArquivoRecebido> {
  const hash = sha256(entrada.bytes);
  const existente = entrada.jaNoProjeto.find((item) => item.sha256 === hash);
  if (existente && !entrada.historico) {
    throw new Error("Este arquivo já está no projeto.");
  }
  if (!entrada.historico) {
    const recusa = arquivoNovoAceito(entrada.bytes.byteLength, entrada.nome);
    if (recusa) throw new Error(recusa);
  }
  const caminho = existente?.caminho ?? caminhoVersao(entrada.projetoId, entrada.documentoId, entrada.versao, entrada.nome);
  if (!existente) await entrada.storage.put(caminho, entrada.bytes, entrada.mime);
  const url = await entrada.storage.signedUrl(caminho, URL_ASSINADA_SEGUNDOS);
  return { caminho, sha256: hash, url, compartilhado: Boolean(existente) };
}
