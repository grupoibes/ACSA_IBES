import { describe, expect, it } from "vitest";
import {
  TotaisDivergentes,
  contagemPorCriterio,
  importarManual,
  lerPlanilha,
  lerTotaisInformados,
  planilhaFicticia,
  resumir,
  validarTotais,
  type PlanilhaManual,
} from "./manual";

const TOTAIS = { "01": 2, "02": 1 };

async function ficticia(): Promise<PlanilhaManual> {
  return lerPlanilha(await planilhaFicticia());
}

describe("importador do manual", () => {
  it("lê a planilha fictícia e resume 3 padrões, 3 elementos, 2 requisitos, 2 provas e 1 N/A", async () => {
    const planilha = await ficticia();
    expect(resumir(planilha)).toEqual({
      padroes: 3,
      elementos: 3,
      requisitos: 2,
      provas: 2,
      naManual: 1,
    });
    expect(contagemPorCriterio(planilha)).toEqual([
      { criterio: "01", total: 2 },
      { criterio: "02", total: 1 },
    ]);
    expect(planilha.requisitos[0]?.provas.map((prova) => prova.codigo)).toEqual(["D1", "V1"]);
    expect(planilha.padroes[0]?.codigo).toBe("ES 0 01.01_00");
    expect(planilha.padroes.every((padrao) => padrao.manual === "ME 0 0_00")).toBe(true);
  });

  it("aceita os totais informados e recusa a divergência antes da transação", async () => {
    const planilha = await ficticia();
    expect(validarTotais(planilha, lerTotaisInformados("01 2\n02 1"))).toEqual([]);
    expect(validarTotais(planilha, { "01": 9, "02": 1 })).toEqual([
      { criterio: "01", informado: 9, naPlanilha: 2 },
    ]);

    let entrou = false;
    expect(() =>
      importarManual(planilha, { "01": 9, "02": 1 }, {
        transaction(fn) {
          entrou = true;
          return fn({ inserir() {} });
        },
      }),
    ).toThrow(TotaisDivergentes);
    expect(entrou).toBe(false);
  });

  it("grava as quatro tabelas dentro da transação e desfaz se a inserção falha", async () => {
    const planilha = await ficticia();
    const gravados: string[] = [];
    const resumo = importarManual(planilha, TOTAIS, {
      transaction(fn) {
        return fn({
          inserir(tabela) {
            gravados.push(tabela);
          },
        });
      },
    });
    expect(resumo.naManual).toBe(1);
    expect(gravados).toEqual([
      "padroes",
      "padroes",
      "padroes",
      "elementos_avaliaveis",
      "elementos_avaliaveis",
      "elementos_avaliaveis",
      "requisitos_avaliacao",
      "requisitos_avaliacao",
      "provas",
      "provas",
    ]);

    const confirmados: string[] = [];
    expect(() =>
      importarManual(planilha, TOTAIS, {
        transaction(fn) {
          const pendentes: string[] = [];
          try {
            return fn({
              inserir(tabela) {
                if (tabela === "provas") throw new Error("disco");
                pendentes.push(tabela);
              },
            });
          } catch (erro) {
            pendentes.length = 0;
            throw erro;
          } finally {
            confirmados.push(...pendentes);
          }
        },
      }),
    ).toThrow(/disco/);
    expect(confirmados).toEqual([]);
  });
});
