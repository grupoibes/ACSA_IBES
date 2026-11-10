import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

const PADRAO = "f1000000-0000-4000-8000-000000000001";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T17 o avaliador vê requisitos e provas e o cliente não vê", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Avaliador");
  await page.goto(`/projetos/2025-009/padroes/${PADRAO}`);
  await expect(page.getByRole("heading", { name: "Requisitos de avaliação" })).toBeVisible();
  await expect(page.getByTestId("requisitos-avaliacao")).toContainText("Documentação");
  await expect(page.getByTestId("requisitos-avaliacao")).toContainText("Visita");
  await expect(page.getByTestId("requisitos-avaliacao")).toContainText("Entrevista");

  await page.goto("/projetos/2025-009/avaliacao");
  await expect(page.getByRole("heading", { name: "Requisitos de avaliação" })).toBeVisible();
  await expect(page.getByTestId("requisitos-avaliacao")).toContainText("Entrevista");
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-avaliacao.png", fullPage: true });
  await page.goto("/projetos/2025-009/relatorios");
  await expect(page.getByTestId("relatorio-texto")).toContainText("Ponto fictício consolidado");
  await expect(page.getByTestId("relatorio-texto")).not.toContainText("não consolidado");
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-relatorio.png", fullPage: true });

  await page.locator("#papel").selectOption({ label: "Responsável do projeto" });
  await page.goto(`/projetos/2025-009/padroes/${PADRAO}`);
  await expect(page.getByRole("heading", { name: "Padrão fictício I 01.01" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Requisitos de avaliação" })).toHaveCount(0);
  await page.goto("/projetos/2025-009/avaliacao");
  await expect(page.getByRole("heading", { name: "Agendamento e relatório" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Requisitos de avaliação" })).toHaveCount(0);
});
