import { URL_ASSINADA_SEGUNDOS } from "./regras";

export type StoragePort = {
  put(caminho: string, bytes: Uint8Array, mime: string): Promise<void>;
  get(caminho: string): Promise<Uint8Array | null>;
  signedUrl(caminho: string, segundos?: number): Promise<string>;
};

export function storageEmMemoria(): StoragePort {
  const objetos = new Map<string, { bytes: Uint8Array; mime: string }>();
  return {
    async put(caminho, bytes, mime) {
      objetos.set(caminho, { bytes, mime });
    },
    async get(caminho) {
      const objeto = objetos.get(caminho);
      return objeto ? objeto.bytes : null;
    },
    async signedUrl(caminho, segundos = URL_ASSINADA_SEGUNDOS) {
      return `memoria://documentos/${caminho}?expira=${segundos}`;
    },
  };
}

function storageSupabase(url: string, chave: string): StoragePort {
  const raiz = url.replace(/\/$/, "");
  const objeto = `${raiz}/storage/v1/object/documentos`;
  return {
    async put(caminho, bytes, mime) {
      const resposta = await fetch(`${objeto}/${caminho}`, {
        method: "POST",
        headers: { authorization: `Bearer ${chave}`, "content-type": mime, "x-upsert": "true" },
        body: Buffer.from(bytes),
      });
      if (!resposta.ok) throw new Error(`Storage recusou o arquivo (${resposta.status}).`);
    },
    async get(caminho) {
      const resposta = await fetch(`${objeto}/${caminho}`, { headers: { authorization: `Bearer ${chave}` } });
      if (resposta.status === 404) return null;
      if (!resposta.ok) throw new Error(`Storage não devolveu o arquivo (${resposta.status}).`);
      return new Uint8Array(await resposta.arrayBuffer());
    },
    async signedUrl(caminho, segundos = URL_ASSINADA_SEGUNDOS) {
      const resposta = await fetch(`${raiz}/storage/v1/object/sign/documentos/${caminho}`, {
        method: "POST",
        headers: { authorization: `Bearer ${chave}`, "content-type": "application/json" },
        body: JSON.stringify({ expiresIn: segundos }),
      });
      if (!resposta.ok) throw new Error(`Storage não assinou a URL (${resposta.status}).`);
      const corpo = (await resposta.json()) as { signedURL?: string };
      if (!corpo.signedURL) throw new Error("Storage não assinou a URL.");
      return corpo.signedURL.startsWith("http") ? corpo.signedURL : `${raiz}${corpo.signedURL}`;
    },
  };
}

const CHAVE_MEMORIA = "__acsasStorageMemoria";

type GlobalComStorage = typeof globalThis & { [CHAVE_MEMORIA]?: StoragePort };

/** Sem credencial, a homologação usa um único mapa no processo. Com as duas variáveis, usa o bucket documentos. */
export function criarStorage(env: { url?: string; chave?: string } = {}): { nome: "memoria" | "supabase"; port: StoragePort } {
  if (env.url && env.chave) return { nome: "supabase", port: storageSupabase(env.url, env.chave) };
  const global = globalThis as GlobalComStorage;
  if (!global[CHAVE_MEMORIA]) global[CHAVE_MEMORIA] = storageEmMemoria();
  return { nome: "memoria", port: global[CHAVE_MEMORIA] };
}

export function reiniciarStorageMemoria(): void {
  delete (globalThis as GlobalComStorage)[CHAVE_MEMORIA];
}
