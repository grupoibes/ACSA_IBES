import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { podeChancelarArea, podeChancelarEvidencia, podeConferirEvidencia } from "./chancela";

describe("chancela da evidência e da área", () => {
  it("usa a mesma função para a área", () => {
    for (const perfil of ["admin_ibes", "backoffice_ibes", "tutor_relatorio", "avaliador_ibes", "avaliador_lider", "autorizador", "educador", "membro_comite"]) {
      assert.equal(podeChancelarArea(perfil), podeChancelarEvidencia(perfil), perfil);
    }
  });

  it("deixa o tutor chancelar e recusa o autorizador", () => {
    assert.equal(podeChancelarArea("tutor_relatorio"), true);
    assert.equal(podeChancelarArea("autorizador"), false);
    assert.equal(podeConferirEvidencia("autorizador"), true);
    assert.equal(podeConferirEvidencia("educador"), true);
    assert.equal(podeChancelarEvidencia("educador"), false);
  });
});
