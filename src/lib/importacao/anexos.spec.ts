import { describe, expect, it } from "vitest";
import { casarAnexos } from "./anexos";

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const html = new Uint8Array(214);
html.set(new TextEncoder().encode("<html>Não pode acessar o arquivo</html>"));

describe("casamento dos anexos", () => {
  it("casa pelo prefixo, detecta o tipo e não renomeia o arquivo", () => {
    const relatorio = casarAnexos(
      [
        { idFichero: 10, nome: "laudo.pdf" },
        { idFichero: 11, nome: "sem-extensao" },
        { idFichero: 12, nome: "atalho.url" },
        { idFichero: 13, nome: "sumiu.pdf" },
        { idFichero: 14, nome: "erro.html" },
      ],
      [
        { nome: "10_laudo.pdf", bytes: pdf },
        { nome: "11_sem-extensao", bytes: pdf },
        { nome: "12_atalho.url.txt", bytes: new TextEncoder().encode("https://exemplo.invalid") },
        { nome: "14_erro.html", bytes: html },
        { nome: "10_laudo (1).pdf", bytes: pdf },
      ],
    );
    const porId = Object.fromEntries(relatorio.resultados.map((item) => [item.idFichero, item]));
    expect(porId[10].status).toBe("ok");
    expect(porId[10].arquivoLocal).toBe("10_laudo.pdf");
    expect(porId[10].mime).toBe("application/pdf");
    expect(porId[11].status).toBe("ok");
    expect(porId[11].mime).toBe("application/pdf");
    expect(porId[12].status).toBe("nome_alterado");
    expect(porId[12].arquivoLocal).toBe("12_atalho.url.txt");
    expect(porId[12].mime).toBe("text/plain");
    expect(porId[13].status).toBe("ausente");
    expect(porId[14].status).toBe("html_erro");
    expect(relatorio.semIndice).toEqual(["10_laudo (1).pdf"]);
    expect(relatorio.contagem).toMatchObject({ ok: 2, ausente: 1, htmlErro: 1, nomeAlterado: 1 });
  });

  it("deduplica por SHA-256 e aponta os dois para o mesmo objeto", () => {
    const relatorio = casarAnexos(
      [
        { idFichero: 20, nome: "foto.png" },
        { idFichero: 21, nome: "foto (1).png" },
      ],
      [
        { nome: "20_foto.png", bytes: pdf },
        { nome: "21_foto (1).png", bytes: pdf },
      ],
    );
    expect(relatorio.resultados[1].compartilhado).toBe(true);
    expect(relatorio.resultados[1].objeto).toBe(relatorio.resultados[0].objeto);
    expect(relatorio.resultados[1].arquivoLocal).toBe("21_foto (1).png");
    expect(relatorio.contagem.compartilhados).toBe(1);
  });
});
