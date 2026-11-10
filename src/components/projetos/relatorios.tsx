"use client";

import { useSegunda } from "@/components/projetos/useSegunda";

export function Relatorios({ slug }: { slug: string }) {
  const { painel, erro } = useSegunda(slug);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando o relatório…</p>;
  return (
    <>
      <div className="phead">
        <div>
          <h1>Relatório de avaliação</h1>
          <p className="sub">Template único em português. O PDF exporta este mesmo texto.</p>
        </div>
        <a className="btn" href={`/api/projetos/${encodeURIComponent(slug)}/relatorio`}>
          Baixar PDF
        </a>
      </div>
      <pre className="sec" data-testid="relatorio-texto">
        {painel.relatorio}
      </pre>
    </>
  );
}
