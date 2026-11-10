import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

async function parecer(page: import("@playwright/test").Page, membro: string, voto: string, quantidade: number) {
  await page.locator("#papel").selectOption({ label: membro });
  await page.goto("/projetos/2025-009/comite");
  await page.getByLabel("Voto do comitê").selectOption({ label: voto });
  await page.getByRole("checkbox", { name: "Declaro ausência de conflito" }).check();
  await page.getByRole("button", { name: "Registrar parecer" }).click();
  await expect(page.locator("li", { hasText: "Parecer fictício." })).toHaveCount(quantidade);
}

test("T18 fica sem consenso e libera quando os três votos ficam iguais", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Avaliador líder");
  await page.goto("/projetos/2025-009/avaliacao");
  await page.getByLabel("Resultado da rodada").selectOption({ label: "Positiva" });
  await page.getByRole("button", { name: "Definir resultado" }).click();

  await parecer(page, "Membro do Comitê F", "Conceder", 1);
  await parecer(page, "Membro do Comitê G", "Conceder", 2);
  await parecer(page, "Membro do Comitê H", "Não conceder", 3);
  await expect(page.getByTestId("consenso")).toHaveText("Sem consenso.");

  await page.getByLabel("Voto do comitê").selectOption({ label: "Conceder" });
  await page.getByRole("checkbox", { name: "Declaro ausência de conflito" }).check();
  await page.getByRole("button", { name: "Registrar parecer" }).click();
  await expect(page.getByTestId("consenso")).toHaveText("Consenso");

  await page.getByRole("button", { name: "Registrar resolução" }).click();
  await expect(page.getByText("Resolução RES-2025-009")).toBeVisible();
});
