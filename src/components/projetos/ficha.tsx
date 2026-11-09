"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { paragrafoProjetoNovo, textoJanela } from "@/domain/fichaProjeto";
import type { ProjetoRegistro } from "@/domain/demo";
import { formatarData } from "@/domain/rotulos";
import { useSessao } from "@/components/casco/casco";
import { cabecalhos } from "@/components/sessao/api";

export function Ficha({ slug }: { slug: string }) {
  const sessao = useSessao();
  const [projeto, setProjeto] = useState<ProjetoRegistro | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!sessao) return;
    let ativo = true;
    fetch(`/api/projetos/${encodeURIComponent(slug)}`, { headers: cabecalhos(sessao.ator) })
      .then(async (resposta) => {
        const corpo = (await resposta.json()) as { projeto?: ProjetoRegistro; erro?: string };
        if (!ativo) return;
        if (!resposta.ok || !corpo.projeto) setErro(corpo.erro ?? "Projeto não encontrado.");
        else setProjeto(corpo.projeto);
      })
      .catch(() => {
        if (ativo) setErro("Projeto não encontrado.");
      });
    return () => {
      ativo = false;
    };
  }, [sessao?.ator.id, sessao?.versao, slug]);

  if (erro) return <p className="note bad">{erro}</p>;
  if (!projeto) return <p className="muted">Carregando a ficha…</p>;
  const paragrafo = paragrafoProjetoNovo(projeto.origem, projeto.estado);
  return (
    <>
      <div className="phead">
        <div>
          <h1 data-testid="ficha-cliente">{projeto.instituicao}</h1>
          <p className="sub mono" data-testid="ficha-codigo">
            {projeto.codigo}
          </p>
        </div>
        <span className="chip c-info">{projeto.etapa}</span>
      </div>
      {paragrafo ? (
        <p className="note" data-testid="projeto-novo">
          {paragrafo}
        </p>
      ) : null}
      <div className="sec">
        <dl className="kv">
          <dt>Manual</dt>
          <dd>{projeto.manual}</dd>
          <dt>Unidade</dt>
          <dd>{projeto.unidade}</dd>
          <dt>Abertura</dt>
          <dd>{formatarData(projeto.abertura)}</dd>
          <dt>Janela</dt>
          <dd data-testid="janela">{textoJanela(projeto.abertura)}</dd>
          <dt>Origem</dt>
          <dd>{projeto.selo}</dd>
        </dl>
      </div>
      <p>
        <Link href={`/projetos/${slug}/biblioteca`}>Abrir a biblioteca</Link>
      </p>
    </>
  );
}
