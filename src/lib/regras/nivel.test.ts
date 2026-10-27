import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REGRAS_V03,
  calcularNivel,
  minimoCumpridos,
  percentualCumprido,
  type PadraoConta,
} from "./nivel";

describe("motor de nível v0.3", () => {
  it("mostra 139 de 142 como 97,9%", () => {
    assert.equal(percentualCumprido(139, 142), "97,9%");
    assert.equal(percentualCumprido(139, 144 - 2), "97,9%");
  });

  it("arredonda o mínimo para cima", () => {
    assert.equal(minimoCumpridos(10, 70), 7);
    assert.equal(minimoCumpridos(23, 40), 10);
    assert.equal(minimoCumpridos(0, 40), 0);
  });

  it("tira os não aplicáveis do denominador", () => {
    const padroes: PadraoConta[] = [
      { grupo: "I", obrigatorio: true, aplicavel: true, cumpre: true },
      { grupo: "I", obrigatorio: true, aplicavel: false, cumpre: false },
      { grupo: "II", obrigatorio: false, aplicavel: true, cumpre: false },
      { grupo: "III", obrigatorio: false, aplicavel: true, cumpre: false },
    ];
    assert.equal(calcularNivel(padroes), "avancado");
  });

  it("não concede Excelente na manutenção, que não avalia o Grupo III", () => {
    const padroes: PadraoConta[] = [
      { grupo: "I", obrigatorio: true, aplicavel: true, cumpre: true },
      { grupo: "II", obrigatorio: false, aplicavel: true, cumpre: true },
      { grupo: "III", obrigatorio: false, aplicavel: true, cumpre: true },
    ];
    assert.equal(calcularNivel(padroes, REGRAS_V03, "certificacao"), "excelente");
    assert.equal(calcularNivel(padroes, REGRAS_V03, "manutencao"), "otimo");
  });

  it("bloqueia Avançado quando um obrigatório aplicável falha", () => {
    const padroes: PadraoConta[] = [
      { grupo: "I", obrigatorio: true, aplicavel: true, cumpre: false },
      { grupo: "I", obrigatorio: false, aplicavel: true, cumpre: true },
    ];
    assert.equal(calcularNivel(padroes), null);
  });
});
