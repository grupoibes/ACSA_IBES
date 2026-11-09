"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { TIPOS_UNIDADE } from "@/domain/demo";
import { filtrarIndice, type LinhaIndice } from "@/domain/indice";
import { podeCriarProjeto } from "@/domain/projetoZero";
import { formatarData } from "@/domain/rotulos";
import { codigoParaSlug } from "@/domain/slug";
import type { Candidatura } from "@/domain/candidatura";
import { ROTULO_SITUACAO } from "@/domain/candidatura";
import { useSessao } from "@/components/casco/casco";
import { cabecalhos } from "@/components/sessao/api";

type Indice = { sugerido: string; hoje: string; podeCriar: boolean; linhas: LinhaIndice[]; candidaturas: Candidatura[] };

export function Indice() {
  const sessao = useSessao();
  const router = useRouter();
  const [indice, setIndice] = useState<Indice | null>(null);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({ codigo: "", instituicao: "", unidade: TIPOS_UNIDADE[0] as string, tipo: "certificacao", grupo: "", manual: "ME 5 1_07", abertura: "" });
  const [candidaturaId, setCandidaturaId] = useState<string | null>(null);

  async function carregar() {
    if (!sessao) return;
    const resposta = await fetch("/api/projetos", { headers: cabecalhos(sessao.ator) });
    const corpo = (await resposta.json()) as Indice & { erro?: string };
    if (!resposta.ok) {
      setErro(corpo.erro ?? "Não foi possível carregar o índice.");
      return;
    }
    setIndice(corpo);
    setForm((atual) => ({ ...atual, codigo: atual.codigo || corpo.sugerido, abertura: atual.abertura || corpo.hoje }));
  }

  useEffect(() => {
    void carregar();
  }, [sessao?.ator.id, sessao?.versao]);

  if (!sessao || !indice) return <p className="muted">Carregando projetos…</p>;
  const pode = podeCriarProjeto(sessao.ator.canonico);
  const linhas = filtrarIndice(indice.linhas, busca);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    const resposta = await fetch("/api/projetos", {
      method: "POST",
      headers: cabecalhos(sessao!.ator, true),
      body: JSON.stringify({
        codigo: form.codigo,
        instituicao: form.instituicao,
        unidade: form.unidade,
        tipoUnidade: form.unidade,
        grupo: form.grupo || null,
        manualId: "",
        abertura: form.abertura,
        origem: candidaturaId ? "candidatura" : "zero",
        candidaturaId,
      }),
    });
    const corpo = (await resposta.json()) as { erro?: string; projeto?: { codigo: string } };
    if (!resposta.ok || !corpo.projeto) {
      setErro(corpo.erro ?? "Não foi possível criar o projeto.");
      return;
    }
    router.push(`/projetos/${codigoParaSlug(corpo.projeto.codigo)}`);
  }

  async function agir(id: string, acao: "validar" | "devolver", motivo = "") {
    setErro("");
    const resposta = await fetch(`/api/candidaturas/${id}`, {
      method: "POST",
      headers: cabecalhos(sessao!.ator, true),
      body: JSON.stringify({ acao, motivo }),
    });
    const corpo = (await resposta.json()) as { erro?: string };
    if (!resposta.ok) {
      setErro(corpo.erro ?? "Não foi possível atualizar a candidatura.");
      return;
    }
    await carregar();
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1>Projetos</h1>
          <p className="sub">Código, cliente e manual. O selo de origem fica na coluna Origem.</p>
        </div>
        <span className="chip c-neu">{linhas.length}</span>
      </div>
      <div className="filt">
        <label className="field" htmlFor="indice-busca">
          Buscar
          <input id="indice-busca" data-testid="indice-busca" value={busca} placeholder="Código, cliente ou manual" onChange={(evento) => setBusca(evento.target.value)} />
        </label>
      </div>
      <div className="sec">
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Manual</th>
                <th>Etapa atual</th>
                <th>Prazo da etapa</th>
                <th>Vencimento da certificação</th>
                <th>Origem</th>
                <th>Situação</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.codigo}>
                  <td className="mono">{linha.codigo}</td>
                  <td>{linha.cliente}</td>
                  <td>{linha.manual}</td>
                  <td>{linha.etapa}</td>
                  <td>{formatarData(linha.prazoEtapa)}</td>
                  <td>{linha.vencimento ? formatarData(linha.vencimento) : "—"}</td>
                  <td>{linha.selo === "—" ? <span className="muted">—</span> : <span className={`chip ${linha.selo.startsWith("Complementar") ? "c-info" : "c-neu"}`}>{linha.selo}</span>}</td>
                  <td>
                    <span className={`chip ${linha.classeSituacao === "bad" ? "c-bad" : linha.classeSituacao === "warn" ? "c-warn" : "c-C"}`}>{linha.situacao}</span>
                  </td>
                  <td>{linha.abre ? <Link href={`/projetos/${codigoParaSlug(linha.codigo)}`}>Abrir</Link> : <span className="muted">Sem dados</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {linhas.length === 0 ? <p className="muted">Nenhum projeto encontrado.</p> : null}
      </div>
      <div className="sec">
        <h2>Novo projeto</h2>
        {pode ? null : <p className="note">Somente o Administrador e o Backoffice criam projetos.</p>}
        <form className="form" onSubmit={criar}>
          <div className="frow">
            <label className="field">
              Código
              <input aria-label="Código" value={form.codigo} disabled={!pode} onChange={(evento) => setForm({ ...form, codigo: evento.target.value })} />
            </label>
            <label className="field">
              Instituição
              <input aria-label="Instituição" value={form.instituicao} disabled={!pode} onChange={(evento) => setForm({ ...form, instituicao: evento.target.value })} />
            </label>
            <label className="field">
              Tipo de unidade
              <select aria-label="Tipo de unidade" value={form.unidade} disabled={!pode} onChange={(evento) => setForm({ ...form, unidade: evento.target.value })}>
                {TIPOS_UNIDADE.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Tipo
              <select aria-label="Tipo" value={form.tipo} disabled={!pode} onChange={(evento) => setForm({ ...form, tipo: evento.target.value })}>
                <option value="certificacao">Certificação</option>
                <option value="reavaliacao">Reavaliação</option>
              </select>
            </label>
            <label className="field">
              Grupo
              <input aria-label="Grupo" value={form.grupo} disabled={!pode} onChange={(evento) => setForm({ ...form, grupo: evento.target.value })} />
            </label>
            <label className="field">
              Manual
              <select aria-label="Manual" value={form.manual} disabled={!pode} onChange={(evento) => setForm({ ...form, manual: evento.target.value })}>
                <option>ME 5 1_07</option>
                <option disabled>ME 2 1_05</option>
                <option disabled>ME 28 1_01</option>
              </select>
            </label>
            <label className="field">
              Data de abertura
              <input aria-label="Data de abertura" type="date" value={form.abertura} disabled={!pode} onChange={(evento) => setForm({ ...form, abertura: evento.target.value })} />
            </label>
          </div>
          <button className="btn pri" type="submit" disabled={!pode}>
            Criar projeto
          </button>
        </form>
        {erro ? <p className="err">{erro}</p> : null}
      </div>
      <div className="sec">
        <h2>Candidaturas</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>Código</th>
              <th>Instituição</th>
              <th>Situação</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {indice.candidaturas.map((item) => (
              <tr key={item.id}>
                <td className="mono">{item.codigo}</td>
                <td>{item.instituicao}</td>
                <td>{ROTULO_SITUACAO[item.situacao]}</td>
                <td>
                  {pode && item.situacao === "recebida" ? (
                    <span className="acoes">
                      <button type="button" className="btn sm" onClick={() => void agir(item.id, "validar")}>
                        Validar
                      </button>
                      <Devolver onDevolver={(motivo) => void agir(item.id, "devolver", motivo)} />
                    </span>
                  ) : null}
                  {pode && item.situacao === "validada" ? (
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => {
                        setCandidaturaId(item.id);
                        setForm((atual) => ({ ...atual, codigo: item.codigo, instituicao: item.instituicao }));
                      }}
                    >
                      Criar projeto
                    </button>
                  ) : null}
                  {item.situacao === "devolvida" ? <span className="muted">{item.motivoDevolucao}</span> : null}
                  {item.situacao === "convertida" && item.projetoId ? <span className="muted">Projeto aberto</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Devolver({ onDevolver }: { onDevolver: (motivo: string) => void }) {
  const [motivo, setMotivo] = useState("");
  return (
    <span className="devolver">
      <input aria-label="Motivo da devolução" value={motivo} placeholder="Motivo da devolução" onChange={(evento) => setMotivo(evento.target.value)} />
      <button type="button" className="btn sm" onClick={() => onDevolver(motivo)}>
        Devolver
      </button>
    </span>
  );
}
