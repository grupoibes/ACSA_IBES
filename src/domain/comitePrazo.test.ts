import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PRAZO_COMITE_DIAS, prazoComite } from "@/domain/comitePrazo";

describe("prazo do comitê", () => {
  it("conta 30 dias a partir do resultado positivo e bloqueia no dia seguinte", () => {
    assert.equal(PRAZO_COMITE_DIAS, 30);
    const noPrazo = prazoComite("2026-01-01T10:00:00-03:00", "2026-01-31");
    assert.equal(noPrazo.prazo, "2026-01-31");
    assert.equal(noPrazo.vencido, false);
    const vencido = prazoComite("2026-01-01", "2026-02-01");
    assert.equal(vencido.vencido, true);
  });

  it("não vence enquanto não há resultado positivo", () => {
    assert.deepEqual(prazoComite(null, "2026-06-01"), { prazo: null, vencido: false });
  });
});
