import { describe, expect, it } from "vitest";
import { calcularNivel } from "./nivel";
import { afirmarDiagnosticoPodeAlterar, contagemPorGrupo, faixa, universoPadroes, type PadraoUniverso } from "./universo";

const LABORATORIO = "laboratorio-demonstracao";
const IMAGEM = "imagem-demonstracao";

function nucleoMe5(): PadraoUniverso[] {
  return [
    ...faixa({ grupo: "I", total: 65, obrigatorios: 41 }),
    ...faixa({ grupo: "II", total: 24, naoSeAplicaManual: 1 }),
    ...faixa({ grupo: "III", total: 12, naoSeAplicaManual: 1 }),
  ];
}

describe("universo de padrões", () => {
  it("deixa o ME 5 só com o núcleo em 99 no cálculo (65/23/11)", () => {
    const aplicaveis = universoPadroes(nucleoMe5(), []);
    expect(contagemPorGrupo(aplicaveis)).toEqual({ I: 65, II: 23, III: 11, total: 99 });
  });

  it("soma o Laboratório e continua fora os 2 N/A do manual: 127", () => {
    const padroes = [...nucleoMe5(), ...faixa({ grupo: "II", total: 28, anexoId: LABORATORIO })];
    expect(universoPadroes(padroes, [LABORATORIO])).toHaveLength(127);
    expect(universoPadroes(padroes, [])).toHaveLength(99);
  });

  it("soma Imagem ao ME 28 e chega a 112", () => {
    const padroes = [
      ...faixa({ grupo: "I", total: 102 }),
      ...faixa({ grupo: "II", total: 10, anexoId: IMAGEM }),
    ];
    expect(universoPadroes(padroes, [IMAGEM])).toHaveLength(112);
  });

  it("faz o percentual do nível incidir sobre núcleo e anexo", () => {
    const nucleo = [
      ...faixa({ grupo: "I", total: 10, obrigatorios: 10 }),
      ...faixa({ grupo: "II", total: 1 }),
      ...faixa({ grupo: "III", total: 1 }),
    ];
    const anexo = faixa({ grupo: "I", total: 10, anexoId: LABORATORIO });
    const semAnexo = universoPadroes(nucleo, []).map((padrao) => ({
      grupo: padrao.grupo,
      obrigatorio: padrao.obrigatorio,
      aplicavel: true,
      cumpre: padrao.grupo === "I",
    }));
    const comAnexo = universoPadroes([...nucleo, ...anexo], [LABORATORIO]).map((padrao) => ({
      grupo: padrao.grupo,
      obrigatorio: padrao.obrigatorio,
      aplicavel: true,
      cumpre: padrao.grupo === "I" && padrao.anexoId === null,
    }));
    expect(calcularNivel(semAnexo)).toBe("avancado");
    expect(calcularNivel(comAnexo)).toBeNull();
  });

  it("recusa o Diagnóstico alterar um padrão que não se aplica no manual", () => {
    expect(() => afirmarDiagnosticoPodeAlterar({ naoSeAplicaManual: true })).toThrow(/manual/);
    expect(() => afirmarDiagnosticoPodeAlterar({ naoSeAplicaManual: false })).not.toThrow();
  });
});
