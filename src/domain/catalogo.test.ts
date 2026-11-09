import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aplicaveis, catalogoFicticio } from "./catalogo";

describe("catálogo fictício", () => {
  const catalogo = catalogoFicticio();

  it("repete a contagem publicada sem texto oficial", () => {
    assert.equal(catalogo.length, 101);
    assert.equal(catalogo.filter((item) => item.grupo === "I").length, 65);
    assert.equal(catalogo.filter((item) => item.grupo === "II").length, 24);
    assert.equal(catalogo.filter((item) => item.grupo === "III").length, 12);
    assert.equal(catalogo.filter((item) => item.obrigatorio).length, 41);
    assert.equal(catalogo.filter((item) => item.obrigatorio && item.grupo !== "I").length, 0);
    const manuais = catalogo.filter((item) => item.naoSeAplicaManual);
    assert.deepEqual(
      manuais.map((item) => item.grupo),
      ["II", "III"],
    );
    assert.equal(new Set(catalogo.map((item) => item.codigo)).size, 101);
    assert.ok(catalogo.every((item) => item.titulo.startsWith("Padrão fictício")));
  });

  it("conta 99 aplicáveis e 98 depois de um não se aplica do diagnóstico", () => {
    assert.equal(aplicaveis(catalogo, new Set()).length, 99);
    const um = catalogo.find((item) => item.grupo === "I");
    assert.ok(um);
    assert.equal(aplicaveis(catalogo, new Set([um.id])).length, 98);
  });
});
