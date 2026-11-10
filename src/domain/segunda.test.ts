import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { requisitosFicticios } from "@/domain/catalogo";
import {
  avisoLimiteUsuarios,
  clienteNaRestricao,
  janelaRestricao,
  LIMITE_USUARIOS_PADRAO,
  pontosDoRelatorio,
  podeVerRequisitos,
  RESTRICAO_SEMANAS_ANTES,
  RESTRICAO_SEMANAS_DEPOIS,
  resultadoPermitido,
  resultadoPrevalente,
  resolucaoPermitida,
  textoRelatorio,
  type PontoRegistro,
} from "@/domain/segunda";

describe("restrição do cliente", () => {
  it("vai de 5 semanas antes até o dia da visita, inclusive, e não passa do dia", () => {
    assert.equal(RESTRICAO_SEMANAS_ANTES, 5);
    assert.equal(RESTRICAO_SEMANAS_DEPOIS, 0);
    const janela = janelaRestricao("2026-11-09");
    assert.equal(janela.inicio, "2026-10-05");
    assert.equal(janela.fim, "2026-11-09");
    assert.equal(clienteNaRestricao("2026-10-05", "2026-11-09", "responsavel_projeto"), true);
    assert.equal(clienteNaRestricao("2026-11-09", "2026-11-09", "responsavel_projeto"), true);
    assert.equal(clienteNaRestricao("2026-11-10", "2026-11-09", "responsavel_projeto"), false);
    assert.equal(clienteNaRestricao("2026-11-09", "2026-11-09", "backoffice_ibes"), false);
  });
});

describe("usuários da organização", () => {
  it("avisa o backoffice ao passar de 40 e não trata o número como bloqueio", () => {
    assert.equal(LIMITE_USUARIOS_PADRAO, 40);
    assert.equal(avisoLimiteUsuarios(40, 40, "backoffice_ibes"), null);
    const aviso = avisoLimiteUsuarios(41, 40, "backoffice_ibes");
    assert.match(aviso ?? "", /41/);
    assert.equal(avisoLimiteUsuarios(41, 40, "responsavel_projeto"), null);
  });
});

describe("requisitos e relatório", () => {
  it("esconde o requisito do cliente e leva ao relatório só o ponto consolidado", () => {
    assert.equal(podeVerRequisitos("avaliador_ibes"), true);
    assert.equal(podeVerRequisitos("responsavel_projeto"), false);
    assert.equal(requisitosFicticios().some((item) => item.provas.some((prova) => prova.nome === "Entrevista")), true);
    const pontos: PontoRegistro[] = [
      { id: "1", avaliacaoId: "a", tipo: "forte", texto: "Ponto fictício consolidado.", autorId: "u", consolidado: true },
      { id: "2", avaliacaoId: "a", tipo: "fraco", texto: "Ponto fictício ainda solto.", autorId: "u", consolidado: false },
    ];
    const texto = textoRelatorio({
      codigo: "2025/009",
      instituicao: "Hospital Modelo de Demonstração",
      rodada: 1,
      tipo: "certificacao",
      dataVisita: "2027-03-16",
      resultadoRodada: "em_curso",
      linhas: [{ codigo: "PF I 01.01_00", titulo: "Padrão fictício", resultado: "cumpre", observacao: "Achado fictício." }],
      pontos,
      nivel: "Avançado",
    });
    assert.match(texto, /Ponto fictício consolidado/);
    assert.equal(texto.includes("ainda solto"), false);
    assert.equal(pontosDoRelatorio(pontos).length, 1);
    assert.equal(resultadoPrevalente("nao_cumpre"), "nao_cumpre");
    assert.equal(resultadoPermitido("manutencao", "mantem"), true);
    assert.equal(resultadoPermitido("manutencao", "cumpre"), false);
  });

  it("bloqueia a resolução sem consenso e pede justificativa quando o nível muda", () => {
    assert.match(
      resolucaoPermitida(
        [{ voto: "conceder" }, { voto: "conceder" }, { voto: "nao_conceder" }],
        "avancado",
        "avancado",
        "",
      ) ?? "",
      /Sem consenso/,
    );
    assert.equal(
      resolucaoPermitida(
        [{ voto: "conceder" }, { voto: "conceder" }, { voto: "conceder" }],
        "otimo",
        "avancado",
        "",
      ),
      "A justificativa é obrigatória quando o nível final difere do calculado.",
    );
    assert.equal(
      resolucaoPermitida(
        [{ voto: "conceder" }, { voto: "conceder" }, { voto: "conceder" }],
        "avancado",
        "avancado",
        "",
      ),
      null,
    );
  });
});
