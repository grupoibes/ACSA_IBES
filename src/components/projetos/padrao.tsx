"use client";

import Link from "next/link";
import { useState } from "react";
import { ELEMENTO_FICTICIO } from "@/domain/catalogo";
import { ROTULO_CICLO, ROTULO_FASE, acaoDaFase, rotuloAcaoArea, type Ciclo } from "@/domain/rodada";
import { cabecalhos } from "@/components/sessao/api";
import { usePainel } from "@/components/projetos/usePainel";
import { useSegunda } from "@/components/projetos/useSegunda";

export function ListaPadroes({ slug }: { slug: string }) {
  const { painel, erro } = usePainel(slug);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel) return <p className="muted">Carregando os padrões…</p>;
  const linhas = painel.linhas.filter((linha) => linha.visivel);
  return (
    <>
      <div className="phead">
        <div>
          <h1>Ficha de autoavaliação</h1>
          <p className="sub">Escolha o padrão. O código da ficha é o identificador, não a URL com barra.</p>
        </div>
      </div>
      <div className="tbl" style={{ maxHeight: 560, overflow: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Padrão</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.id}>
                <td className="mono">
                  <Link href={`/projetos/${slug}/padroes/${linha.id}`}>{linha.codigo}</Link>
                </td>
                <td>{linha.titulo}</td>
                <td>{linha.selo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function FichaPadrao({ slug, padraoId, cicloInicial }: { slug: string; padraoId: string; cicloInicial: Ciclo }) {
  const [ciclo, setCiclo] = useState<Ciclo>(cicloInicial);
  const { sessao, painel, erro, aviso, setAviso, acao } = usePainel(slug, ciclo);
  const { painel: segunda } = useSegunda(slug);
  const linha = painel?.linhas.find((item) => item.id === padraoId) ?? null;
  const evidencias = painel?.evidencias.filter((item) => item.padraoId === padraoId) ?? [];
  const areas = painel?.areas.filter((item) => item.padraoId === padraoId) ?? [];
  if (erro) return <p className="note">{erro}</p>;
  if (!painel || !linha || !sessao) return <p className="muted">Carregando a ficha do padrão…</p>;

  async function enviarComArquivo(form: HTMLFormElement) {
    const dados = new FormData(form);
    const descricao = String(dados.get("descricao") ?? "");
    const arquivo = dados.get("arquivo");
    let documentoId = String(dados.get("documentoId") ?? "");
    if (arquivo instanceof File && arquivo.size > 0) {
      const envio = new FormData();
      envio.set("arquivo", arquivo);
      envio.set("projetoId", "");
      const projeto = await fetch(`/api/projetos/${encodeURIComponent(slug)}`, { headers: cabecalhos(sessao!.ator) });
      const ficha = (await projeto.json()) as { projeto?: { id: string } };
      if (!ficha.projeto) {
        setAviso("Projeto não encontrado.");
        return;
      }
      envio.set("projetoId", ficha.projeto.id);
      envio.set("classificacao", "Procedimento");
      envio.set("versao", "1");
      const gravado = await fetch("/api/documentos", { method: "POST", headers: cabecalhos(sessao!.ator), body: envio });
      const corpo = (await gravado.json()) as { documentoId?: string; erro?: string };
      if (!gravado.ok || !corpo.documentoId) {
        setAviso(corpo.erro ?? "Não foi possível enviar o arquivo.");
        return;
      }
      documentoId = corpo.documentoId;
    }
    const ok = await acao({
      tipo: "evidencia",
      padraoId,
      descricao,
      documentoId: documentoId || undefined,
    });
    if (ok) form.reset();
  }

  const acaoArea = areas[0] ? acaoDaFase(areas[0].fase) : null;
  return (
    <>
      <div className="phead">
        <div>
          <p className="sub">
            <Link href={`/projetos/${slug}/padroes`}>Padrões</Link>
          </p>
          <h1>{linha.titulo}</h1>
          <p className="sub mono">{linha.codigo}</p>
        </div>
        <span className="chip c-neu">{linha.selo}</span>
      </div>
      {aviso ? <p className="note">{aviso}</p> : null}
      <p>{ELEMENTO_FICTICIO}</p>
      <p className="sub">
        Cumpre, neste ciclo, exige Sim e evidência chancelada ou área concluída. Sair da autoavaliação exige Cumpre e evidência chancelada em todo obrigatório aplicável.
      </p>
      <form
        key={ciclo}
        className="sec form"
        onSubmit={(evento) => {
          evento.preventDefault();
          const dados = new FormData(evento.currentTarget);
          void acao({
            tipo: "resposta",
            padraoId,
            ciclo,
            atende: dados.get("atende") === "sim",
            texto: String(dados.get("texto") ?? ""),
          });
        }}
      >
        <div className="frow">
          <label className="field">
            Ciclo
            <select value={ciclo} onChange={(evento) => setCiclo(evento.target.value as Ciclo)}>
              {Object.entries(ROTULO_CICLO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Atende
            <select name="atende" defaultValue={linha.atende ? "sim" : "nao"}>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </label>
          <label className="field">
            Texto
            <input name="texto" defaultValue={linha.texto} />
          </label>
        </div>
        <button className="btn" type="submit">
          Salvar resposta
        </button>
        {painel.pode.cumpre ? (
          <button className="btn pri" type="button" onClick={() => void acao({ tipo: "cumpre", padraoId, ciclo })}>
            Cumpre
          </button>
        ) : null}
        {linha.cumpre ? <span className="chip c-C">Cumpre</span> : null}
      </form>
      {(segunda?.requisitos ?? []).filter((item) => item.padraoId === padraoId).length > 0 ? (
        <div className="sec" data-testid="requisitos-avaliacao">
          <h2>Requisitos de avaliação</h2>
          <ul>
            {segunda?.requisitos
              .filter((item) => item.padraoId === padraoId)
              .map((item) => (
                <li key={item.ordem}>
                  {item.texto} Provas: {item.provas.join(", ")}.
                </li>
              ))}
          </ul>
        </div>
      ) : null}
      <div className="sec">
        <h2>Evidências</h2>
        <p className="sub">Enviada, conferida, chancelada. Não há devolução.</p>
        {evidencias.length === 0 ? <p className="muted">Nenhuma evidência. A situação do padrão é Ausente.</p> : null}
        <ul>
          {evidencias.map((item) => (
            <li key={item.id}>
              {item.descricao} · <strong>{item.etapa}</strong>
              {item.etapa === "enviada" && painel.pode.conferir ? (
                <button type="button" className="btn sm" onClick={() => void acao({ tipo: "transitar-evidencia", evidenciaId: item.id, etapa: "conferida" })}>
                  Conferir
                </button>
              ) : null}
              {item.etapa === "conferida" && painel.pode.chancelar ? (
                <button type="button" className="btn sm" onClick={() => void acao({ tipo: "transitar-evidencia", evidenciaId: item.id, etapa: "chancelada" })}>
                  Chancelar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {painel.pode.enviar ? (
          <form
            className="form"
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviarComArquivo(evento.currentTarget);
            }}
          >
            <div className="frow">
              <label className="field">
                Descrição do fato
                <input name="descricao" required />
              </label>
              <label className="field">
                Arquivo da biblioteca
                <input name="documentoId" placeholder="Identificador, se já estiver na biblioteca" />
              </label>
              <label className="field">
                Arquivo novo
                <input name="arquivo" aria-label="Arquivo da evidência na ficha" type="file" />
              </label>
            </div>
            <button className="btn" type="submit">
              Enviar evidência da ficha
            </button>
          </form>
        ) : null}
      </div>
      <div className="sec">
        <h2>Área de melhoria</h2>
        {areas.map((area) => (
          <p key={area.id}>
            {area.texto} · {ROTULO_FASE[area.fase]}
          </p>
        ))}
        {painel.pode.plano ? (
          <form
            className="form"
            onSubmit={(evento) => {
              evento.preventDefault();
              const dados = new FormData(evento.currentTarget);
              void acao({ tipo: "area", padraoId, texto: String(dados.get("texto") ?? "") });
              evento.currentTarget.reset();
            }}
          >
            <label className="field">
              Nova área
              <input name="texto" required />
            </label>
            <button className="btn" type="submit">
              Registrar área
            </button>
          </form>
        ) : null}
        {acaoArea ? <p className="sub">Próximo passo na lista de planos: {rotuloAcaoArea(acaoArea)}.</p> : null}
      </div>
    </>
  );
}
