import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T19 autoavaliação e auditoria compartilham a janela de 12 meses", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Backoffice IBES");
  await page.goto("/projetos/2025-009/workflow");
  const janela = page.getByTestId("janela-unica");
  await expect(janela).toContainText("12 meses");
  await expect(janela).toContainText("09/04/2027");
  await expect(janela).toContainText("A manutenção conta da certificação.");
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-workflow.png", fullPage: true });
});
