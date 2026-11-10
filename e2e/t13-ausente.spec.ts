import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T13 mostra Ausente e Pendente e deixa o grupo vazio em cinza", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "Cliente · Responsável do projeto");
  await page.goto("/projetos/2025-009/autoavaliacao");
  await expect(page.getByRole("heading", { name: "Painel da autoavaliação" })).toBeVisible();
  await expect(page.getByText("Ausente").first()).toBeVisible();
  await expect(page.getByText("Pendente").first()).toBeVisible();
  await expect(page.getByText("C/PTE")).toHaveCount(0);
  await expect(page.getByTestId("resumo-I")).toContainText("0 de 65");
  const grupo3 = page.getByTestId("resumo-III");
  await expect(grupo3).toContainText("—");
  await expect(grupo3).toHaveClass(/grupo-vazio/);
  await page.screenshot({ path: "/opt/cursor/artifacts/2a-autoavaliacao.png" });

  await page.getByRole("link", { name: "PF I 01.01_00" }).click();
  await expect(page.getByRole("heading", { name: /Padrão fictício/ })).toBeVisible();
  await expect(page.getByText("Enviada, conferida, chancelada")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/2a-padrao.png" });
});
