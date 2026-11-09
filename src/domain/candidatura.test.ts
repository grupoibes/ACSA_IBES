import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  converterCandidatura,
  devolverCandidatura,
  validarCandidatura,
  type Candidatura,
} from "@/domain/candidatura";

const recebida: Candidatura = {
  id: "c1",
  codigo: "2026/015",
  instituicao: "Clínica Exemplo Leste",
  situacao: "recebida",
  motivoDevolucao: null,
  avaliadaPor: null,
  avaliadaEm: null,
  projetoId: null,
  recebidaEm: "2026-10-20",
};

describe("candidatura", () => {
  it("valida e só então converte no projeto", () => {
    const validada = validarCandidatura(recebida, "backoffice", "2026-11-09T12:00:00-03:00");
    assert.equal(validada.situacao, "validada");
    assert.throws(() => converterCandidatura(recebida, "proj", "backoffice", "2026-11-09T12:00:00-03:00"), /validada/);
    const convertida = converterCandidatura(validada, "proj-1", "backoffice", "2026-11-09T13:00:00-03:00");
    assert.equal(convertida.situacao, "convertida");
    assert.equal(convertida.projetoId, "proj-1");
  });

  it("devolver exige motivo no domínio", () => {
    assert.throws(() => devolverCandidatura(recebida, "   ", "backoffice", "2026-11-09T12:00:00-03:00"), /motivo/);
    const devolvida = devolverCandidatura(recebida, " Falta o contrato ", "backoffice", "2026-11-09T12:00:00-03:00");
    assert.equal(devolvida.situacao, "devolvida");
    assert.equal(devolvida.motivoDevolucao, "Falta o contrato");
    assert.equal(devolvida.avaliadaPor, "backoffice");
  });
});
