import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T21 cria o projeto, abre 2025/009 e o complementar, e recusa o código cru", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Backoffice IBES");
  await expect(page.getByTestId("indice-busca")).toBeVisible();
  await expect(page.getByText("Criado do zero").first()).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/01-indice.png", fullPage: true });
  await page.locator("form").first().screenshot({ path: "/opt/cursor/artifacts/02-novo-projeto.png" });
  await page.getByRole("heading", { name: "Candidaturas" }).locator("xpath=ancestor::div[contains(@class,'sec')]").screenshot({
    path: "/opt/cursor/artifacts/03-candidaturas.png",
  });

  await page.getByLabel("Código").fill("2026/020");
  await page.getByLabel("Instituição").fill("Clínica Nova Fictícia");
  await page.getByLabel("Data de abertura").fill("2026-04-09");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByTestId("ficha-cliente")).toHaveText("Clínica Nova Fictícia");
  await expect(page.getByTestId("ficha-codigo")).toHaveText("2026/020");
  await expect(page.getByTestId("projeto-novo")).toContainText("Projeto novo");
  await expect(page.getByText("Diagnóstico").first()).toBeVisible();
  await expect(page.getByTestId("janela")).toContainText("09/04/2027");
  await expect(page.getByText("15/12/2026")).toHaveCount(0);
  expect(page.url()).toContain("/projetos/2026-020");
  expect(page.url()).not.toContain("2026/020");
  await page.screenshot({ path: "/opt/cursor/artifacts/04-ficha.png", fullPage: true });

  await page.getByRole("link", { name: "Diagnóstico e escopo" }).click();
  await expect(page.getByRole("heading", { name: "Diagnóstico e escopo" })).toBeVisible();
  await expect(page.getByText("entra na próxima rodada")).toHaveCount(0);
  await expect(page.getByText("15/12/2026")).toHaveCount(0);

  await page.goto("/projetos");
  await expect(page.getByRole("row", { name: /2026\/020/ })).toContainText("Criado do zero");
  await page.getByLabel("Código").fill("2025/009");
  await page.getByLabel("Instituição").fill("Outra instituição");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByText(/já existe/)).toBeVisible();

  await page.getByRole("link", { name: "Abrir" }).first().click();
  await expect(page.getByTestId("ficha-cliente")).toHaveText("Hospital Modelo de Demonstração");
  await expect(page.getByTestId("ficha-codigo")).toHaveText("2025/009");
  await expect(page.getByTestId("projeto-novo")).toHaveCount(0);
  expect(page.url()).toContain("/projetos/2025-009");
  expect(page.url()).not.toMatch(/2025\/009/);

  await page.goto("/projetos/2023-014-C");
  await expect(page.getByTestId("ficha-codigo")).toHaveText("2023/014-C");
  await expect(page.getByTestId("ficha-cliente")).toHaveText("Policlínica Exemplo Sul");
  await expect(page.getByText("Complementar de 2023/014")).toBeVisible();
  expect(page.url()).toContain("/projetos/2023-014-C");
  expect(page.url()).not.toContain("2023/014");

  const cru = await page.goto("/projetos/2025/009");
  expect(cru?.status()).toBe(404);
  const codificado = await page.goto("/projetos/2025%2F009");
  expect(codificado?.status() === 404 || (await page.getByTestId("ficha-cliente").count()) === 0).toBeTruthy();

  await page.goto("/projetos");
  await page.getByTestId("indice-busca").fill("modelo");
  await expect(page.getByRole("cell", { name: "Hospital Modelo de Demonstração" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Centro de Diagnóstico Fictício" })).toHaveCount(0);
  await page.getByTestId("indice-busca").fill("ME 28");
  await expect(page.getByRole("cell", { name: "Centro de Diagnóstico Fictício" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Hospital Modelo de Demonstração" })).toHaveCount(0);
  await page.getByTestId("indice-busca").fill("");

  const linha = page.getByRole("row", { name: /2026\/015/ });
  await linha.getByRole("button", { name: "Validar" }).click();
  await expect(linha).toContainText("Validada");
  await linha.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByLabel("Instituição")).toHaveValue("Clínica Exemplo Leste");
  await page.locator("form").getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByTestId("ficha-cliente")).toHaveText("Clínica Exemplo Leste");
  await expect(page.getByTestId("ficha-codigo")).toHaveText("2026/015");
  await expect(page.getByTestId("projeto-novo")).toBeVisible();
  expect(page.url()).toContain("/projetos/2026-015");
});
