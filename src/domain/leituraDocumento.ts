const APELIDOS: Record<string, string> = {
  responsavel_ibes: "backoffice_ibes",
  gestor_instituicao: "responsavel_projeto",
  profissional_instituicao: "conferente",
};

const IBES = new Set([
  "admin_ibes",
  "backoffice_ibes",
  "educador",
  "tutor_relatorio",
  "membro_comite",
  "avaliador_lider",
  "avaliador_ibes",
]);

export function perfilCanonico(perfil: string): string {
  return APELIDOS[perfil] ?? perfil;
}

export function ehPerfilIbes(perfil: string): boolean {
  return IBES.has(perfilCanonico(perfil));
}

export type MembroProjeto = { usuarioId: string; projetoId: string };

/** IBES lê qualquer projeto. O cliente só lê o projeto em que é membro. */
export function podeLerDocumento(entrada: {
  perfil: string;
  usuarioId: string | null;
  projetoId: string;
  membros: readonly MembroProjeto[];
}): boolean {
  if (ehPerfilIbes(entrada.perfil)) return true;
  if (!entrada.usuarioId) return false;
  return entrada.membros.some((membro) => membro.usuarioId === entrada.usuarioId && membro.projetoId === entrada.projetoId);
}

const ENVIO = new Set(["responsavel_projeto", "responsavel_upload"]);

export function podeEnviarBiblioteca(perfil: string): boolean {
  return ENVIO.has(perfilCanonico(perfil));
}

export function projetoDoCaminho(caminho: string): string | null {
  const encontrado = /^projeto\/([0-9a-f-]{36})\/documentos\//i.exec(caminho);
  return encontrado ? encontrado[1] : null;
}
