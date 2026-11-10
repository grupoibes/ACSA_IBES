import { describe, expect, it } from "vitest";
import { ID_2025_009, USUARIO_BACKOFFICE, USUARIO_RESPONSAVEL, criarEstadoDemo } from "@/domain/demo";
import { SQL_APLICAR_SEGUNDA, SQL_LER_SEGUNDA, criarRepoBanco, type Banco, type Consulta } from "@/lib/persistencia/banco";
import { criarRepoSessao } from "@/lib/persistencia/sessao";
import { aplicarSegundaMemoria, lerSegundaMemoria } from "@/lib/persistencia/segundaMemoria";
import type { Ator, Repo } from "@/lib/persistencia/tipos";

const responsavel: Ator = { perfil: "responsavel_projeto", usuarioId: USUARIO_RESPONSAVEL };
const backoffice: Ator = { perfil: "backoffice_ibes", usuarioId: USUARIO_BACKOFFICE };
const avaliador: Ator = { perfil: "avaliador_ibes", usuarioId: "66666666-6666-4666-8666-666666666661" };
const hoje = "2026-11-09";

async function cenario(repo: Repo) {
  const cliente = await repo.lerSegunda(ID_2025_009, responsavel, hoje);
  const ibes = await repo.lerSegunda(ID_2025_009, avaliador, hoje);
  expect(cliente.requisitos).toHaveLength(0);
  expect(ibes.requisitos.some((item) => item.provas.includes("Entrevista"))).toBe(true);
  expect(cliente.relatorio).toContain("Ponto fictício consolidado");
  expect(cliente.relatorio).not.toContain("não consolidado");

  let aviso: string | null = null;
  for (let indice = 0; indice < 37; indice += 1) {
    aviso = await repo.aplicarSegunda(
      ID_2025_009,
      { tipo: "usuario", nome: `Usuário fictício ${indice}`, email: `u${indice}@instituicao.ficticia`, perfil: "conferente" },
      backoffice,
    );
  }
  expect(aviso).toMatch(/segue aberto/);
  expect((await repo.lerSegunda(ID_2025_009, backoffice, hoje)).usuarios.length).toBeGreaterThan(40);
}

function bancoFalso(): Repo {
  const estado = criarEstadoDemo();
  let perfil = "";
  let usuario = "";
  const consulta: Consulta["query"] = async (texto, params = []) => {
    if (texto.includes("definir_perfil")) {
      perfil = String(params[0]);
      return { rows: [] };
    }
    if (texto.includes("definir_usuario")) {
      usuario = String(params[0]);
      return { rows: [] };
    }
    const ator = { perfil, usuarioId: usuario };
    if (texto === SQL_LER_SEGUNDA) {
      return { rows: [{ dados: lerSegundaMemoria(estado, String(params[0]), ator, String(params[1])) }] };
    }
    if (texto === SQL_APLICAR_SEGUNDA) {
      const comando = typeof params[1] === "string" ? JSON.parse(params[1]) : params[1];
      const aviso = aplicarSegundaMemoria(estado, String(params[0]), comando, ator);
      return { rows: [{ aviso }] };
    }
    return { rows: [] };
  };
  const banco: Banco = { transacao: (fn) => fn(consulta) };
  return criarRepoBanco(banco);
}

describe("rodada 2b nos dois modos", () => {
  it("na sessão, o cliente não vê requisito e o 41º usuário só gera aviso", async () => {
    await cenario(criarRepoSessao(criarEstadoDemo()));
  });

  it("no banco, o mesmo SQL esconde o requisito e não bloqueia o cadastro", async () => {
    await cenario(bancoFalso());
  });
});
