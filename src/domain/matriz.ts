export type ColunaMatriz = "ver" | "criar" | "editar" | "conferir" | "chancelar";

export const COLUNAS_MATRIZ: { id: ColunaMatriz; rotulo: string }[] = [
  { id: "ver", rotulo: "Ver" },
  { id: "criar", rotulo: "Criar" },
  { id: "editar", rotulo: "Editar" },
  { id: "conferir", rotulo: "Conferir" },
  { id: "chancelar", rotulo: "Aprovar/chancelar" },
];

export type LinhaMatriz = {
  perfil: string;
  rotulo: string;
  ver: boolean;
  criar: boolean;
  editar: boolean;
  conferir: boolean;
  chancelar: boolean;
};

/** Matriz publicada. A coluna do Comitê é a resolução, não a chancela da evidência. */
export const MATRIZ: LinhaMatriz[] = [
  { perfil: "admin_ibes", rotulo: "Administrador", ver: true, criar: true, editar: true, conferir: true, chancelar: true },
  { perfil: "backoffice_ibes", rotulo: "Backoffice", ver: true, criar: true, editar: true, conferir: true, chancelar: true },
  { perfil: "educador", rotulo: "Educador", ver: true, criar: false, editar: false, conferir: true, chancelar: false },
  { perfil: "tutor_relatorio", rotulo: "Tutor", ver: true, criar: false, editar: false, conferir: true, chancelar: true },
  { perfil: "membro_comite", rotulo: "Comitê", ver: true, criar: false, editar: false, conferir: false, chancelar: true },
  { perfil: "avaliador_lider", rotulo: "Avaliador líder", ver: true, criar: true, editar: false, conferir: true, chancelar: true },
  { perfil: "avaliador_ibes", rotulo: "Avaliador", ver: true, criar: true, editar: false, conferir: true, chancelar: true },
  { perfil: "responsavel_projeto", rotulo: "Responsável", ver: true, criar: true, editar: true, conferir: false, chancelar: false },
  { perfil: "responsavel_upload", rotulo: "Upload", ver: true, criar: true, editar: true, conferir: false, chancelar: false },
  { perfil: "conferente", rotulo: "Conferente", ver: true, criar: false, editar: false, conferir: true, chancelar: false },
  { perfil: "autorizador", rotulo: "Autorizador", ver: true, criar: true, editar: false, conferir: true, chancelar: false },
];
