import { describe, expect, it } from "vitest";
import { ID_2025_009, USUARIO_OUTRO, USUARIO_RESPONSAVEL, membrosIniciais } from "@/domain/demo";
import { autorizarComMembros, responderLeitura } from "@/lib/documentos/ler";

const caminho = `projeto/${ID_2025_009}/documentos/doc/v1/laudo.pdf`;

describe("GET do arquivo", () => {
  it("nega o arquivo ao perfil de outro projeto e não lê o storage", async () => {
    let leu = false;
    const resposta = await responderLeitura(pedido(caminho, "responsavel_projeto", USUARIO_OUTRO), {
      autorizar: (projetoId, perfil, usuarioId) => autorizarComMembros(projetoId, perfil, usuarioId, async () => membrosIniciais()),
      ler: async () => {
        leu = true;
        return new Uint8Array([1]);
      },
    });
    expect(resposta.status).toBe(403);
    expect(leu).toBe(false);
  });

  it("entrega o PDF ao membro do projeto", async () => {
    const resposta = await responderLeitura(pedido(caminho, "responsavel_projeto", USUARIO_RESPONSAVEL), {
      autorizar: (projetoId, perfil, usuarioId) => autorizarComMembros(projetoId, perfil, usuarioId, async () => membrosIniciais()),
      ler: async () => new Uint8Array([37, 80, 68, 70]),
    });
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toBe("application/pdf");
    expect(resposta.headers.get("content-disposition")).toMatch(/^inline/);
  });
});

function pedido(caminhoArquivo: string, perfil: string, usuario: string): Request {
  return new Request(`http://local/api/documentos?caminho=${encodeURIComponent(caminhoArquivo)}`, {
    headers: { "x-acsas-perfil": perfil, "x-acsas-usuario": usuario },
  });
}
