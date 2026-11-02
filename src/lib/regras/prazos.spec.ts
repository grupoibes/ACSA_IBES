import { describe, expect, it } from "vitest";
import { prazoAutoavaliacao, prazoManutencao, prazoRecertificacao } from "./prazos";

describe("prazos v0.5", () => {
  it("dá 12 meses a partir da abertura para a autoavaliação e para o pedido de auditoria", () => {
    const prazo = prazoAutoavaliacao("2026-03-15");
    expect(prazo).toBe("2027-03-15");
    expect(prazoAutoavaliacao("2026-03-15")).toBe(prazo);
  });

  it("conta manutenção e recertificação a partir da certificação", () => {
    expect(prazoManutencao("2026-03-15")).toBe("2028-09-15");
    expect(prazoRecertificacao("2026-03-15")).toBe("2031-03-15");
  });
});
