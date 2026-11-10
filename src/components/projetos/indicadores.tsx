"use client";

import { useSegunda } from "@/components/projetos/useSegunda";

export function Indicadores({ slug }: { slug: string }) {
  const { painel, erro } = useSegunda(slug);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando os indicadores…</p>;
  return (
    <>
      <div className="phead">
        <div>
          <h1>Indicadores</h1>
          <p className="sub">Lista inicial calculada dos dados do projeto. O conjunto definitivo continua em aberto.</p>
        </div>
      </div>
      <p className="note">Pendência 16: a lista fechada de indicadores ainda não foi definida. Estes números saem do projeto.</p>
      <table className="tbl">
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Indicador</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {painel.indicadores.map((item) => (
            <tr key={item.nome}>
              <td>{item.grupo}</td>
              <td>{item.nome}</td>
              <td>{item.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
