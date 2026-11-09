import { expect, test } from "@playwright/test";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T24 o arquivo novo da evidência entra na biblioteca", async ({ page }) => {
  await entrar(page, "Cliente · Responsável pelo upload");
  await page.goto("/projetos/2025-009/biblioteca");
  await page.getByLabel("Arquivo novo da evidência").setInputFiles({
    name: "evidencia.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF evidencia"),
  });
  await page.getByRole("button", { name: "Enviar evidência" }).click();
  await expect(page.getByRole("cell", { name: "evidencia", exact: true })).toBeVisible();
});
