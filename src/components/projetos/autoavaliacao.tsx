"use client";

import Link from "next/link";
import { useState } from "react";
import { CICLOS, ROTULO_CICLO, type Ciclo } from "@/domain/rodada";
import { usePainel } from "@/components/projetos/usePainel";

export function Autoavaliacao({ slug }: { slug: string }) {
  const [ciclo, setCiclo] = useState<Ciclo>("inicial");
  const { painel, erro } = usePainel(slug, ciclo);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando a autoavaliação…</p>;
  const visiveis = painel.linhas.filter((linha) => linha.visivel && linha.aplicavel);
  return (
    <>
      <div className="phead">
        <div>
          <h1>Painel da autoavaliação</h1>
          <p className="sub">Ausente entra como não cumprido. Pendente ainda não tem chancela.</p>
        </div>
        <label className="field">
          Ciclo
          <select value={ciclo} onChange={(evento) => setCiclo(evento.target.value as Ciclo)}>
            {CICLOS.map((item) => (
              <option key={item} value={item}>
                {ROTULO_CICLO[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="sec">
        <h2>Resumo dos 3 grupos</h2>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Cumpridos</th>
              <th>Ausente</th>
              <th>Pendente</th>
            </tr>
          </thead>
          <tbody>
            {painel.resumo.map((grupo) => (
              <tr key={grupo.grupo} className={grupo.vazio ? "grupo-vazio" : undefined} data-testid={`resumo-${grupo.grupo}`}>
                <td>Grupo {grupo.grupo}</td>
                <td>{grupo.rotulo}</td>
                <td>{grupo.vazio ? "—" : grupo.ausentes}</td>
                <td>{grupo.vazio ? "—" : grupo.pendentes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tbl" style={{ maxHeight: 520, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Padrão</th>
              <th>Grupo</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((linha) => (
              <tr key={linha.id}>
                <td className="mono">
                  <Link href={`/projetos/${slug}/padroes/${linha.id}?ciclo=${ciclo}`}>{linha.codigo}</Link>
                </td>
                <td>{linha.titulo}</td>
                <td>{linha.grupo}</td>
                <td>
                  <span className="chip c-neu">{linha.selo}</span>
                  {linha.cumpre ? <span className="chip c-C">Cumpre</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
