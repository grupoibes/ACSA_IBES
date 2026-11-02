import { describe, expect, it } from "vitest";
import { exigeJustificativaNivel, podeResolver } from "./comite";

describe("consenso do comitê", () => {
  it("libera quando os três pareceres têm o mesmo voto", () => {
    expect(podeResolver([{ voto: "conceder" }, { voto: "conceder" }, { voto: "conceder" }])).toEqual({
      liberado: true,
      voto: "conceder",
    });
  });

  it("bloqueia 2 a 1 com SEM_CONSENSO", () => {
    expect(podeResolver([{ voto: "conceder" }, { voto: "conceder" }, { voto: "negar" }])).toEqual({
      liberado: false,
      motivo: "SEM_CONSENSO",
    });
  });

  it("bloqueia com menos de três pareceres", () => {
    const curto = podeResolver([{ voto: "conceder" }, { voto: "conceder" }]);
    const vazio = podeResolver([]);
    expect(curto.liberado).toBe(false);
    expect(vazio.liberado).toBe(false);
    if (!vazio.liberado) expect(vazio.motivo).toBe("PARECERES_INSUFICIENTES");
  });

  it("pede justificativa quando o nível final difere do calculado", () => {
    expect(exigeJustificativaNivel("avancado", "otimo")).toBe(true);
    expect(exigeJustificativaNivel("otimo", "otimo")).toBe(false);
  });
});
