import { criarRepoBancoDeUrl } from "@/lib/persistencia/banco";
import { repoSessaoGlobal } from "@/lib/persistencia/sessao";
import type { Repo } from "@/lib/persistencia/tipos";

const globalRepo = globalThis as unknown as { __acsasRepo?: Repo };

export async function obterRepo(): Promise<Repo> {
  if (globalRepo.__acsasRepo) return globalRepo.__acsasRepo;
  const url = process.env.ACSAS_DATABASE_URL;
  globalRepo.__acsasRepo = url ? await criarRepoBancoDeUrl(url) : repoSessaoGlobal();
  return globalRepo.__acsasRepo;
}
