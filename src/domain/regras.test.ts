import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { conformidadePermitida } from "@/domain/acesso";
import {
  abrirRodada,
  adicionarEvidencia,
  alterarEstado,
  criarProjetoAmostra,
  marcarNaoAplicavel,
  nivelDaAvaliacao,
  padroesVisiveis,
} from "@/domain/projeto";

const agora = "2026-10-26T15:00:00-03:00";

describe("regras de 26/10 fora do cálculo", () => {
  it("recusa o resultado Ausente", () => {
    assert.equal(conformidadePermitida("ausente"), false);
    assert.equal(conformidadePermitida("Ausente"), false);
    assert.equal(conformidadePermitida("cumprido"), true);
    assert.equal(conformidadePermitida("nao_cumprido"), true);
  });

  it("esconde o não aplicável do gestor e do profissional", () => {
    const projeto = criarProjetoAmostra();
    for (const perfil of ["gestor_instituicao", "profissional_instituicao"] as const) {
      const codigos = padroesVisiveis(projeto, perfil).map((item) => item.codigo);
      assert.equal(codigos.includes("5.06.02"), false);
      assert.equal(codigos.length, 11);
    }
    assert.equal(
      padroesVisiveis(projeto, "avaliador_ibes").some((item) => item.codigo === "5.06.02"),
      true,
    );
  });

  it("só admin_ibes e responsavel_ibes gravam recusado ou abandonado, e sempre no histórico", () => {
    const projeto = criarProjetoAmostra();
    assert.throws(
      () => alterarEstado(projeto, "avaliador_ibes", "recusado", "fora do escopo", agora),
      /admin_ibes e responsavel_ibes/,
    );
    assert.throws(
      () => alterarEstado(projeto, "gestor_instituicao", "abandonado", "sem continuidade", agora),
      /admin_ibes e responsavel_ibes/,
    );

    const recusado = alterarEstado(projeto, "admin_ibes", "recusado", "escopo incompatível", agora);
    const ultimo = recusado.historico.at(-1)!;
    assert.equal(recusado.estado, "recusado");
    assert.equal(ultimo.de, "avaliacao");
    assert.equal(ultimo.para, "recusado");
    assert.equal(ultimo.perfil, "admin_ibes");
    assert.equal(ultimo.motivo, "escopo incompatível");

    const abandonado = alterarEstado(
      projeto,
      "responsavel_ibes",
      "abandonado",
      "instituição encerrou o contrato",
      agora,
    );
    assert.equal(abandonado.historico.at(-1)!.para, "abandonado");
  });

  it("acumula evidências na rodada nova e não copia a conformidade", () => {
    const projeto = criarProjetoAmostra();
    const aberta = abrirRodada(projeto, "avaliador_ibes");
    const nova = aberta.avaliacoes.at(-1)!;
    assert.equal(nova.rodada, 3);
    assert.deepEqual(nova.conformidades, {});
    assert.equal(aberta.evidencias.length, projeto.evidencias.length);

    const comEvidencia = adicionarEvidencia(
      aberta,
      nova.id,
      "5.01.02",
      "Entrevista com a farmacêutica de plantão.",
      agora,
    );
    const daIdentificacao = comEvidencia.evidencias.filter((item) => item.padraoId === "5.01.02");
    assert.deepEqual(
      daIdentificacao.map((item) => item.rodada),
      [1, 2, 3],
    );
    assert.throws(() => abrirRodada(projeto, "gestor_instituicao"), /não abre rodada/);
  });

  it("só aceita origem diagnostico e a instituição não marca não aplicável", () => {
    const projeto = criarProjetoAmostra();
    assert.throws(
      () => marcarNaoAplicavel(projeto, "admin_ibes", "5.11.03", "visita"),
      /origem/,
    );
    assert.throws(
      () => marcarNaoAplicavel(projeto, "profissional_instituicao", "5.11.03", "diagnostico"),
      /instituição/,
    );
    const marcado = marcarNaoAplicavel(projeto, "avaliador_ibes", "5.11.03", "diagnostico");
    assert.equal(
      marcado.naoAplicaveis.every((item) => item.origem === "diagnostico"),
      true,
    );
    const rodada2 = marcado.avaliacoes.find((item) => item.rodada === 2)!;
    assert.equal(rodada2.conformidades["5.11.03"], undefined);
    assert.equal(nivelDaAvaliacao(marcado, rodada2.id).grupos[2]!.excluidosNaoAplicaveis, 1);
  });
});
