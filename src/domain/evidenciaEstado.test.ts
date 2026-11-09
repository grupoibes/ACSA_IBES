import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularNivel, type PadraoNoCalculo } from "@/domain/calcularNivel";
import {
  contaNoNumerador,
  estadoEvidencia,
  resultadoGravado,
  type EtapaEvidencia,
  type ResultadoPadrao,
} from "@/domain/evidencia";
import { MANUAL_OPERACIONAL } from "@/domain/manuais";

function padrao(
  id: string,
  grupo: PadraoNoCalculo["grupo"],
  resultado: ResultadoPadrao,
  etapas: EtapaEvidencia[],
  flags: { obrigatorio?: boolean; imprescindivel?: boolean } = {},
): PadraoNoCalculo {
  return {
    id,
    grupo,
    obrigatorio: flags.obrigatorio ?? false,
    imprescindivel: flags.imprescindivel ?? false,
    naoAplicavel: false,
    cumprido: contaNoNumerador(resultado, etapas),
  };
}

describe("estado da evidência", () => {
  it("separa Ausente de Pendente e não deixa nenhum dos dois no numerador", () => {
    assert.equal(estadoEvidencia([]), "ausente");
    assert.equal(estadoEvidencia(["enviada"]), "pendente");
    assert.equal(estadoEvidencia(["conferida"]), "pendente");
    assert.equal(estadoEvidencia(["enviada", "chancelada"]), "chancelada");
    assert.equal(resultadoGravado("ausente"), false);
    assert.equal(resultadoGravado("pendente"), true);
    assert.equal(contaNoNumerador("cumpre", []), false);
    assert.equal(contaNoNumerador("cumpre", ["conferida"]), false);
    assert.equal(contaNoNumerador("mantem", ["chancelada"]), true);
    assert.equal(contaNoNumerador("pendente", ["chancelada"]), false);

    const base = [
      padrao("i", "I", "cumpre", [], { obrigatorio: true }),
      padrao("ii", "II", "cumpre", ["enviada"], { imprescindivel: true }),
      padrao("iii", "III", "cumpre", ["conferida"]),
    ];
    const resultado = calcularNivel({
      manual: MANUAL_OPERACIONAL,
      tipo: "certificacao",
      padroes: base,
    });
    assert.equal(resultado.grupos.every((grupo) => grupo.cumpridos === 0), true);
    assert.equal(resultado.nivel, null);
  });

  it("conta mantem como cumpre na manutenção e ignora o Grupo III", () => {
    const padroes = [
      padrao("i", "I", "mantem", ["chancelada"], { obrigatorio: true }),
      padrao("ii", "II", "mantem", ["chancelada"], { imprescindivel: true }),
      padrao("iii", "III", "mantem", ["chancelada"]),
    ];
    const certificacao = calcularNivel({
      manual: MANUAL_OPERACIONAL,
      tipo: "certificacao",
      padroes,
    });
    const manutencao = calcularNivel({
      manual: MANUAL_OPERACIONAL,
      tipo: "manutencao",
      padroes,
    });
    assert.equal(certificacao.nivel, "excelente");
    assert.equal(manutencao.nivel, "otimo");
    assert.equal(manutencao.grupos.find((grupo) => grupo.grupo === "III")!.noEscopo, false);

    const pendente = calcularNivel({
      manual: MANUAL_OPERACIONAL,
      tipo: "manutencao",
      padroes: [
        padrao("i", "I", "pendente", ["chancelada"], { obrigatorio: true }),
        padrao("ii", "II", "mantem", ["chancelada"], { imprescindivel: true }),
        padrao("iii", "III", "mantem", ["chancelada"]),
      ],
    });
    assert.equal(pendente.grupos[0]!.cumpridos, 0);
    assert.equal(pendente.nivel, null);
  });
});
