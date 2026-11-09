import { describe, expect, it } from "vitest";
import { idPadrao } from "@/domain/catalogo";
import { AREA_RECUSA, AREA_TUTOR, ID_2025_009, USUARIO_AUTORIZADOR, criarEstadoDemo, type ProjetoRegistro } from "@/domain/demo";
import { gravarResposta, type Ciclo } from "@/domain/rodada";
import { salvarResposta, transitarArea } from "@/lib/persistencia/acoesRodada";
import { SQL_AREA, SQL_DADOS, SQL_PADROES, SQL_RESPOSTA, criarRepoBanco, type Banco, type Consulta } from "@/lib/persistencia/banco";
import { criarRepoSessao } from "@/lib/persistencia/sessao";
import type { Repo } from "@/lib/persistencia/tipos";

const tutor = { perfil: "tutor_relatorio", usuarioId: "66666666-6666-4666-8666-666666666672" };
const autorizador = { perfil: "autorizador", usuarioId: USUARIO_AUTORIZADOR };
const responsavel = { perfil: "responsavel_projeto", usuarioId: "66666666-6666-4666-8666-666666666663" };
const padrao = idPadrao(8);

async function cenario(repo: Repo) {
  await salvarResposta(repo, "2025-009", { padraoId: padrao, ciclo: "inicial", atende: true, texto: "texto inicial" }, responsavel);
  await salvarResposta(repo, "2025-009", { padraoId: padrao, ciclo: "manutencao_1", atende: false, texto: "texto manutenção" }, responsavel);
  await salvarResposta(repo, "2025-009", { padraoId: padrao, ciclo: "manutencao_1", atende: true, texto: "texto revisto" }, responsavel);
  const respostas = (await repo.dadosRodada(ID_2025_009)).respostas.filter((item) => item.padraoId === padrao);
  expect(respostas).toHaveLength(2);
  expect(respostas.find((item) => item.ciclo === "inicial")?.texto).toBe("texto inicial");
  expect(respostas.find((item) => item.ciclo === "manutencao_1")?.texto).toBe("texto revisto");

  await transitarArea(repo, "2025-009", AREA_TUTOR, "chancelar", tutor);
  expect((await repo.dadosRodada(ID_2025_009)).areas.find((item) => item.id === AREA_TUTOR)?.fase).toBe("concluida");
  await expect(transitarArea(repo, "2025-009", AREA_RECUSA, "chancelar", autorizador)).rejects.toThrow(/permiss/i);
  expect((await repo.dadosRodada(ID_2025_009)).areas.find((item) => item.id === AREA_RECUSA)?.fase).toBe("aguardando_chancela");

  const auditoria = await repo.auditoria();
  expect(auditoria.some((item) => item.tipo === "respostas_padrao")).toBe(true);
  expect(auditoria.some((item) => item.tipo === "areas_melhoria" && item.acao === "update")).toBe(true);
}

function bancoFalso(): { repo: Repo; sql: string[] } {
  const estado = criarEstadoDemo();
  const sql: string[] = [];
  let perfil = "";
  const consulta: Consulta["query"] = async (texto, params = []) => {
    sql.push(texto);
    if (texto.includes("definir_perfil")) {
      perfil = String(params[0]);
      return { rows: [] };
    }
    if (texto.includes("where p.codigo")) {
      const projeto = estado.projetos.find((item) => item.codigo === params[0]);
      return { rows: projeto ? [linhaProjeto(projeto)] : [] };
    }
    if (texto.includes("from projeto_membros")) {
      return {
        rows: estado.membros
          .filter((item) => item.projetoId === params[0])
          .map((item) => ({ usuario_id: item.usuarioId, projeto_id: item.projetoId })),
      };
    }
    if (texto === SQL_RESPOSTA) {
      const [projetoId, padraoId, ciclo, atende, textoResposta] = params;
      const existente = estado.respostas.find(
        (item) => item.projetoId === projetoId && item.padraoId === padraoId && item.ciclo === ciclo,
      );
      estado.respostas = gravarResposta(estado.respostas, {
        projetoId: String(projetoId),
        padraoId: String(padraoId),
        ciclo: String(ciclo) as Ciclo,
        atende: (atende as boolean | null) ?? null,
        texto: String(textoResposta ?? ""),
        cumpre: existente?.cumpre ?? false,
      });
      estado.auditoria.unshift({ tipo: "respostas_padrao", acao: existente ? "update" : "insert", objeto: "respostas_padrao" });
      return { rows: [] };
    }
    if (texto === SQL_AREA) {
      if (perfil === "autorizador" && params[1] === "chancelar") throw new Error("sem permissão para chancelar");
      const area = estado.areas.find((item) => item.id === params[0]);
      if (!area || area.fase !== "aguardando_chancela" || params[1] !== "chancelar") throw new Error("fase da área");
      area.fase = "concluida";
      estado.auditoria.unshift({ tipo: "areas_melhoria", acao: "update", objeto: "areas_melhoria" });
      return { rows: [] };
    }
    if (texto === SQL_DADOS) {
      const projetoId = String(params[0]);
      return {
        rows: [
          {
            dados: {
              diagnostico: null,
              naoAplicaveis: estado.naoAplicaveis.filter((item) => item.projetoId === projetoId).map((item) => item.padraoId),
              respostas: estado.respostas.filter((item) => item.projetoId === projetoId),
              evidencias: estado.evidencias.filter((item) => item.projetoId === projetoId),
              areas: estado.areas.filter((item) => item.projetoId === projetoId),
              emails: [],
              auditoria: estado.auditoria.slice(0, 12),
              origem: null,
            },
          },
        ],
      };
    }
    if (texto === SQL_PADROES) return { rows: [] };
    if (texto.includes("from auditoria")) return { rows: estado.auditoria.map((item) => ({ ...item })) };
    return { rows: [] };
  };
  const banco: Banco = { transacao: (fn) => fn(consulta) };
  return { repo: criarRepoBanco(banco), sql };
}

function linhaProjeto(projeto: ProjetoRegistro) {
  return {
    id: projeto.id,
    codigo: projeto.codigo,
    instituicao: projeto.instituicao,
    unidade: projeto.unidade,
    manual_id: projeto.manualId,
    manual: projeto.manual,
    abertura: projeto.abertura,
    estado: projeto.estado,
    tipo: projeto.tipo,
    etapa_fluxo: projeto.etapaFluxo,
    ciclo: projeto.ciclo,
    projeto_origem_id: projeto.origemId,
  };
}

describe("rodada 2a nos dois modos", () => {
  it("na sessão, a manutenção não apaga a inicial e o autorizador não chancela", async () => {
    await cenario(criarRepoSessao(criarEstadoDemo()));
  });

  it("no banco, grava o SQL do ciclo e não emite a chancela do autorizador", async () => {
    const { repo, sql } = bancoFalso();
    await cenario(repo);
    expect(sql.filter((item) => item === SQL_RESPOSTA)).toHaveLength(3);
    expect(sql.filter((item) => item === SQL_AREA)).toHaveLength(1);
    expect(sql.some((item) => item.includes("pode_chancelar") && item.includes("autorizador"))).toBe(false);
  });
});
