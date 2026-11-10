"use client";

import { useEffect, useState } from "react";
import { useSessao } from "@/components/casco/casco";
import { cabecalhos } from "@/components/sessao/api";
import type { PainelSegunda } from "@/lib/persistencia/segundaMemoria";

export function Migracao() {
  const sessao = useSessao();
  const [painel, setPainel] = useState<PainelSegunda["migracao"] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!sessao) return;
    let ativo = true;
    fetch("/api/migracao", { headers: cabecalhos(sessao.ator) })
      .then(async (resposta) => {
        const corpo = (await resposta.json()) as PainelSegunda["migracao"] & { erro?: string };
        if (!ativo) return;
        if (!resposta.ok) setErro(corpo.erro ?? "Não foi possível ler a migração.");
        else setPainel(corpo);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível ler a migração.");
      });
    return () => {
      ativo = false;
    };
  }, [sessao?.ator.id, sessao?.versao]);

  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando a migração…</p>;
  if (painel.restrita) {
    return (
      <>
        <div className="phead">
          <h1>Migração ACSA</h1>
        </div>
        <p className="note" data-testid="migracao-restrita">
          A migração fica com os perfis do IBES.
        </p>
      </>
    );
  }
  return (
    <>
      <div className="phead">
        <div>
          <h1>Migração ACSA</h1>
          <p className="sub">Contagens publicadas e a leitura do staging de um lote fictício. A exportação formal segue em aberto.</p>
        </div>
      </div>
      <p className="note" data-testid="inventario">
        {painel.inventario} projetos no inventário.
      </p>
      <div className="sec">
        <h2>Manuais</h2>
        <ul>
          {painel.manuais.map((manual) => (
            <li key={manual.codigo}>
              {manual.codigo} · {manual.nome} · {manual.padroes} padrões
            </li>
          ))}
        </ul>
      </div>
      <div className="sec">
        <h2>Etapas</h2>
        <ul>
          {painel.etapas.map((etapa) => (
            <li key={etapa.nome}>
              {etapa.nome}: {etapa.situacao}
            </li>
          ))}
        </ul>
      </div>
      <div className="sec">
        <h2>Staging por projeto</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>Código</th>
              <th>Instituição</th>
              <th>Documentos</th>
              <th>Vínculos</th>
            </tr>
          </thead>
          <tbody>
            {painel.staging.map((item) => (
              <tr key={item.codigo}>
                <td className="mono">{item.codigo}</td>
                <td>{item.instituicao}</td>
                <td>{item.documentos}</td>
                <td>{item.vinculos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
