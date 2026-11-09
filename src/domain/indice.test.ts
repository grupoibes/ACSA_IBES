import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalogoInicial, ID_2023_014_C, ID_2025_009 } from "@/domain/demo";
import { filtrarIndice, janelaCalculada, linhasVisiveis, situacaoDaLinha } from "@/domain/indice";
import { prazoAutoavaliacao } from "@/lib/regras/prazos";

describe("índice", () => {
  it("lista vários projetos, filtra sem trocar o selo e acha o criado do zero", () => {
    const linhas = catalogoInicial("2026-11-09").linhas;
    assert.ok(linhas.length > 3);
    assert.equal(linhas.some((linha) => linha.codigo === "2025/009"), true);
    assert.equal(linhas.some((linha) => linha.selo === "Criado do zero"), true);
    const zero = linhas.find((linha) => linha.selo === "Criado do zero");
    assert.ok(zero);
    const filtrado = filtrarIndice(linhas, zero.codigo);
    assert.equal(filtrado.length, 1);
    assert.equal(filtrado[0].selo, "Criado do zero");
    assert.deepEqual(
      filtrarIndice(linhas, "ME 28").map((linha) => linha.codigo),
      ["2024/011"],
    );
    assert.deepEqual(filtrarIndice(linhas, "modelo").map((linha) => linha.cliente), ["Hospital Modelo de Demonstração"]);
  });

  it("o perfil de outro projeto não vê o 2025/009", () => {
    const linhas = catalogoInicial("2026-11-09").linhas;
    const ibes = linhasVisiveis(linhas, "backoffice_ibes", []);
    assert.equal(ibes.some((linha) => linha.id === ID_2025_009), true);
    const outro = linhasVisiveis(linhas, "responsavel_projeto", [ID_2023_014_C]);
    assert.equal(outro.some((linha) => linha.id === ID_2025_009), false);
    assert.equal(outro.some((linha) => linha.id === ID_2023_014_C), true);
  });

  it("calcula a janela e a situação sem data fixa de dezembro de 2026", () => {
    const janela = janelaCalculada("2026-04-09");
    assert.equal(janela.fim, prazoAutoavaliacao("2026-04-09"));
    assert.equal(janela.fim, "2027-04-09");
    assert.equal(janela.fim.includes("2026-12-15"), false);
    assert.equal(situacaoDaLinha("2026-11-09", "2026-10-01", null).situacao, "Vencido");
    assert.equal(situacaoDaLinha("2026-11-09", "2027-04-09", null).situacao, "No prazo");
  });
});
