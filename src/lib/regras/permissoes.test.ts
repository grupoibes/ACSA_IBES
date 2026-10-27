import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bloqueioAutoavaliacao,
  podeAbrirRodada,
  podeAlterarEstado,
  podeMarcarCumpre,
  podeRegistrarDiagnostico,
  podeRegistrarParecer,
} from "./permissoes";

describe("permissões do Beta v0.3", () => {
  it("reserva diagnóstico, estado e rodada ao backoffice e ao administrador", () => {
    assert.equal(podeRegistrarDiagnostico("back"), true);
    assert.equal(podeRegistrarDiagnostico("admin"), true);
    assert.equal(podeRegistrarDiagnostico("resp"), false);
    assert.equal(podeAlterarEstado("aval"), false);
    assert.equal(podeAbrirRodada("lider"), false);
  });

  it("marca Cumpre só com autorizador ou responsável do projeto", () => {
    assert.equal(podeMarcarCumpre("chan"), true);
    assert.equal(podeMarcarCumpre("resp"), true);
    assert.equal(podeMarcarCumpre("upload"), false);
  });

  it("reserva o parecer aos dois membros do comitê", () => {
    assert.equal(podeRegistrarParecer("comite"), true);
    assert.equal(podeRegistrarParecer("comite2"), true);
    assert.equal(podeRegistrarParecer("admin"), false);
  });

  it("bloqueia a saída da autoavaliação sem resposta e evidência chancelada no obrigatório", () => {
    assert.equal(bloqueioAutoavaliacao(true, true, false), true);
    assert.equal(bloqueioAutoavaliacao(true, true, true), false);
    assert.equal(bloqueioAutoavaliacao(false, false, false), false);
  });
});
