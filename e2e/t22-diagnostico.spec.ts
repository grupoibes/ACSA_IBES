import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T22 grava o diagnóstico, reduz os aplicáveis a 98 e avança até a autoavaliação", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Backoffice IBES");
  await page.getByLabel("Código").fill("2026/021");
  await page.getByLabel("Instituição").fill("Hospital Fictício do Diagnóstico");
  await page.getByLabel("Data de abertura").fill("2026-04-09");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByTestId("ficha-codigo")).toHaveText("2026/021");

  await page.getByRole("link", { name: "Diagnóstico e escopo" }).click();
  await page.getByLabel("Avaliador do diagnóstico").selectOption({ label: "Helena Prado" });
  await page.getByLabel("Data do diagnóstico").fill("2026-11-06");
  await page.getByLabel("Relatório do diagnóstico").setInputFiles({
    name: "relatorio.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.1\nrelatorio ficticio\n%%EOF"),
  });
  await page.getByRole("button", { name: "Salvar diagnóstico" }).click();
  await expect(page.getByText("Diagnóstico gravado.")).toBeVisible();
  await expect(page.getByTestId("aplicaveis")).toHaveText("99");
  await page.getByLabel("Não se aplica PF I 01.01_00").click();
  await expect(page.getByTestId("aplicaveis")).toHaveText("98");
  await page.getByRole("button", { name: "Ver arquivo" }).click();
  await expect(page.getByRole("dialog", { name: "relatorio.pdf" })).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  await page.screenshot({ path: "/opt/cursor/artifacts/2a-diagnostico.png" });

  await page.getByRole("link", { name: "Workflow e prazos" }).click();
  await expect(page.getByTestId("etapa-atual")).toHaveText("Diagnóstico");
  await expect(page.getByText("Unidade a confirmar (dias ou meses)").first()).toBeVisible();
  await page.getByRole("button", { name: "Avançar para Solicitação" }).click();
  await expect(page.getByTestId("etapa-atual")).toHaveText("Solicitação");
  await page.getByRole("button", { name: "Avançar para Autoavaliação" }).click();
  await expect(page.getByTestId("etapa-atual")).toHaveText("Autoavaliação");
  await expect(page.getByTestId("email-etapa")).toContainText("avançou para");
  await expect(page.getByTestId("auditoria-etapa")).toContainText("emails_enviados");
  await page.screenshot({ path: "/opt/cursor/artifacts/2a-workflow.png", fullPage: true });

  await page.goto("/projetos/2023-014-C/workflow");
  await expect(page.getByRole("heading", { name: "Histórico de 2023/014" })).toBeVisible();
  await expect(page.getByText("Fato fictício registrado na origem 2023/014.")).toBeVisible();
});
