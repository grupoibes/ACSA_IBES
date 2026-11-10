import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T14 o responsável pede upgrade e o backoffice inclui na próxima avaliação", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "Cliente · Responsável do projeto");
  await page.goto("/projetos/2025-009");
  await page.getByLabel("Motivo do upgrade").fill("A unidade fictícia quer o nível seguinte.");
  await page.getByRole("button", { name: "Solicitar upgrade" }).click();
  await expect(page.getByText("Recebido")).toBeVisible();

  await page.locator("#papel").selectOption({ label: "Backoffice IBES" });
  await page.getByRole("button", { name: "Incluir na próxima avaliação" }).click();
  await expect(page.getByText("Incluído na próxima avaliação")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-upgrade.png", fullPage: true });

  await page.getByRole("link", { name: "Painel de log" }).click();
  await expect(page.getByRole("heading", { name: "Painel de log" })).toBeVisible();
  await expect(page.getByTestId("log")).toContainText("pedidos_upgrade");
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-log.png", fullPage: true });

  await page.getByRole("link", { name: "Workflow e prazos" }).click();
  await expect(page.getByTestId("email-etapa")).toContainText("Pedido de upgrade");

  await page.getByRole("link", { name: "Usuários" }).click();
  await expect(page.getByRole("heading", { name: "Perfis e permissões" })).toBeVisible();
  await expect(page.getByTestId("limite-usuarios")).toContainText("40");
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-usuarios.png", fullPage: true });

  await page.getByRole("link", { name: "Indicadores" }).click();
  await expect(page.getByRole("heading", { name: "Indicadores" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-indicadores.png", fullPage: true });
});
