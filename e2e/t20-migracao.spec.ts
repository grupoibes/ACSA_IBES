import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T20 o IBES vê a migração e o cliente vê a restrição", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Backoffice IBES");
  await page.getByRole("link", { name: "Migração ACSA" }).click();
  await expect(page.getByRole("heading", { name: "Migração ACSA" })).toBeVisible();
  await expect(page.getByTestId("inventario")).toContainText("72");
  await expect(page.getByText("ME 2 1_05")).toBeVisible();
  await expect(page.getByText("ME 5 1_07")).toBeVisible();
  await expect(page.getByText("ME 28 1_01")).toBeVisible();
  await expect(page.getByText("Hospital Modelo de Demonstração")).toBeVisible();
  await expect(page.getByText("Exportação formal: Em negociação")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-migracao.png", fullPage: true });

  await page.locator("#papel").selectOption({ label: "Responsável do projeto" });
  await expect(page.getByTestId("migracao-restrita")).toContainText("perfis do IBES");
});
