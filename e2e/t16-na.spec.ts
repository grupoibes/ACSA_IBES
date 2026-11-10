import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T16 separa o não se aplica do manual e o do diagnóstico", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "IBES · Backoffice IBES");
  await page.getByLabel("Código").fill("2026/030");
  await page.getByLabel("Instituição").fill("Hospital Fictício do Escopo");
  await page.getByLabel("Data de abertura").fill("2026-04-09");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByTestId("ficha-codigo")).toHaveText("2026/030");

  await page.getByRole("link", { name: "Diagnóstico e escopo" }).click();
  await expect(page.getByTestId("listados")).toHaveText("101");
  await page.getByLabel("Avaliador do diagnóstico").selectOption({ label: "Helena Prado" });
  await page.getByLabel("Data do diagnóstico").fill("2026-11-06");
  await page.getByLabel("Relatório do diagnóstico").setInputFiles({
    name: "relatorio.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.1\nrelatorio ficticio\n%%EOF"),
  });
  await page.getByRole("button", { name: "Salvar diagnóstico" }).click();
  await expect(page.getByText("Diagnóstico gravado.")).toBeVisible();

  await expect(page.getByLabel("Não se aplica PF II 01.24_00")).toBeDisabled();
  await expect(page.getByLabel("Não se aplica PF III 02.12_00")).toBeDisabled();
  await page.getByLabel("Não se aplica PF I 07.07_00").click();
  await expect(page.getByTestId("aplicaveis")).toHaveText("98");
  await page.getByLabel("Não se aplica PF II 07.08_00").click();
  await expect(page.getByTestId("aplicaveis")).toHaveText("97");

  await page.getByRole("link", { name: "Ficha do projeto" }).click();
  await expect(page.getByTestId("na-manual")).toHaveText("2");
  await expect(page.getByTestId("na-diagnostico")).toHaveText("2");
  await expect(page.getByTestId("na-aplicaveis")).toHaveText("97");
  await page.screenshot({ path: "/opt/cursor/artifacts/2b-escopo.png", fullPage: true });
});
