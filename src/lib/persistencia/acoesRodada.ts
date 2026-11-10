import { randomUUID } from "node:crypto";
import {
  podeAvancarEtapa,
  podeChancelarArea,
  podeConferirEvidencia,
  podeDiagnosticar,
  podeEnviarEvidencia,
  podeTrabalharPlano,
} from "@/domain/chancela";
import { podeLerDocumento, perfilCanonico } from "@/domain/leituraDocumento";
import {
  cicloValido,
  cumprePermitido,
  montarPainel,
  podeExecutarAcaoArea,
  type AcaoArea,
  type AreaRegistro,
  type Ciclo,
  type DiagnosticoRegistro,
  type EvidenciaRegistro,
  type PainelRodada,
} from "@/domain/rodada";
import { ErroHttp, type Ator, type Repo } from "@/lib/persistencia/tipos";

async function projetoDoSlug(repo: Repo, slug: string, ator: Ator) {
  const projeto = await repo.projetoPorSlug(slug);
  if (!projeto) throw new ErroHttp("Projeto não encontrado.", 404);
  const membros = await repo.membros(projeto.id);
  if (!podeLerDocumento({ perfil: ator.perfil, usuarioId: ator.usuarioId, projetoId: projeto.id, membros })) {
    throw new ErroHttp("Acesso negado a este projeto.", 403);
  }
  return projeto;
}

export async function obterPainel(repo: Repo, slug: string, ator: Ator, cicloPedido?: string): Promise<PainelRodada> {
  const projeto = await projetoDoSlug(repo, slug, ator);
  const dados = await repo.dadosRodada(projeto.id);
  const ciclo = cicloPedido && cicloValido(cicloPedido) ? cicloPedido : projeto.ciclo;
  return montarPainel({
    perfil: perfilCanonico(ator.perfil),
    projeto,
    ciclo,
    ...dados,
  });
}

export async function salvarDiagnostico(repo: Repo, slug: string, registro: Omit<DiagnosticoRegistro, "projetoId">, ator: Ator) {
  if (!podeDiagnosticar(ator.perfil)) throw new ErroHttp("Somente backoffice e administrador registram o diagnóstico.", 403);
  const projeto = await projetoDoSlug(repo, slug, ator);
  await repo.salvarDiagnostico({ ...registro, projetoId: projeto.id }, ator);
}

export async function definirNaoAplicavel(repo: Repo, slug: string, padraoId: string, marcado: boolean, ator: Ator) {
  if (!podeDiagnosticar(ator.perfil)) throw new ErroHttp("Somente backoffice e administrador marcam não se aplica.", 403);
  const projeto = await projetoDoSlug(repo, slug, ator);
  await repo.definirNaoAplicavel(projeto.id, padraoId, marcado, ator);
}

export async function salvarResposta(
  repo: Repo,
  slug: string,
  entrada: { padraoId: string; ciclo: string; atende: boolean | null; texto: string },
  ator: Ator,
) {
  if (!cicloValido(entrada.ciclo)) throw new ErroHttp("Ciclo inválido.", 400);
  const projeto = await projetoDoSlug(repo, slug, ator);
  await repo.salvarResposta(
    {
      projetoId: projeto.id,
      padraoId: entrada.padraoId,
      ciclo: entrada.ciclo,
      atende: entrada.atende,
      texto: entrada.texto,
      cumpre: false,
    },
    ator,
  );
}

export async function enviarEvidencia(repo: Repo, slug: string, entrada: Omit<EvidenciaRegistro, "projetoId" | "etapa">, ator: Ator) {
  if (!podeEnviarEvidencia(ator.perfil)) throw new ErroHttp("Sem permissão para enviar evidência.", 403);
  const projeto = await projetoDoSlug(repo, slug, ator);
  await repo.enviarEvidencia({ ...entrada, projetoId: projeto.id, etapa: "enviada" }, ator);
}

export async function vincularEvidencia(repo: Repo, slug: string, evidenciaId: string, documentoId: string, ator: Ator) {
  await projetoDoSlug(repo, slug, ator);
  await repo.vincularEvidencia(evidenciaId, documentoId, ator);
}

export async function transitarEvidencia(
  repo: Repo,
  slug: string,
  evidenciaId: string,
  etapa: "conferida" | "chancelada",
  ator: Ator,
) {
  if (etapa === "chancelada" && !podeChancelarArea(ator.perfil)) throw new ErroHttp("Sem permissão para chancelar.", 403);
  if (etapa === "conferida" && !podeConferirEvidencia(ator.perfil)) throw new ErroHttp("Sem permissão para conferir.", 403);
  await projetoDoSlug(repo, slug, ator);
  await repo.transitarEvidencia(evidenciaId, etapa, ator);
}

export async function marcarCumpre(repo: Repo, slug: string, padraoId: string, ciclo: Ciclo, ator: Ator) {
  const projeto = await projetoDoSlug(repo, slug, ator);
  const dados = await repo.dadosRodada(projeto.id);
  const resposta = dados.respostas.find((item) => item.padraoId === padraoId && item.ciclo === ciclo);
  const recusa = cumprePermitido({
    perfil: ator.perfil,
    atende: resposta?.atende ?? null,
    evidenciaChancelada: dados.evidencias.some((item) => item.padraoId === padraoId && item.etapa === "chancelada"),
    areaConcluida: dados.areas.some((item) => item.padraoId === padraoId && item.fase === "concluida"),
  });
  if (recusa) throw new ErroHttp(recusa, recusa.startsWith("Somente") ? 403 : 400);
  await repo.marcarCumpre(projeto.id, padraoId, ciclo, ator);
}

export async function criarArea(repo: Repo, slug: string, texto: string, padraoId: string, ator: Ator) {
  if (!podeTrabalharPlano(ator.perfil)) throw new ErroHttp("Sem permissão para abrir área de melhoria.", 403);
  const projeto = await projetoDoSlug(repo, slug, ator);
  const area: AreaRegistro = {
    id: randomUUID(),
    projetoId: projeto.id,
    padraoId,
    texto,
    fase: "detectada",
    responsavelId: ator.usuarioId,
    inicio: null,
    fim: null,
  };
  await repo.criarArea(area, ator);
  return area.id;
}

export async function transitarArea(repo: Repo, slug: string, areaId: string, acao: AcaoArea, ator: Ator) {
  if (!podeExecutarAcaoArea(ator.perfil, acao)) {
    throw new ErroHttp(acao === "chancelar" ? "Sem permissão para chancelar." : "Sem permissão para esta fase.", 403);
  }
  await projetoDoSlug(repo, slug, ator);
  await repo.transitarArea(areaId, acao, ator);
}

export async function avancarEtapa(repo: Repo, slug: string, ator: Ator) {
  if (!podeAvancarEtapa(ator.perfil)) throw new ErroHttp("Somente backoffice e administrador avançam a etapa.", 403);
  const projeto = await projetoDoSlug(repo, slug, ator);
  await repo.avancarEtapa(projeto.id, ator);
}

export async function abrirComplementar(repo: Repo, slug: string, ator: Ator) {
  if (!podeAvancarEtapa(ator.perfil)) throw new ErroHttp("Somente backoffice e administrador abrem o complementar.", 403);
  const projeto = await projetoDoSlug(repo, slug, ator);
  return repo.abrirComplementar(projeto.id, ator);
}
