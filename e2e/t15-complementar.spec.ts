import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T15 concede a certificação e abre o complementar 2025/009-C", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Avaliador líder");
  await page.goto("/projetos/2025-009/avaliacao");
  await page.getByLabel("Resultado da rodada").selectOption({ label: "Positiva" });
  await page.getByRole("button", { name: "Definir resultado" }).click();
  await expect(page.getByText("Rodada 1 · positiva")).toBeVisible();

  let pareceres = 0;
  for (const membro of ["Membro do Comitê F", "Membro do Comitê G", "Membro do Comitê H"]) {
    await page.locator("#papel").selectOption({ label: membro });
    await page.goto("/projetos/2025-009/comite");
    await page.getByLabel("Voto do comitê").selectOption({ label: "Conceder" });
    await page.getByRole("checkbox", { name: "Declaro ausência de conflito" }).check();
    await page.getByRole("button", { name: "Registrar parecer" }).click();
    pareceres += 1;
    await expect(page.locator("li", { hasText: "Parecer fictício." })).toHaveCount(pareceres);
  }

  await page.getByRole("button", { name: "Registrar resolução" }).click();
  await expect(page.getByText("Resolução RES-2025-009")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-comite.png", fullPage: true });

  await page.locator("#papel").selectOption({ label: "Backoffice IBES" });
  await page.goto("/projetos/2025-009/workflow");
  await Promise.all([
    page.waitForResponse((resposta) => resposta.url().includes("/acoes") && resposta.request().method() === "POST" && resposta.ok()),
    page.getByRole("button", { name: "Abrir projeto complementar" }).click(),
  ]);
  await page.goto("/projetos");
  await expect(page.getByText("Complementar de 2025/009")).toBeVisible();
  await expect(page.getByText("2025/009-C")).toBeVisible();
});
