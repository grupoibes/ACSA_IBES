import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalogoInicial, ID_2023_014_C, ID_2025_009, projetoPorSlug } from "@/domain/demo";
import { paragrafoProjetoNovo, textoJanela } from "@/domain/fichaProjeto";

describe("ficha", () => {
  it("abre 2025/009 e o complementar -C em fichas diferentes", () => {
    const catalogo = catalogoInicial("2026-11-09");
    const modelo = projetoPorSlug(catalogo.projetos, "2025-009");
    const complementar = projetoPorSlug(catalogo.projetos, "2023-014-C");
    assert.equal(modelo?.id, ID_2025_009);
    assert.equal(modelo?.codigo, "2025/009");
    assert.equal(modelo?.instituicao, "Hospital Modelo de Demonstração");
    assert.equal(complementar?.id, ID_2023_014_C);
    assert.equal(complementar?.codigo, "2023/014-C");
    assert.equal(complementar?.instituicao, "Policlínica Exemplo Sul");
    assert.notEqual(modelo?.id, complementar?.id);
    assert.equal(projetoPorSlug(catalogo.projetos, "2025/009"), null);
  });

  it("mostra Projeto novo na etapa Diagnóstico e a janela calculada da abertura", () => {
    assert.match(paragrafoProjetoNovo("zero", "diagnostico") ?? "", /Projeto novo/);
    assert.match(paragrafoProjetoNovo("candidatura", "diagnostico") ?? "", /Projeto novo/);
    assert.equal(paragrafoProjetoNovo("zero", "autoavaliacao"), null);
    assert.equal(paragrafoProjetoNovo(null, "diagnostico"), null);
    const janela = textoJanela("2026-04-09");
    assert.match(janela, /09\/04\/2027/);
    assert.equal(janela.includes("15/12/2026"), false);
  });
});
