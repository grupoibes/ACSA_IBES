"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Resumo = {
  padroes: number;
  elementos: number;
  requisitos: number;
  provas: number;
  naManual: number;
};

type Criterio = { criterio: string; total: number };

type Divergencia = { criterio: string; informado: number; naPlanilha: number };

type Resposta = {
  resumo?: Resumo;
  criterios?: Criterio[];
  divergencias?: Divergencia[];
  confirmado?: boolean;
  erro?: string;
  aviso?: string;
};

export default function ImportarManualPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [totais, setTotais] = useState("01 2\n02 1");
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState<"resumo" | "confirmar" | null>(null);
  const [falhaRede, setFalhaRede] = useState("");

  useEffect(() => {
    document.body.classList.remove("pre");
    document.documentElement.classList.remove("pre");
  }, []);

  const divergencias = resposta?.divergencias ?? [];
  const podeConfirmar = Boolean(resposta?.resumo) && divergencias.length === 0 && !carregando && !resposta?.erro;

  async function enviar(acao: "resumo" | "confirmar") {
    if (!arquivo) {
      setResposta({ erro: "Escolha a planilha do manual." });
      return;
    }
    setCarregando(acao);
    setFalhaRede("");
    const form = new FormData();
    form.set("arquivo", arquivo);
    form.set("totais", totais);
    form.set("acao", acao);
    try {
      const pedido = await fetch("/api/importar-manual", { method: "POST", body: form });
      const corpo = (await pedido.json()) as Resposta;
      setResposta(corpo);
    } catch {
      setFalhaRede("Não foi possível falar com o servidor. Tente de novo.");
    } finally {
      setCarregando(null);
    }
  }

  return (
    <>
      <header className="top">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-img" src="/brand/ibes-emblema.png" alt="GRUPO IBES" />
          <div className="prod">
            ACSAS IBES <span>MODERN</span>
          </div>
        </div>
        <Link className="btn sm" href="/" style={{ marginLeft: "auto" }}>
          Voltar ao início
        </Link>
      </header>
      <div className="ctx">
        <div className="crumb">
          <span>IBES</span>
          <span className="sep">/</span>
          <span>Importar manual</span>
        </div>
      </div>
      <main className="main">
        <div className="wrap">
          <div className="phead">
            <div>
              <h1>Importar manual</h1>
              <p>
                A planilha entra com as abas Padrões, Elementos, Requisitos de avaliação e Provas. O resumo aparece
                antes da confirmação. O conteúdo desta tela de teste é o manual fictício ME 0 0_00.
              </p>
            </div>
            <a className="btn" href="/api/importar-manual">
              Baixar planilha fictícia
            </a>
          </div>

          <section className="sec">
            <div className="sec-h">
              <h2>Arquivo e totais por critério</h2>
            </div>
            <div className="sec-b" style={{ display: "grid", gap: 16 }}>
              <div className="field">
                <label htmlFor="arquivo">Planilha .xlsx</label>
                <input
                  id="arquivo"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  style={{ height: "auto", padding: "8px 10px" }}
                  onChange={(evento) => {
                    setArquivo(evento.target.files?.[0] ?? null);
                    setResposta(null);
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="totais">Totais informados, um critério por linha</label>
                <textarea
                  id="totais"
                  value={totais}
                  onChange={(evento) => {
                    setTotais(evento.target.value);
                    setResposta(null);
                  }}
                />
              </div>
              <p className="muted">Exemplo da planilha fictícia: critério 01 com 2 padrões e critério 02 com 1.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button type="button" className="btn pri" disabled={!arquivo || carregando !== null} onClick={() => enviar("resumo")}>
                  {carregando === "resumo" ? "Lendo a planilha…" : "Ver resumo"}
                </button>
                <button type="button" className="btn" disabled={!podeConfirmar} onClick={() => enviar("confirmar")}>
                  {carregando === "confirmar" ? "Conferindo…" : "Confirmar importação"}
                </button>
              </div>
              {!arquivo ? <p className="note">Nenhuma planilha escolhida.</p> : null}
            </div>
          </section>

          {falhaRede ? (
            <p className="note" role="alert">
              {falhaRede}
            </p>
          ) : null}

          {resposta?.erro ? (
            <p className="note" role="alert">
              {resposta.erro}
            </p>
          ) : null}

          {resposta?.resumo ? (
            <section className="sec">
              <div className="sec-h">
                <h2>{resposta.confirmado ? "Resumo conferido" : "Resumo antes de gravar"}</h2>
              </div>
              <div className="sec-b" style={{ display: "grid", gap: 12 }}>
                <p>
                  {resposta.resumo.padroes} padrões, {resposta.resumo.elementos} elementos, {resposta.resumo.requisitos}{" "}
                  requisitos, {resposta.resumo.provas} provas, {resposta.resumo.naManual} não se aplica no manual.
                </p>
                {resposta.criterios && resposta.criterios.length > 0 ? (
                  <ul>
                    {resposta.criterios.map((item) => (
                      <li key={item.criterio}>
                        Critério {item.criterio}: {item.total} na planilha
                      </li>
                    ))}
                  </ul>
                ) : null}
                {divergencias.length > 0 ? (
                  <div role="alert">
                    <p>Os totais informados não batem com a planilha. A confirmação fica bloqueada.</p>
                    <ul>
                      {divergencias.map((item) => (
                        <li key={item.criterio}>
                          Critério {item.criterio}: informado {item.informado}, na planilha {item.naPlanilha}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="muted">Os totais por critério batem. A confirmação pode seguir.</p>
                )}
                {resposta.aviso ? <p>{resposta.aviso}</p> : null}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
