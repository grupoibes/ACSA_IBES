import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aplicaveis, catalogoFicticio, idPadrao } from "./catalogo";
import {
  codigoComplementar,
  gravarResposta,
  itensDeSaida,
  montarPainel,
  resumoGrupos,
  saidaAutoavaliacaoBloqueada,
  seloDoPadrao,
  type EvidenciaRegistro,
  type RespostaRegistro,
} from "./rodada";

describe("respostas por ciclo", () => {
  it("não deixa a manutenção sobrescrever a autoavaliação inicial", () => {
    const inicial: RespostaRegistro = {
      projetoId: "p",
      padraoId: "a",
      ciclo: "inicial",
      atende: true,
      texto: "inicial",
      cumpre: false,
    };
    const gravadas = gravarResposta(gravarResposta([], inicial), {
      ...inicial,
      ciclo: "manutencao_1",
      atende: false,
      texto: "manutenção",
    });
    assert.equal(gravadas.length, 2);
    assert.equal(gravadas.find((item) => item.ciclo === "inicial")?.texto, "inicial");
    const revista = gravarResposta(gravadas, { ...inicial, texto: "revista" });
    assert.equal(revista.length, 2);
    assert.equal(revista.find((item) => item.ciclo === "inicial")?.texto, "revista");
    assert.equal(revista.find((item) => item.ciclo === "manutencao_1")?.texto, "manutenção");
  });
});

describe("resumo e saída", () => {
  const catalogo = catalogoFicticio();
  const g3 = catalogo.filter((item) => item.grupo === "III" && !item.naoSeAplicaManual).map((item) => item.id);

  it("mostra Ausente e deixa o grupo sem aplicável em cinza", () => {
    const primeiro = idPadrao(1);
    const resumo = resumoGrupos(
      catalogo,
      new Set(g3),
      [{ id: "e", projetoId: "p", padraoId: primeiro, descricao: "fato", etapa: "enviada", documentoIds: [] }],
      [],
      "inicial",
    );
    const grupo3 = resumo.find((item) => item.grupo === "III");
    assert.equal(grupo3?.vazio, true);
    assert.equal(grupo3?.rotulo, "—");
    const grupo1 = resumo.find((item) => item.grupo === "I");
    assert.equal(grupo1?.ausentes, 64);
    assert.equal(grupo1?.pendentes, 1);
    assert.equal(grupo1?.cumpridos, 0);
    assert.equal(seloDoPadrao(true, []), "Ausente");
    assert.equal(seloDoPadrao(true, ["conferida"]), "Pendente");
  });

  it("bloqueia a saída sem Cumpre e evidência chancelada, mesmo com área concluída no lugar da evidência", () => {
    const na = new Set<string>();
    const respostas: RespostaRegistro[] = aplicaveis(catalogo, na)
      .filter((item) => item.obrigatorio)
      .map((item) => ({
        projetoId: "p",
        padraoId: item.id,
        ciclo: "inicial" as const,
        atende: true,
        texto: "sim",
        cumpre: true,
      }));
    const evidencias: EvidenciaRegistro[] = respostas.map((item) => ({
      id: item.padraoId,
      projetoId: "p",
      padraoId: item.padraoId,
      descricao: "fato",
      etapa: "chancelada" as const,
      documentoIds: [],
    }));
    assert.equal(saidaAutoavaliacaoBloqueada(itensDeSaida(catalogo, na, evidencias, respostas, "inicial")), false);
    evidencias[0].etapa = "conferida";
    assert.equal(saidaAutoavaliacaoBloqueada(itensDeSaida(catalogo, na, evidencias, respostas, "inicial")), true);
    evidencias[0].etapa = "chancelada";
    respostas[0].cumpre = false;
    assert.equal(saidaAutoavaliacaoBloqueada(itensDeSaida(catalogo, na, evidencias, respostas, "inicial")), true);
  });

  it("esconde o não se aplica da instituição e abre o código complementar", () => {
    const painel = montarPainel({
      perfil: "responsavel_projeto",
      projeto: { abertura: "2026-04-09", vencimento: null, etapaFluxo: "autoavaliacao", ciclo: "inicial" },
      ciclo: "inicial",
      padroes: catalogo,
      diagnostico: {
        projetoId: "p",
        avaliadorId: "a",
        realizadoEm: "2026-11-01",
        anexoNome: "relatorio.pdf",
        anexoCaminho: "projeto/p/documentos/d/v1/relatorio.pdf",
      },
      naoAplicaveis: g3,
      respostas: [],
      evidencias: [],
      areas: [],
      emails: [],
      auditoria: [],
      origem: null,
    });
    assert.equal(painel.diagnostico, null);
    assert.equal(painel.linhas.some((linha) => !linha.aplicavel), false);
    assert.equal(painel.resumo.find((item) => item.grupo === "III")?.rotulo, "—");
    assert.equal(codigoComplementar("2023/014"), "2023/014-C");
  });
});
