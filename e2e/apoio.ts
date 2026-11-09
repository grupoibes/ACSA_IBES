import { expect, type Page } from "@playwright/test";

export async function entrar(page: Page, rotulo: string) {
  await page.goto("/");
  await page.locator("#entrada-perfil").selectOption({ label: rotulo });
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Projetos" })).toBeVisible();
}

export async function resetar(page: Page) {
  const resposta = await page.request.post("/api/demo/reset");
  expect(resposta.ok()).toBeTruthy();
}
