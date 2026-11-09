import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  codigoEditavelValido,
  codigoRepetido,
  deCandidatura,
  montarProjetoDoZero,
  podeCriarProjeto,
  sugerirCodigo,
} from "@/domain/projetoZero";

const base = {
  tipoUnidade: "Clínica",
  grupo: null,
  manualId: "11111111-1111-4111-8111-111111111111",
  abertura: "2026-04-09",
  origem: "zero" as const,
};

describe("projeto do zero", () => {
  it("só Administrador e Backoffice criam; os demais ficam sem o botão", () => {
    assert.equal(podeCriarProjeto("admin_ibes"), true);
    assert.equal(podeCriarProjeto("backoffice_ibes"), true);
    assert.equal(podeCriarProjeto("responsavel_ibes"), true);
    for (const perfil of ["avaliador_ibes", "membro_comite", "gestor_instituicao", "autorizador"]) {
      assert.equal(podeCriarProjeto(perfil), false);
    }
  });

  it("sugere o próximo código e aceita outro válido", () => {
    assert.equal(sugerirCodigo(2026, ["2026/001", "2025/009"]), "2026/002");
    assert.equal(codigoEditavelValido("2026/015"), true);
    assert.equal(codigoEditavelValido("2026/15"), false);
    assert.equal(codigoEditavelValido("2026/001-C"), false);
  });

  it("recusa código repetido ou inválido e nasce em Diagnóstico, sem biblioteca", () => {
    assert.equal(codigoRepetido("2026/001", ["2026/001"]), true);
    assert.throws(() => montarProjetoDoZero({ ...base, codigo: "26/1", instituicao: "Clínica Fictícia", unidade: "Ambulatório" }), /AAAA\/NNN/);
    const projeto = montarProjetoDoZero({
      ...base,
      codigo: "2026/015",
      instituicao: " Clínica Fictícia ",
      unidade: "Ambulatório",
    });
    assert.equal(projeto.estado, "diagnostico");
    assert.equal(projeto.instituicao, "Clínica Fictícia");
    assert.deepEqual(projeto.biblioteca, []);
    assert.equal(projeto.prazo, "2027-04-09");
    assert.equal(projeto.email.enviado, false);
    assert.match(projeto.email.assunto, /2026\/015/);
  });

  it("a candidatura preenche código, instituição e unidade", () => {
    const entrada = deCandidatura(
      { codigo: "2026/016", instituicao: "Hospital Fictício do Vale", unidade: "Unidade norte" },
      { tipoUnidade: null, grupo: "Grupo A", manualId: base.manualId, abertura: "2026-10-23" },
    );
    const projeto = montarProjetoDoZero(entrada);
    assert.equal(projeto.origem, "candidatura");
    assert.equal(projeto.codigo, "2026/016");
    assert.equal(projeto.grupo, "Grupo A");
    assert.equal(projeto.prazo, "2027-10-23");
  });
});
