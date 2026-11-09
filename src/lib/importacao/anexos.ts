import { createHash } from "node:crypto";

export type AnexoIndice = { idFichero: number; nome: string };

export type ArquivoLocal = { nome: string; bytes: Uint8Array };

export type StatusAnexo = "ok" | "ausente" | "html_erro" | "nome_alterado";

export type ResultadoAnexo = {
  idFichero: number;
  status: StatusAnexo;
  arquivoLocal: string | null;
  sha256: string | null;
  mime: string | null;
  objeto: string | null;
  compartilhado: boolean;
};

export type RelatorioAnexos = {
  resultados: ResultadoAnexo[];
  semIndice: string[];
  contagem: { ok: number; ausente: number; htmlErro: number; nomeAlterado: number; compartilhados: number };
};

const INVALIDOS = /[\\/:*?"<>|\u0000-\u001f]/g;

/** Não renomeia o arquivo salvo. Só descreve o nome que a extração deveria ter produzido. */
export function sanitizarNome(nome: string): string {
  return nome.replace(INVALIDOS, "_").replace(/ +/g, " ").replace(/[ .]+$/g, "").slice(0, 120);
}

export function nomeEsperado(idFichero: number, nomeOriginal: string): string {
  return `${idFichero}_${sanitizarNome(nomeOriginal)}`;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function ehHtmlErro(bytes: Uint8Array): boolean {
  if (bytes.length !== 214) return false;
  const inicio = new TextDecoder().decode(bytes.slice(0, 24)).trimStart().toLowerCase();
  return inicio.startsWith("<");
}

export function mimePorConteudo(bytes: Uint8Array, nome: string): string {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (nome.toLowerCase().endsWith(".url.txt")) return "text/plain";
  return "application/octet-stream";
}

function escolher(idFichero: number, nomeOriginal: string, arquivos: ArquivoLocal[]): ArquivoLocal | null {
  const prefixo = `${idFichero}_`;
  const candidatos = arquivos.filter((arquivo) => arquivo.nome.startsWith(prefixo));
  if (!candidatos.length) return null;
  const esperado = nomeEsperado(idFichero, nomeOriginal);
  return candidatos.find((arquivo) => arquivo.nome === esperado) ?? candidatos[0];
}

/** Casa pelo prefixo id_fichero_. O nome original no disco permanece. */
export function casarAnexos(indice: readonly AnexoIndice[], arquivos: readonly ArquivoLocal[]): RelatorioAnexos {
  const usados = new Set<string>();
  const porHash = new Map<string, string>();
  const resultados: ResultadoAnexo[] = indice.map((item) => {
    const arquivo = escolher(item.idFichero, item.nome, arquivos);
    if (!arquivo) {
      return { idFichero: item.idFichero, status: "ausente", arquivoLocal: null, sha256: null, mime: null, objeto: null, compartilhado: false };
    }
    usados.add(arquivo.nome);
    if (ehHtmlErro(arquivo.bytes)) {
      return {
        idFichero: item.idFichero,
        status: "html_erro",
        arquivoLocal: arquivo.nome,
        sha256: null,
        mime: "text/html",
        objeto: null,
        compartilhado: false,
      };
    }
    const hash = sha256(arquivo.bytes);
    const ja = porHash.get(hash);
    const objeto = ja ?? `historico/sha256/${hash}`;
    porHash.set(hash, objeto);
    const status: StatusAnexo = arquivo.nome === nomeEsperado(item.idFichero, item.nome) ? "ok" : "nome_alterado";
    return {
      idFichero: item.idFichero,
      status,
      arquivoLocal: arquivo.nome,
      sha256: hash,
      mime: mimePorConteudo(arquivo.bytes, arquivo.nome),
      objeto,
      compartilhado: Boolean(ja),
    };
  });
  const semIndice = arquivos.map((arquivo) => arquivo.nome).filter((nome) => !usados.has(nome));
  return {
    resultados,
    semIndice,
    contagem: {
      ok: resultados.filter((item) => item.status === "ok").length,
      ausente: resultados.filter((item) => item.status === "ausente").length,
      htmlErro: resultados.filter((item) => item.status === "html_erro").length,
      nomeAlterado: resultados.filter((item) => item.status === "nome_alterado").length,
      compartilhados: resultados.filter((item) => item.compartilhado).length,
    },
  };
}
