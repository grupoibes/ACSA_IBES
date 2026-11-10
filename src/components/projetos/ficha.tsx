"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { paragrafoProjetoNovo, textoJanela } from "@/domain/fichaProjeto";
import type { ProjetoRegistro } from "@/domain/demo";
import { formatarData } from "@/domain/rotulos";
import { useSessao } from "@/components/casco/casco";
import { cabecalhos } from "@/components/sessao/api";
import { usePainel } from "@/components/projetos/usePainel";
import { useSegunda } from "@/components/projetos/useSegunda";

export function Ficha({ slug }: { slug: string }) {
  const sessao = useSessao();
  const { painel } = usePainel(slug);
  const { painel: segunda, aviso, enviar } = useSegunda(slug);
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
      {painel && painel.linhas.some((linha) => linha.naoSeAplicaManual) ? (
        <div className="sec">
          <h2>Escopo</h2>
          <dl className="kv">
            <dt>Listados</dt>
            <dd data-testid="na-listados">{painel.linhas.length}</dd>
            <dt>Não se aplica no manual</dt>
            <dd data-testid="na-manual">{painel.linhas.filter((linha) => linha.naoSeAplicaManual).length}</dd>
            <dt>Não se aplica no diagnóstico</dt>
            <dd data-testid="na-diagnostico">{painel.linhas.filter((linha) => !linha.aplicavel && !linha.naoSeAplicaManual).length}</dd>
            <dt>Aplicáveis</dt>
            <dd data-testid="na-aplicaveis">{painel.aplicaveis}</dd>
          </dl>
        </div>
      ) : null}
      <div className="sec">
        <h2>Upgrade de nível</h2>
        {aviso ? <p className="note">{aviso}</p> : null}
        <ul>
          {(segunda?.upgrades ?? []).map((pedido) => (
            <li key={pedido.id}>
              {pedido.nivelPedido} · {pedido.motivo} · {pedido.situacao === "incluida" ? "Incluído na próxima avaliação" : "Recebido"}
              {segunda?.pode.incluir && pedido.situacao === "recebida" ? (
                <button type="button" className="btn sm" onClick={() => void enviar({ tipo: "incluir-upgrade", upgradeId: pedido.id })}>
                  Incluir na próxima avaliação
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {segunda?.pode.upgrade ? (
          <form
            className="form"
            onSubmit={(evento) => {
              evento.preventDefault();
              const dados = new FormData(evento.currentTarget);
              void enviar({ tipo: "upgrade", nivel: String(dados.get("nivel") ?? ""), motivo: String(dados.get("motivo") ?? "") });
            }}
          >
            <div className="frow">
              <label className="field">
                Nível
                <select name="nivel" aria-label="Nível do upgrade" defaultValue="otimo">
                  <option value="avancado">Avançado</option>
                  <option value="otimo">Ótimo</option>
                  <option value="excelente">Excelente</option>
                </select>
              </label>
              <label className="field">
                Motivo
                <input name="motivo" aria-label="Motivo do upgrade" required />
              </label>
            </div>
            <button className="btn" type="submit">
              Solicitar upgrade
            </button>
          </form>
        ) : null}
      </div>
      <p>
        <Link href={`/projetos/${slug}/biblioteca`}>Abrir a biblioteca</Link>
      </p>
    </>
  );
}
