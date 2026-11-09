export type VinculoExtraido = {
  id_evidencia: number;
  cod_estandar: string;
  descripcion_evp: string;
  descripcion_am: string;
};

export type DocumentoExtraido = {
  id_fichero: number;
  id_proyecto: number;
  fichero_nombre: string;
  dec_tamano: number | string;
  fec_upload: string;
  usuario_nombre: string;
  listado_evpam?: VinculoExtraido[];
};

export type LoteStaging = {
  documentos: {
    idFicheroAcsa: number;
    idpryAcsa: number;
    idautAcsa: number;
    nome: string;
    tamanhoBytes: number;
    enviadoEm: string;
    enviadoPor: string;
  }[];
  vinculos: {
    idFicheroAcsa: number;
    codEstandar: string;
    idEvidenciaAcsa: number;
    descricaoEvidencia: string;
    descricaoAreaMelhoria: string;
  }[];
};

export { LIMITE_ARQUIVO_NOVO_BYTES } from "../documentos/regras";

/** Lote histórico: o objeto fica em id_origem até o casamento por SHA-256. Arquivo novo usa caminhoVersao. */
export function caminhoNoBucket(projetoId: string, idOrigem: string): string {
  return `projeto/${projetoId}/id_origem/${idOrigem}`;
}

/** Número puro vem em bytes. Vírgula decimal, na extração, vem em KB. */
export function tamanhoEmBytes(valor: number | string): number {
  if (typeof valor === "number") return valor;
  const texto = valor.trim();
  if (texto.includes(",")) {
    const kb = Number(texto.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(kb)) throw new Error(`Tamanho inválido: ${valor}`);
    return Math.round(kb * 1024);
  }
  const bytes = Number(texto);
  if (!Number.isFinite(bytes)) throw new Error(`Tamanho inválido: ${valor}`);
  return bytes;
}

export function interpretarDataExtracao(texto: string): string {
  const casado = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!casado) throw new Error(`Data de extração inválida: ${texto}`);
  const [, dia, mes, ano, hora, minuto, segundo] = casado;
  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}-03:00`;
}

/** Lê o JSON da extração externa. Deduplica por id_fichero. Não acessa a plataforma de origem. */
export function lerIndiceDocumentos(documentos: DocumentoExtraido[], idautAcsa: number): LoteStaging {
  const vistos = new Set<number>();
  const lote: LoteStaging = { documentos: [], vinculos: [] };
  for (const documento of documentos) {
    if (vistos.has(documento.id_fichero)) continue;
    vistos.add(documento.id_fichero);
    lote.documentos.push({
      idFicheroAcsa: documento.id_fichero,
      idpryAcsa: documento.id_proyecto,
      idautAcsa,
      nome: documento.fichero_nombre,
      tamanhoBytes: tamanhoEmBytes(documento.dec_tamano),
      enviadoEm: interpretarDataExtracao(documento.fec_upload),
      enviadoPor: documento.usuario_nombre,
    });
    for (const vinculo of documento.listado_evpam ?? []) {
      lote.vinculos.push({
        idFicheroAcsa: documento.id_fichero,
        codEstandar: vinculo.cod_estandar,
        idEvidenciaAcsa: vinculo.id_evidencia,
        descricaoEvidencia: vinculo.descripcion_evp,
        descricaoAreaMelhoria: vinculo.descripcion_am,
      });
    }
  }
  return lote;
}
