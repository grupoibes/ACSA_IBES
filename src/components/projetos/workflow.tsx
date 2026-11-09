"use client";

import { ROTULO_ETAPA } from "@/domain/rodada";
import { usePainel } from "@/components/projetos/usePainel";

export function Workflow({ slug }: { slug: string }) {
  const { painel, erro, aviso, acao } = usePainel(slug);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando o workflow…</p>;
  const proxima = painel.proxima ? ROTULO_ETAPA[painel.proxima] : null;
  const bloqueiaSaida = painel.etapaFluxo === "autoavaliacao" && painel.saidaBloqueada;
  return (
    <>
      <div className="phead">
        <div>
          <h1>Workflow e prazos</h1>
          <p className="sub">
            Etapa atual <strong data-testid="etapa-atual">{ROTULO_ETAPA[painel.etapaFluxo]}</strong>
          </p>
        </div>
      </div>
      {aviso ? <p className="note">{aviso}</p> : null}
      {bloqueiaSaida ? (
        <p className="note">A saída da autoavaliação exige Cumpre e evidência chancelada em todo obrigatório aplicável.</p>
      ) : null}
      <div className="sec">
        {painel.pode.avancar && proxima ? (
          <button type="button" className="btn pri" onClick={() => void acao({ tipo: "avancar" })}>
            Avançar para {proxima}
          </button>
        ) : null}
        {painel.pode.avancar && painel.etapaFluxo === "certificacao" ? (
          <button type="button" className="btn" onClick={() => void acao({ tipo: "complementar" })}>
            Abrir projeto complementar
          </button>
        ) : null}
      </div>
      <div className="sec">
        <h2>Prazos</h2>
        <table>
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Prazo</th>
              <th>Quando vence</th>
            </tr>
          </thead>
          <tbody>
            {painel.prazos.map((linha) => (
              <tr key={linha.etapa}>
                <td>{linha.etapa}</td>
                <td>{linha.prazo}</td>
                <td>{linha.quando}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sec" data-testid="email-etapa">
        <h2>E-mail registrado</h2>
        {painel.emails.length === 0 ? <p className="muted">Nenhum aviso nesta etapa.</p> : null}
        <ul>
          {painel.emails.map((email) => (
            <li key={email.id}>
              {email.assunto}. Envio por SMTP desligado.
            </li>
          ))}
        </ul>
      </div>
      <div className="sec">
        <h2>Auditoria recente</h2>
        <ul data-testid="auditoria-etapa">
          {painel.auditoria.slice(0, 8).map((linha, indice) => (
            <li key={`${linha.tipo}-${linha.acao}-${indice}`}>
              {linha.acao} em {linha.tipo}
            </li>
          ))}
        </ul>
      </div>
      {painel.origem ? (
        <div className="sec">
          <h2>Histórico de {painel.origem.codigo}</h2>
          {painel.origem.evidencias.length === 0 ? <p className="muted">A origem não tem evidência nesta demonstração.</p> : null}
          <ul>
            {painel.origem.evidencias.map((item) => (
              <li key={item.id}>
                {item.descricao} · {item.etapa}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
