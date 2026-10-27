import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularNivel, minimoSeContasseExcluidos, type PadraoNoCalculo } from "@/domain/calcularNivel";
import {
  CONTAGEM_REFERENCIA_ESTRUTURA,
  MANUAL_OPERACIONAL,
  MANUAL_REFERENCIA_ESTRUTURA,
  minimoCumpridos,
} from "@/domain/manuais";
import { criarProjetoAmostra, entradaDaAvaliacao, nivelDaAvaliacao } from "@/domain/projeto";

describe("mínimo inteiro", () => {
  it("calcula o menor inteiro que alcança o percentual", () => {
    assert.equal(minimoCumpridos(10, 70), 7);
    assert.equal(minimoCumpridos(8, 70), 6);
    assert.equal(minimoCumpridos(6, 70), 5);
    assert.equal(minimoCumpridos(3, 40), 2);
    assert.equal(minimoCumpridos(2, 40), 1);
    assert.equal(minimoCumpridos(5, 100), 5);
    assert.equal(minimoCumpridos(0, 70), 0);
  });
});

describe("calcularNivel", () => {
  const projeto = criarProjetoAmostra();
  const rodada2 = projeto.avaliacoes.find((item) => item.rodada === 2)!;

  it("tira o não aplicável do total e do mínimo e concede Ótima", () => {
    const resultado = nivelDaAvaliacao(projeto, rodada2.id);
    const grupoII = resultado.grupos.find((item) => item.grupo === "II")!;

    assert.equal(resultado.manual, MANUAL_OPERACIONAL);
    assert.equal(resultado.nivel, "otimo");
    assert.equal(grupoII.totalManual, 3);
    assert.equal(grupoII.excluidosNaoAplicaveis, 1);
    assert.equal(grupoII.totalAplicavel, 2);
    assert.equal(grupoII.cumpridos, 1);
    assert.equal(grupoII.minimoCumpridos, 1);
    assert.equal(minimoSeContasseExcluidos(grupoII), 2);
    assert.equal(resultado.catalogoContado, 12);
    assert.notEqual(resultado.catalogoContado, CONTAGEM_REFERENCIA_ESTRUTURA);
    assert.equal(resultado.referenciaEstruturaIgnorada.padroes, 144);
  });

  it("não concede Ótima se o excluído volta para o denominador sem estar cumprido", () => {
    const entrada = entradaDaAvaliacao(projeto, rodada2.id);
    entrada.padroes = entrada.padroes.map((padrao) =>
      padrao.id === "5.06.02" ? { ...padrao, naoAplicavel: false, cumprido: false } : padrao,
    );
    const resultado = calcularNivel(entrada);
    const grupoII = resultado.grupos.find((item) => item.grupo === "II")!;
    assert.equal(grupoII.totalAplicavel, 3);
    assert.equal(grupoII.minimoCumpridos, 2);
    assert.equal(grupoII.cumpridos, 1);
    assert.equal(resultado.nivel, "avancado");
  });

  it("bloqueia qualquer nível quando um obrigatório aplicável falha", () => {
    const entrada = entradaDaAvaliacao(projeto, rodada2.id);
    entrada.padroes = entrada.padroes.map((padrao) =>
      padrao.id === "5.05.01" ? { ...padrao, cumprido: false } : padrao,
    );
    assert.equal(calcularNivel(entrada).nivel, null);
  });

  it("não deixa um obrigatório não aplicável segurar o nível", () => {
    const entrada = entradaDaAvaliacao(projeto, rodada2.id);
    entrada.padroes = entrada.padroes.map((padrao) =>
      padrao.id === "5.05.01" ? { ...padrao, naoAplicavel: true, cumprido: false } : padrao,
    );
    const resultado = calcularNivel(entrada);
    const grupoI = resultado.grupos.find((item) => item.grupo === "I")!;
    assert.equal(grupoI.obrigatoriosAplicaveis, 3);
    assert.equal(grupoI.excluidosNaoAplicaveis, 1);
    assert.equal(resultado.nivel, "otimo");
  });

  it("impede Ótima se o imprescindível aplicável falha, mesmo com o percentual do grupo", () => {
    const entrada = entradaDaAvaliacao(projeto, rodada2.id);
    entrada.padroes = entrada.padroes.map((padrao) => {
      if (padrao.id === "5.04.01") return { ...padrao, cumprido: false };
      if (padrao.id === "5.06.01") return { ...padrao, cumprido: true };
      return padrao;
    });
    const grupoII = calcularNivel(entrada).grupos.find((item) => item.grupo === "II")!;
    assert.equal(grupoII.cumpridos, 1);
    assert.equal(grupoII.minimoCumpridos, 1);
    assert.equal(calcularNivel(entrada).nivel, "avancado");
  });

  it("ignora o Grupo III na manutenção e não concede Excelente", () => {
    const entrada = entradaDaAvaliacao(projeto, rodada2.id);
    entrada.tipo = "manutencao";
    entrada.padroes = entrada.padroes.map((padrao) =>
      padrao.grupo === "III" ? { ...padrao, cumprido: true } : padrao,
    );
    const resultado = calcularNivel(entrada);
    const grupoIII = resultado.grupos.find((item) => item.grupo === "III")!;
    assert.equal(grupoIII.noEscopo, false);
    assert.equal(grupoIII.minimoCumpridos, null);
    assert.equal(resultado.nivel, "otimo");
  });

  it("concede Excelente na recertificação quando os três grupos aplicáveis fecham", () => {
    const entrada = entradaDaAvaliacao(projeto, rodada2.id);
    entrada.tipo = "recertificacao";
    entrada.padroes = entrada.padroes.map((padrao) =>
      padrao.naoAplicavel ? padrao : { ...padrao, cumprido: true },
    );
    const resultado = calcularNivel(entrada);
    assert.equal(resultado.grupos.find((item) => item.grupo === "III")!.cumpridos, 3);
    assert.equal(resultado.nivel, "excelente");
  });

  it("recusa o manual de 144 padrões e qualquer manual que não seja o ME 5 1_07", () => {
    const base = entradaDaAvaliacao(projeto, rodada2.id);
    assert.throws(
      () => calcularNivel({ ...base, manual: MANUAL_REFERENCIA_ESTRUTURA }),
      /referência de estrutura/,
    );
    assert.throws(() => calcularNivel({ ...base, manual: "ME 5 1_08" }), /ME 5 1_07/);
  });

  it("não cobra obrigatório que saiu do grupo e não sobe de nível nos outros grupos", () => {
    const padroes: PadraoNoCalculo[] = [
      {
        id: "so-na",
        grupo: "I",
        obrigatorio: true,
        imprescindivel: false,
        cumprido: false,
        naoAplicavel: true,
      },
      {
        id: "ii",
        grupo: "II",
        obrigatorio: false,
        imprescindivel: true,
        cumprido: false,
        naoAplicavel: false,
      },
      {
        id: "iii",
        grupo: "III",
        obrigatorio: false,
        imprescindivel: false,
        cumprido: false,
        naoAplicavel: false,
      },
    ];
    const resultado = calcularNivel({
      manual: MANUAL_OPERACIONAL,
      tipo: "certificacao",
      padroes,
    });
    assert.equal(resultado.grupos[0]!.totalAplicavel, 0);
    assert.equal(resultado.grupos[0]!.minimoCumpridos, 0);
    assert.equal(resultado.grupos[0]!.obrigatoriosAplicaveis, 0);
    assert.equal(resultado.nivel, "avancado");
  });
});
