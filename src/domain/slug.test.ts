import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { codigoParaSlug, slugParaCodigo } from "@/domain/slug";

describe("slug do projeto", () => {
  it("troca a barra por hífen e distingue o complementar", () => {
    assert.equal(codigoParaSlug("2025/009"), "2025-009");
    assert.equal(codigoParaSlug("2023/014-C"), "2023-014-C");
    assert.equal(codigoParaSlug("2025/009").includes("/"), false);
    assert.equal(codigoParaSlug("2023/014-C").includes("/"), false);
  });

  it("recusa o código cru na leitura do slug", () => {
    assert.equal(slugParaCodigo("2025-009"), "2025/009");
    assert.equal(slugParaCodigo("2023-014-C"), "2023/014-C");
    assert.equal(slugParaCodigo("2025/009"), null);
    assert.equal(slugParaCodigo("2025%2F009"), null);
    assert.notEqual(slugParaCodigo("2025-009"), slugParaCodigo("2023-014-C"));
  });
});
