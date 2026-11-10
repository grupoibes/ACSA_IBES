"use client";

import { useSegunda } from "@/components/projetos/useSegunda";

export function Comite({ slug }: { slug: string }) {
  const { painel, erro, aviso, enviar } = useSegunda(slug);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando o comitê…</p>;
  const bloqueado = painel.bloqueioResolucao === "Sem consenso." || painel.bloqueioResolucao === "Faltam pareceres.";
  return (
    <>
      <div className="phead">
        <div>
          <h1>Comitê de Certificação</h1>
          <p className="sub">Três pareceres iguais liberam a resolução. O voto continua texto livre.</p>
        </div>
      </div>
      {aviso ? <p className="note">{aviso}</p> : null}
      <p className="note">
        Prazo de 30 dias {painel.prazoComite ? `até ${painel.prazoComite}` : "ainda sem resultado positivo"}.
        {painel.prazoComiteVencido ? " O prazo venceu." : ""} Pontuação (% de cumprimento dos padrões): {painel.resolucao?.pontuacao ?? "ainda sem resolução"}.
      </p>
      <p data-testid="consenso">{bloqueado ? painel.bloqueioResolucao : painel.avaliacao?.resultado === "positiva" ? "Consenso" : "Aguardando resultado Positiva."}</p>
      <ul>
        {painel.pareceres.map((parecer) => (
          <li key={parecer.id}>
            {parecer.voto} · {parecer.nivelProposto} · {parecer.texto}
          </li>
        ))}
      </ul>
      {painel.pode.parecer && painel.avaliacao?.resultado === "positiva" ? (
        <form
          className="sec form"
          onSubmit={(evento) => {
            evento.preventDefault();
            const dados = new FormData(evento.currentTarget);
            void enviar({
              tipo: "parecer",
              voto: String(dados.get("voto") ?? ""),
              nivel: String(dados.get("nivel") ?? ""),
              texto: String(dados.get("texto") ?? ""),
              semConflito: dados.get("semConflito") === "on",
            });
          }}
        >
          <div className="frow">
            <label className="field">
              Voto
              <select name="voto" aria-label="Voto do comitê" defaultValue="conceder">
                <option value="conceder">Conceder</option>
                <option value="nao_conceder">Não conceder</option>
                <option value="pedir_resposta">Pedir resposta</option>
              </select>
            </label>
            <label className="field">
              Nível proposto
              <select name="nivel" aria-label="Nível proposto" defaultValue="avancado">
                <option value="avancado">Avançado</option>
                <option value="otimo">Ótimo</option>
                <option value="excelente">Excelente</option>
              </select>
            </label>
            <label className="field">
              Parecer
              <input name="texto" aria-label="Texto do parecer" required defaultValue="Parecer fictício." />
            </label>
          </div>
          <label className="field">
            <input name="semConflito" type="checkbox" required /> Declaro ausência de conflito
          </label>
          <button className="btn" type="submit">
            Registrar parecer
          </button>
        </form>
      ) : null}
      {painel.resolucao ? (
        <p className="note">
          Resolução {painel.resolucao.numero}: {painel.resolucao.decisao}
          {painel.resolucao.nivelFinal ? ` · ${painel.resolucao.nivelFinal}` : ""}.
        </p>
      ) : null}
      {painel.pode.parecer && painel.avaliacao?.resultado === "positiva" && !painel.resolucao ? (
        <form
          className="sec form"
          onSubmit={(evento) => {
            evento.preventDefault();
            const dados = new FormData(evento.currentTarget);
            void enviar({
              tipo: "resolucao",
              numero: String(dados.get("numero") ?? ""),
              nivelFinal: String(dados.get("nivelFinal") ?? ""),
              justificativa: String(dados.get("justificativa") ?? ""),
            });
          }}
        >
          <div className="frow">
            <label className="field">
              Número
              <input name="numero" aria-label="Número da resolução" required defaultValue="RES-2025-009" />
            </label>
            <label className="field">
              Nível final
              <select name="nivelFinal" aria-label="Nível final" defaultValue="avancado">
                <option value="avancado">Avançado</option>
                <option value="otimo">Ótimo</option>
                <option value="excelente">Excelente</option>
              </select>
            </label>
            <label className="field">
              Justificativa
              <input name="justificativa" aria-label="Justificativa do nível" defaultValue="Nível alinhado ao cálculo fictício." />
            </label>
          </div>
          <button className="btn pri" type="submit">
            Registrar resolução
          </button>
        </form>
      ) : null}
    </>
  );
}
