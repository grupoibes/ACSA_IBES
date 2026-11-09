import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ID_2023_014_C, ID_2025_009, USUARIO_OUTRO, USUARIO_RESPONSAVEL, membrosIniciais } from "@/domain/demo";
import { podeLerDocumento, projetoDoCaminho } from "@/domain/leituraDocumento";

describe("leitura de documento", () => {
  it("nega o arquivo a quem é membro de outro projeto", () => {
    const membros = membrosIniciais();
    assert.equal(
      podeLerDocumento({ perfil: "admin_ibes", usuarioId: "admin", projetoId: ID_2025_009, membros }),
      true,
    );
    assert.equal(
      podeLerDocumento({
        perfil: "responsavel_projeto",
        usuarioId: USUARIO_RESPONSAVEL,
        projetoId: ID_2025_009,
        membros,
      }),
      true,
    );
    assert.equal(
      podeLerDocumento({
        perfil: "responsavel_projeto",
        usuarioId: USUARIO_OUTRO,
        projetoId: ID_2025_009,
        membros,
      }),
      false,
    );
    assert.equal(
      podeLerDocumento({
        perfil: "gestor_instituicao",
        usuarioId: USUARIO_OUTRO,
        projetoId: ID_2023_014_C,
        membros,
      }),
      true,
    );
  });

  it("tira o projeto do caminho do arquivo", () => {
    assert.equal(projetoDoCaminho(`projeto/${ID_2025_009}/documentos/doc/v1/laudo.pdf`), ID_2025_009);
    assert.equal(projetoDoCaminho("outro/caminho"), null);
  });
});
