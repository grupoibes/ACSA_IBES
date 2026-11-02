import { describe, expect, it } from "vitest";
import { caminhoNoBucket, interpretarDataExtracao, lerIndiceDocumentos, LIMITE_ARQUIVO_NOVO_BYTES } from "./projetos";

const documento = {
  id_fichero: 10,
  id_proyecto: 3,
  fichero_nombre: "foto-ficticia.jpg",
  dec_tamano: 1200,
  fec_upload: "12/08/2026 09:30:00",
  usuario_nombre: "Helena Prado",
  listado_evpam: [
    {
      id_evidencia: 7,
      cod_estandar: "ES 0 01.01_00",
      descripcion_evp: "Evidência fictícia",
      descripcion_am: "Área fictícia",
    },
  ],
};

describe("índice de documentos", () => {
  it("deduplica por id_fichero e achata os vínculos", () => {
    const lote = lerIndiceDocumentos([documento, { ...documento, fichero_nombre: "repetido.jpg" }], 15);
    expect(lote.documentos).toHaveLength(1);
    expect(lote.documentos[0]).toMatchObject({
      idFicheroAcsa: 10,
      idpryAcsa: 3,
      idautAcsa: 15,
      nome: "foto-ficticia.jpg",
      enviadoEm: "2026-08-12T09:30:00-03:00",
      enviadoPor: "Helena Prado",
    });
    expect(lote.vinculos).toEqual([
      {
        idFicheroAcsa: 10,
        codEstandar: "ES 0 01.01_00",
        idEvidenciaAcsa: 7,
        descricaoEvidencia: "Evidência fictícia",
        descricaoAreaMelhoria: "Área fictícia",
      },
    ]);
  });

  it("recusa data fora do formato da extração", () => {
    expect(() => interpretarDataExtracao("2026-08-12")).toThrow(/inválida/);
  });

  it("limita o arquivo novo a 20 MB e monta o caminho do bucket", () => {
    expect(LIMITE_ARQUIVO_NOVO_BYTES).toBe(20 * 1024 * 1024);
    expect(caminhoNoBucket("22222222-2222-4222-8222-222222222222", "10")).toBe(
      "projeto/22222222-2222-4222-8222-222222222222/id_origem/10",
    );
  });
});
