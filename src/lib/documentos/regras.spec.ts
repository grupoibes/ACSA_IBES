import { describe, expect, it } from "vitest";
import { receberArquivo } from "./receber";
import { LIMITE_ARQUIVO_NOVO_BYTES, URL_ASSINADA_SEGUNDOS, arquivoNovoAceito, caminhoVersao } from "./regras";
import { criarStorage, storageEmMemoria } from "./storage";

describe("biblioteca", () => {
  it("limita o arquivo novo a 25 MB e recusa zip", () => {
    expect(LIMITE_ARQUIVO_NOVO_BYTES).toBe(25 * 1024 * 1024);
    expect(arquivoNovoAceito(LIMITE_ARQUIVO_NOVO_BYTES + 1, "laudo.pdf")).toMatch(/25 MB/);
    expect(arquivoNovoAceito(100, "pacote.zip")).toMatch(/não é aceito/);
    expect(arquivoNovoAceito(100, "laudo.pdf")).toBeNull();
  });

  it("monta o caminho da versão e assina por 120 segundos", async () => {
    const caminho = caminhoVersao("proj", "doc", 2, "laudo.pdf");
    expect(caminho).toBe("projeto/proj/documentos/doc/v2/laudo.pdf");
    const storage = storageEmMemoria();
    const url = await storage.signedUrl(caminho);
    expect(url).toContain("expira=120");
    expect(URL_ASSINADA_SEGUNDOS).toBe(120);
  });

  it("recusa duplicata nova e compartilha o objeto histórico", async () => {
    const storage = storageEmMemoria();
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const primeiro = await receberArquivo({
      projetoId: "proj",
      documentoId: "doc",
      versao: 1,
      nome: "laudo.pdf",
      bytes,
      mime: "application/pdf",
      historico: true,
      jaNoProjeto: [],
      storage,
    });
    const deNovo = await receberArquivo({
      projetoId: "proj",
      documentoId: "doc-2",
      versao: 1,
      nome: "copia.pdf",
      bytes,
      mime: "application/pdf",
      historico: true,
      jaNoProjeto: [primeiro],
      storage,
    });
    expect(deNovo.compartilhado).toBe(true);
    expect(deNovo.caminho).toBe(primeiro.caminho);
    await expect(
      receberArquivo({
        projetoId: "proj",
        documentoId: "doc-3",
        versao: 1,
        nome: "laudo.pdf",
        bytes,
        mime: "application/pdf",
        historico: false,
        jaNoProjeto: [primeiro],
        storage,
      }),
    ).rejects.toThrow(/já está no projeto/);
  });

  it("usa memória sem credencial e o bucket quando as variáveis existem", () => {
    expect(criarStorage({}).nome).toBe("memoria");
    expect(criarStorage({ url: "https://exemplo.supabase.co", chave: "chave" }).nome).toBe("supabase");
  });
});
