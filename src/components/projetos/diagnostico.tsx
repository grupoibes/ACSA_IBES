"use client";

import { useState } from "react";
import { PERFIS_TELA } from "@/domain/demo";
import { formatarData } from "@/domain/rotulos";
import { cabecalhos } from "@/components/sessao/api";
import { usePainel } from "@/components/projetos/usePainel";

const AVALIADORES = PERFIS_TELA.filter((item) => item.id === "aval" || item.id === "lider");

export function Diagnostico({ slug }: { slug: string }) {
  const { sessao, painel, erro, aviso, setAviso, acao, carregar } = usePainel(slug);
  const [preview, setPreview] = useState<{ nome: string; url: string } | null>(null);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel || !sessao) return <p className="muted">Carregando o diagnóstico…</p>;
  if (!painel.pode.diagnostico) {
    return (
      <>
        <div className="phead">
          <h1>Diagnóstico e escopo</h1>
        </div>
        <p className="note">O diagnóstico fica com o Backoffice e o Administrador. A instituição não vê a lista de não se aplica.</p>
      </>
    );
  }

  async function salvar(form: FormData) {
    setAviso("");
    const resposta = await fetch(`/api/projetos/${encodeURIComponent(slug)}/diagnostico`, {
      method: "POST",
      headers: cabecalhos(sessao!.ator),
      body: form,
    });
    const corpo = (await resposta.json()) as { erro?: string };
    setAviso(resposta.ok ? "Diagnóstico gravado." : corpo.erro ?? "Não foi possível gravar.");
    if (resposta.ok) await carregar();
  }

  async function verArquivo() {
    if (!painel?.diagnostico) return;
    const resposta = await fetch(`/api/documentos?caminho=${encodeURIComponent(painel.diagnostico.anexoCaminho)}`, {
      headers: cabecalhos(sessao!.ator),
    });
    if (!resposta.ok) {
      setAviso("Não foi possível abrir o relatório.");
      return;
    }
    const blob = await resposta.blob();
    setPreview({ nome: painel.diagnostico.anexoNome, url: URL.createObjectURL(blob) });
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1>Diagnóstico e escopo</h1>
          <p className="sub">
            Aplicáveis <strong data-testid="aplicaveis">{painel.aplicaveis}</strong>
          </p>
        </div>
      </div>
      {aviso ? <p className="note">{aviso}</p> : null}
      <form
        className="sec form"
        onSubmit={(evento) => {
          evento.preventDefault();
          void salvar(new FormData(evento.currentTarget));
        }}
      >
        <div className="frow">
          <label className="field">
            Avaliador
            <select name="avaliadorId" aria-label="Avaliador do diagnóstico" defaultValue={painel.diagnostico?.avaliadorId ?? AVALIADORES[0]?.usuarioId} required>
              {AVALIADORES.map((item) => (
                <option key={item.id} value={item.usuarioId}>
                  {item.id === "aval" ? "Helena Prado" : "Avaliadora A"}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Data
            <input name="realizadoEm" aria-label="Data do diagnóstico" type="date" required defaultValue={painel.diagnostico?.realizadoEm ?? "2026-11-06"} />
          </label>
          <label className="field">
            Relatório
            <input name="arquivo" aria-label="Relatório do diagnóstico" type="file" accept="application/pdf,.pdf" required={!painel.diagnostico} />
          </label>
        </div>
        <button className="btn pri" type="submit">
          Salvar diagnóstico
        </button>
        {painel.diagnostico ? (
          <p className="sub">
            {painel.diagnostico.anexoNome} · {formatarData(painel.diagnostico.realizadoEm)}{" "}
            <button type="button" className="btn sm" onClick={() => void verArquivo()}>
              Ver arquivo
            </button>
          </p>
        ) : (
          <p className="sub">Grave o diagnóstico para marcar não se aplica.</p>
        )}
      </form>
      <div className="tbl" style={{ maxHeight: 480, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Padrão</th>
              <th>Grupo</th>
              <th>Não se aplica</th>
            </tr>
          </thead>
          <tbody>
            {painel.linhas.map((linha) => (
              <tr key={linha.id}>
                <td className="mono">{linha.codigo}</td>
                <td>{linha.titulo}</td>
                <td>{linha.grupo}</td>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Não se aplica ${linha.codigo}`}
                    checked={!linha.aplicavel}
                    disabled={linha.naoSeAplicaManual || !painel.diagnostico}
                    onChange={(evento) => void acao({ tipo: "nao-aplicavel", padraoId: linha.id, marcado: evento.target.checked })}
                  />
                  {linha.naoSeAplicaManual ? " manual" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {preview ? (
        <div className="prev-ov" role="dialog" aria-label={preview.nome}>
          <div className="prev-box">
            <div className="phead">
              <h2>{preview.nome}</h2>
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  URL.revokeObjectURL(preview.url);
                  setPreview(null);
                }}
              >
                Fechar
              </button>
            </div>
            <iframe title={preview.nome} src={preview.url} />
          </div>
        </div>
      ) : null}
    </>
  );
}
