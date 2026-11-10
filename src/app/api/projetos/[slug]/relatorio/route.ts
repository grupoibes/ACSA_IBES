import { hojeBrasil } from "@/domain/demo";
import { pdfDeTexto } from "@/domain/segunda";
import { podeLerDocumento } from "@/domain/leituraDocumento";
import { atorDoPedido } from "@/lib/documentos/ler";
import { responder } from "@/lib/http/responder";
import { obterRepo } from "@/lib/persistencia/obter";
import { ErroHttp } from "@/lib/persistencia/tipos";

export const runtime = "nodejs";

export async function GET(pedido: Request, contexto: { params: Promise<{ slug: string }> }) {
  const { slug } = await contexto.params;
  const repo = await obterRepo();
  const ator = atorDoPedido(pedido);
  try {
    const atual = await repo.projetoPorSlug(slug);
    if (!atual) throw new ErroHttp("Projeto não encontrado.", 404);
    const membros = await repo.membros(atual.id);
    if (!podeLerDocumento({ perfil: ator.perfil, usuarioId: ator.usuarioId, projetoId: atual.id, membros })) {
      throw new ErroHttp("Acesso negado a este projeto.", 403);
    }
    const painel = await repo.lerSegunda(atual.id, ator, hojeBrasil());
    const pdf = pdfDeTexto(painel.relatorio);
    return new Response(Buffer.from(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "inline; filename=relatorio.pdf",
      },
    });
  } catch (erro) {
    return responder(erro);
  }
}
