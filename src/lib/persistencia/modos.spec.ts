import { describe, expect, it } from "vitest";
import { criarEstadoDemo, MANUAL_ME5, USUARIO_BACKOFFICE, USUARIO_UPLOAD } from "@/domain/demo";
import { prazoAutoavaliacao } from "@/lib/regras/prazos";
import {
  SQL_CRIAR,
  SQL_DEVOLVER,
  SQL_DOCUMENTO,
  SQL_RECLASSIFICAR,
  criarRepoBanco,
  type Banco,
  type Consulta,
} from "@/lib/persistencia/banco";
import { criarProjeto, devolver, reclassificar, registrarArquivo } from "@/lib/persistencia/servico";
import { criarRepoSessao } from "@/lib/persistencia/sessao";
import type { Repo } from "@/lib/persistencia/tipos";

const CANDIDATURA = "b2026015-0015-4000-8000-000000000015";
const ator = { perfil: "backoffice_ibes", usuarioId: USUARIO_BACKOFFICE };
const upload = { perfil: "responsavel_upload", usuarioId: USUARIO_UPLOAD };
const em = "2026-11-09T15:00:00.000Z";

function bancoComMemoria(): { repo: Repo; sql: string[] } {
  const estado = criarEstadoDemo();
  const sql: string[] = [];
  const consulta: Consulta["query"] = async (texto, params = []) => {
    sql.push(texto);
    if (texto === "select codigo from projetos") return { rows: estado.projetos.map((item) => ({ codigo: item.codigo })) };
    if (texto.includes("union")) {
      return {
        rows: [
          ...estado.projetos.map((item) => ({ codigo: item.codigo })),
          ...estado.candidaturas.filter((item) => item.situacao !== "convertida").map((item) => ({ codigo: item.codigo })),
        ],
      };
    }
    if (texto.includes("from candidaturas where id")) {
      const candidatura = estado.candidaturas.find((item) => item.id === params[0]);
      return { rows: candidatura ? [linhaCandidatura(candidatura)] : [] };
    }
    if (texto === SQL_CRIAR) {
      const id = "c0ffee00-0000-4000-8000-000000000050";
      estado.auditoria.unshift({ tipo: "projetos", acao: "insert", objeto: id });
      return { rows: [{ id }] };
    }
    if (texto === SQL_DEVOLVER) {
      const candidatura = estado.candidaturas.find((item) => item.id === params[0]);
      if (!candidatura) return { rows: [] };
      candidatura.situacao = "devolvida";
      candidatura.motivoDevolucao = String(params[1]);
      estado.auditoria.unshift({ tipo: "candidaturas", acao: "update", objeto: candidatura.id });
      return { rows: [] };
    }
    if (texto === SQL_DOCUMENTO) {
      estado.auditoria.unshift({ tipo: "documentos", acao: "insert", objeto: String(params[0]) });
      return { rows: [], rowCount: 1 };
    }
    if (texto === SQL_RECLASSIFICAR) {
      estado.auditoria.unshift({ tipo: "documentos", acao: "update", objeto: String(params[0]) });
      return { rows: [], rowCount: 1 };
    }
    if (texto.includes("from auditoria")) return { rows: estado.auditoria.map((item) => ({ ...item })) };
    return { rows: [] };
  };
  const banco: Banco = { transacao: (fn) => fn(consulta) };
  return { repo: criarRepoBanco(banco), sql };
}

function linhaCandidatura(candidatura: ReturnType<typeof criarEstadoDemo>["candidaturas"][number]) {
  return {
    id: candidatura.id,
    codigo: candidatura.codigo,
    instituicao: candidatura.instituicao,
    situacao: candidatura.situacao,
    motivo_devolucao: candidatura.motivoDevolucao,
    avaliada_por: candidatura.avaliadaPor,
    avaliada_em: candidatura.avaliadaEm,
    projeto_id: candidatura.projetoId,
    created_at: candidatura.recebidaEm,
  };
}

async function cenario(repo: Repo) {
  const projeto = await criarProjeto(
    repo,
    {
      codigo: "2026/050",
      instituicao: "Clínica Fictícia de Teste",
      unidade: "Ambulatório",
      tipoUnidade: "Clínica",
      grupo: null,
      manualId: MANUAL_ME5,
      abertura: "2026-04-09",
      origem: "zero",
      candidaturaId: null,
    },
    ator,
  );
  expect(projeto.estado).toBe("diagnostico");
  expect(projeto.selo).toBe("Criado do zero");
  expect(projeto.prazoEtapa).toBe(prazoAutoavaliacao("2026-04-09"));
  await expect(devolver(repo, CANDIDATURA, "   ", ator, em)).rejects.toThrow(/motivo/);
  await devolver(repo, CANDIDATURA, "falta o contrato", ator, em);
  const documento = await registrarArquivo(
    repo,
    {
      projetoId: projeto.id,
      documentoId: "d0c00000-0000-4000-8000-000000000001",
      novo: true,
      classificacao: "Procedimento",
      versao: {
        versao: 1,
        caminho: `projeto/${projeto.id}/documentos/doc/v1/laudo.pdf`,
        sha256: "abc",
        tamanho: 12,
        mime: "application/pdf",
        nomeArquivo: "laudo.pdf",
      },
    },
    upload,
  );
  await reclassificar(repo, documento.id, "Ata", upload);
  const auditoria = await repo.auditoria();
  expect(auditoria).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ tipo: "projetos", acao: "insert" }),
      expect.objectContaining({ tipo: "candidaturas", acao: "update" }),
      expect.objectContaining({ tipo: "documentos", acao: "insert" }),
      expect.objectContaining({ tipo: "documentos", acao: "update" }),
    ]),
  );
}

describe("gravação da prioridade 1", () => {
  it("sem banco, a sessão registra projeto, devolução, documento e reclassificação", async () => {
    await cenario(criarRepoSessao());
  });

  it("com banco, as mesmas ações disparam o SQL e a auditoria", async () => {
    const { repo, sql } = bancoComMemoria();
    await cenario(repo);
    expect(sql).toContain(SQL_CRIAR);
    expect(sql.filter((item) => item === SQL_DEVOLVER)).toHaveLength(1);
    expect(sql).toContain(SQL_DOCUMENTO);
    expect(sql).toContain(SQL_RECLASSIFICAR);
  });
});
