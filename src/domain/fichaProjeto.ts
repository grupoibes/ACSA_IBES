import { formatarData } from "@/domain/rotulos";
import { prazoAutoavaliacao } from "@/lib/regras/prazos";

export function textoJanela(abertura: string): string {
  const fim = prazoAutoavaliacao(abertura);
  return `janela de 12 meses até ${formatarData(fim)} para concluir a autoavaliação e solicitar a auditoria`;
}

export function paragrafoProjetoNovo(origem: "zero" | "candidatura" | null, estado: string): string | null {
  if ((origem === "zero" || origem === "candidatura") && estado === "diagnostico") {
    return "Projeto novo. Próximo passo do IBES: Diagnóstico e escopo. A unidade já pode subir documentos na Biblioteca.";
  }
  return null;
}
