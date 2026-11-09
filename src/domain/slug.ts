const CODIGO = /^([0-9]{4})\/([0-9]{3})(-C)?$/;

/** AAAA/NNN vira AAAA-NNN. AAAA/NNN-C vira AAAA-NNN-C. A URL não leva a barra. */
export function codigoParaSlug(codigo: string): string {
  const encontrado = CODIGO.exec(codigo);
  if (!encontrado) throw new Error("Código de projeto inválido. Use AAAA/NNN.");
  return `${encontrado[1]}-${encontrado[2]}${encontrado[3] ?? ""}`;
}

/** Só aceita o slug. O código cru, com barra, não abre ficha. */
export function slugParaCodigo(slug: string): string | null {
  const encontrado = /^([0-9]{4})-([0-9]{3})(-C)?$/.exec(slug);
  if (!encontrado) return null;
  return `${encontrado[1]}/${encontrado[2]}${encontrado[3] ?? ""}`;
}
