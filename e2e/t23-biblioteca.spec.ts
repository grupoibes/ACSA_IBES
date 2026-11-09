import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { ID_2025_009, USUARIO_OUTRO, USUARIO_UPLOAD } from "../src/domain/demo";
import { entrar, resetar } from "./apoio";

const pdf = Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T23 envia, recusa, versiona, mostra e reclassifica", async ({ page, request }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "Cliente · Responsável pelo upload");
  await page.goto("/projetos/2025-009/biblioteca");
  await expect(page.getByRole("heading", { name: "Biblioteca de documentos" })).toBeVisible();

  await page.getByLabel("Arquivos").setInputFiles([
    { name: "laudo.pdf", mimeType: "application/pdf", buffer: pdf },
    { name: "planta.png", mimeType: "image/png", buffer: png },
  ]);
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByRole("cell", { name: "laudo", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "planta", exact: true })).toBeVisible();

  await page.getByLabel("Arquivos").setInputFiles({ name: "laudo.pdf", mimeType: "application/pdf", buffer: pdf });
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText("laudo.pdf: Este arquivo já está no projeto.")).toBeVisible();

  await page.getByLabel("Arquivos").setInputFiles({ name: "pacote.zip", mimeType: "application/zip", buffer: Buffer.from("PK") });
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText("pacote.zip: Este tipo de arquivo não é aceito.")).toBeVisible();

  await page.getByLabel("Arquivos").setInputFiles({
    name: "grande.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(26 * 1024 * 1024, 1),
  });
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText("grande.pdf: O arquivo passa de 25 MB.")).toBeVisible();

  await page.getByLabel("Nova versão de laudo").setInputFiles({ name: "laudo-v2.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 v2") });
  await expect(page.getByRole("row", { name: /laudo/ }).getByRole("cell", { name: "v2", exact: true })).toBeVisible();

  await page.getByRole("row", { name: /laudo/ }).getByRole("button", { name: "Ver arquivo" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".prev-box iframe")).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  await page.getByRole("row", { name: /planta/ }).getByRole("button", { name: "Ver arquivo" }).click();
  await expect(page.locator(".prev-box img")).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  await page.getByLabel("Classificação de laudo").selectOption("Ata");
  await expect(page.getByText("Classificação atualizada.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Classificação de laudo")).toHaveValue("Ata");
  await page.screenshot({ path: "/opt/cursor/artifacts/05-biblioteca.png", fullPage: true });

  const enviado = await request.post("/api/documentos", {
    headers: { "x-acsas-perfil": "responsavel_upload", "x-acsas-usuario": USUARIO_UPLOAD },
    multipart: {
      arquivo: { name: "restrito.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF restrito") },
      projetoId: ID_2025_009,
      versao: "1",
      classificacao: "Procedimento",
    },
  });
  expect(enviado.ok()).toBeTruthy();
  const corpo = (await enviado.json()) as { caminho: string };
  const negado = await request.get(`/api/documentos?caminho=${encodeURIComponent(corpo.caminho)}`, {
    headers: { "x-acsas-perfil": "responsavel_projeto", "x-acsas-usuario": USUARIO_OUTRO },
  });
  expect(negado.status()).toBe(403);
});
