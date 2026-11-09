import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T12 a matriz deixa o educador conferir, o tutor chancelar e o autorizador só conferir", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Educador");
  await page.getByRole("link", { name: "Abrir" }).first().click();
  await page.getByRole("link", { name: "Usuários" }).click();
  await expect(page.getByRole("heading", { name: "Perfis e permissões" })).toBeVisible();
  await expect(page.getByTestId("matriz-educador-conferir")).toHaveText("Sim");
  await expect(page.getByTestId("matriz-educador-chancelar")).toHaveText("Não");
  await expect(page.getByTestId("matriz-tutor_relatorio-chancelar")).toHaveText("Sim");
  await expect(page.getByTestId("matriz-autorizador-conferir")).toHaveText("Sim");
  await expect(page.getByTestId("matriz-autorizador-chancelar")).toHaveText("Não");
  await page.screenshot({ path: "/opt/cursor/artifacts/2a-perfis.png" });
});
