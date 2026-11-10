"use client";

import { useSegunda } from "@/components/projetos/useSegunda";

export function Log({ slug }: { slug: string }) {
  const { painel, erro } = useSegunda(slug);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando o log…</p>;
  return (
    <>
      <div className="phead">
        <div>
          <h1>Painel de log</h1>
          <p className="sub">A auditoria do projeto. Não há exclusão.</p>
        </div>
      </div>
      <table className="tbl" data-testid="log">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Ação</th>
            <th>Objeto</th>
          </tr>
        </thead>
        <tbody>
          {painel.log.map((linha, indice) => (
            <tr key={`${linha.tipo}-${indice}`}>
              <td>{linha.tipo}</td>
              <td>{linha.acao}</td>
              <td className="mono">{linha.objeto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
