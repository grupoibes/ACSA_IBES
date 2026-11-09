import { podeLerDocumento, projetoDoCaminho, type MembroProjeto } from "@/domain/leituraDocumento";

export function mimePorNome(nome: string): string {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

export function dispoeInline(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("image/");
}

export function atorDoPedido(pedido: Request): { perfil: string; usuarioId: string | null } {
  const usuario = pedido.headers.get("x-acsas-usuario");
  return { perfil: pedido.headers.get("x-acsas-perfil") ?? "", usuarioId: usuario || null };
}

export async function responderLeitura(
  pedido: Request,
  deps: {
    autorizar: (projetoId: string, perfil: string, usuarioId: string | null) => Promise<boolean>;
    ler: (caminho: string) => Promise<Uint8Array | null>;
  },
): Promise<Response> {
  const caminho = new URL(pedido.url).searchParams.get("caminho") ?? "";
  const projetoId = projetoDoCaminho(caminho);
  if (!projetoId) {
    return Response.json({ erro: "Informe o caminho do arquivo." }, { status: 400 });
  }
  const ator = atorDoPedido(pedido);
  const liberado = await deps.autorizar(projetoId, ator.perfil, ator.usuarioId);
  if (!liberado) {
    return Response.json({ erro: "Acesso negado a este arquivo." }, { status: 403 });
  }
  const bytes = await deps.ler(caminho);
  if (!bytes) return Response.json({ erro: "Arquivo não encontrado." }, { status: 404 });
  const mime = mimePorNome(caminho);
  const nome = caminho.split("/").pop() ?? "arquivo";
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": mime,
      "content-disposition": `${dispoeInline(mime) ? "inline" : "attachment"}; filename="${nome}"`,
    },
  });
}

export async function autorizarComMembros(
  projetoId: string,
  perfil: string,
  usuarioId: string | null,
  membrosDe: (id: string) => Promise<readonly MembroProjeto[]>,
): Promise<boolean> {
  return podeLerDocumento({ perfil, usuarioId, projetoId, membros: await membrosDe(projetoId) });
}
