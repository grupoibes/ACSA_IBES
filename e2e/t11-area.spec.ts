import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { AREA_RECUSA, AREA_TUTOR, PERFIS_TELA } from "../src/domain/demo";
import { entrar, resetar } from "./apoio";

test.beforeEach(async ({ page }) => {
  await resetar(page);
});

test("T11 a área passa por conferência e chancela, e o autorizador não chancela", async ({ page }) => {
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await entrar(page, "Cliente · Responsável do projeto");
  await page.goto("/projetos/2025-009/melhorias");
  const linha = page.getByRole("row", { name: /Área fictícia já planejada/ });
  await linha.getByRole("button", { name: "Concluir" }).click();
  await expect(linha).toContainText("Aguardando conferência");

  await page.locator("#papel").selectOption({ label: "Conferente" });
  await linha.getByRole("button", { name: "Conferir" }).click();
  await expect(linha).toContainText("Aguardando chancela");

  await page.locator("#papel").selectOption({ label: "Avaliador" });
  await linha.getByRole("button", { name: "Chancelar" }).click();
  await expect(linha).toContainText("Concluída");
  await page.screenshot({ path: "/opt/cursor/artifacts/2a-melhorias.png" });

  const tutor = PERFIS_TELA.find((item) => item.id === "tutor");
  const autorizador = PERFIS_TELA.find((item) => item.id === "chan");
  if (!tutor || !autorizador) throw new Error("perfis de teste ausentes");
  const cabecalhos = (perfil: typeof tutor) => ({
    "x-acsas-perfil": perfil.canonico,
    "x-acsas-usuario": perfil.usuarioId,
    "content-type": "application/json",
  });
  const chancelaTutor = await page.request.post("/api/projetos/2025-009/acoes", {
    headers: cabecalhos(tutor),
    data: { tipo: "transitar-area", areaId: AREA_TUTOR, acao: "chancelar" },
  });
  expect(chancelaTutor.ok()).toBeTruthy();
  const recusa = await page.request.post("/api/projetos/2025-009/acoes", {
    headers: cabecalhos(autorizador),
    data: { tipo: "transitar-area", areaId: AREA_RECUSA, acao: "chancelar" },
  });
  expect(recusa.status()).toBe(403);
  const painel = await page.request.get("/api/projetos/2025-009/painel", { headers: cabecalhos(tutor) });
  const corpo = (await painel.json()) as { areas: { id: string; fase: string }[] };
  expect(corpo.areas.find((area) => area.id === AREA_TUTOR)?.fase).toBe("concluida");
  expect(corpo.areas.find((area) => area.id === AREA_RECUSA)?.fase).toBe("aguardando_chancela");
});
