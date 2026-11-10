"use client";

import { useSegunda } from "@/components/projetos/useSegunda";

export function Avaliacao({ slug }: { slug: string }) {
  const { painel, erro, aviso, enviar } = useSegunda(slug);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando a avaliação…</p>;
  const requisitos = painel.requisitos ?? [];
  return (
    <>
      <div className="phead">
        <div>
          <h1>Agendamento e relatório</h1>
          <p className="sub">
            Rodada {painel.avaliacao?.rodada ?? 1} · {painel.avaliacao?.resultado ?? "em_curso"} · nível calculado {painel.nivelCalculado}
          </p>
        </div>
      </div>
      {aviso ? <p className="note">{aviso}</p> : null}
      {painel.restricao ? (
        <p className="note" data-testid="restricao">
          O cliente consulta de {painel.restricao.inicio} até {painel.restricao.fim}, inclusive. Semanas antes {painel.semanasAntes}, depois {painel.semanasDepois}.
          {painel.restricao.ativa ? " A restrição está ativa." : " A restrição não está ativa hoje."}
        </p>
      ) : (
        <p className="note">Sem visita agendada. A restrição do cliente começa 5 semanas antes da data e termina no dia da visita.</p>
      )}
      {painel.pode.agendar ? (
        <form
          className="sec form"
          onSubmit={(evento) => {
            evento.preventDefault();
            const dados = new FormData(evento.currentTarget);
            void enviar({ tipo: "agendar", dataVisita: String(dados.get("data") ?? ""), tipoAvaliacao: "certificacao" });
          }}
        >
          <label className="field">
            Data da visita
            <input name="data" aria-label="Data da visita" type="date" required defaultValue={painel.avaliacao?.dataVisita ?? ""} />
          </label>
          <button className="btn" type="submit">
            Agendar visita
          </button>
        </form>
      ) : null}
      {requisitos.length > 0 ? (
        <div className="sec" data-testid="requisitos-avaliacao">
          <h2>Requisitos de avaliação</h2>
          <ul>
            {requisitos.map((item) => (
              <li key={`${item.padraoId}-${item.ordem}`}>
                {item.texto} Provas: {item.provas.join(", ")}.
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="sec">
        <h2>Resultado do avaliador</h2>
        <p className="sub">O resultado do avaliador prevalece. A manutenção usa mantém ou não mantém e não avalia o Grupo III.</p>
        <div className="tbl" style={{ maxHeight: 320, overflow: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Resultado</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {painel.resultados
                .filter((linha) => linha.resultado)
                .map((linha) => (
                  <tr key={linha.padraoId}>
                    <td className="mono">{linha.codigo}</td>
                    <td>{linha.resultado}</td>
                    <td>{linha.observacao}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {painel.pode.resultado ? (
          <form
            className="form"
            onSubmit={(evento) => {
              evento.preventDefault();
              const dados = new FormData(evento.currentTarget);
              void enviar({
                tipo: "resultado",
                padraoId: String(dados.get("padraoId") ?? ""),
                resultado: String(dados.get("resultado") ?? ""),
                observacao: String(dados.get("observacao") ?? ""),
              });
            }}
          >
            <div className="frow">
              <label className="field">
                Padrão
                <select name="padraoId" aria-label="Padrão avaliado" defaultValue={painel.resultados[0]?.padraoId}>
                  {painel.resultados.map((linha) => (
                    <option key={linha.padraoId} value={linha.padraoId}>
                      {linha.codigo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Resultado
                <select name="resultado" aria-label="Resultado do avaliador" defaultValue="cumpre">
                  <option value="cumpre">Cumpre</option>
                  <option value="nao_cumpre">Não cumpre</option>
                  <option value="mantem">Mantém</option>
                  <option value="nao_mantem">Não mantém</option>
                  <option value="pendente">Pendente</option>
                </select>
              </label>
              <label className="field">
                Observação
                <input name="observacao" aria-label="Observação do avaliador" />
              </label>
            </div>
            <button className="btn" type="submit">
              Registrar resultado
            </button>
          </form>
        ) : null}
      </div>
      <div className="sec">
        <h2>Pontos fortes e fracos</h2>
        <ul>
          {painel.pontos.map((ponto) => (
            <li key={ponto.id}>
              {ponto.tipo}: {ponto.texto} {ponto.consolidado ? <span className="chip c-C">consolidado</span> : <span className="chip c-neu">em aberto</span>}
            </li>
          ))}
        </ul>
        {painel.pode.resultado ? (
          <form
            className="form"
            onSubmit={(evento) => {
              evento.preventDefault();
              const dados = new FormData(evento.currentTarget);
              void enviar({ tipo: "ponto", tipoPonto: String(dados.get("tipoPonto") ?? "forte") as "forte" | "fraco", texto: String(dados.get("texto") ?? "") });
              evento.currentTarget.reset();
            }}
          >
            <div className="frow">
              <label className="field">
                Tipo
                <select name="tipoPonto" aria-label="Tipo do ponto">
                  <option value="forte">Forte</option>
                  <option value="fraco">Fraco</option>
                </select>
              </label>
              <label className="field">
                Ponto
                <input name="texto" aria-label="Texto do ponto" required />
              </label>
            </div>
            <button className="btn" type="submit">
              Registrar ponto
            </button>
          </form>
        ) : null}
        {painel.pode.consolidar ? (
          <button type="button" className="btn pri" onClick={() => void enviar({ tipo: "consolidar" })}>
            Consolidar pontos
          </button>
        ) : null}
      </div>
      {painel.pode.consolidar ? (
        <form
          className="sec form"
          onSubmit={(evento) => {
            evento.preventDefault();
            const dados = new FormData(evento.currentTarget);
            void enviar({ tipo: "rodada", resultadoRodada: String(dados.get("resultado") ?? "em_curso") as "em_curso" | "positiva" | "negativa" });
          }}
        >
          <label className="field">
            Resultado da rodada
            <select name="resultado" aria-label="Resultado da rodada" defaultValue={painel.avaliacao?.resultado ?? "em_curso"}>
              <option value="em_curso">Em curso</option>
              <option value="positiva">Positiva</option>
              <option value="negativa">Negativa</option>
            </select>
          </label>
          <button className="btn pri" type="submit">
            Definir resultado
          </button>
        </form>
      ) : null}
    </>
  );
}
