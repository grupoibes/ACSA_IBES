"use client";

import { useEffect, useState } from "react";
import type { PainelRodada } from "@/domain/rodada";
import { useSessao } from "@/components/casco/casco";
import { cabecalhos } from "@/components/sessao/api";

export function usePainel(slug: string, ciclo?: string) {
  const sessao = useSessao();
  const [painel, setPainel] = useState<PainelRodada | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  async function carregar() {
    if (!sessao) return;
    const consulta = ciclo ? `?ciclo=${encodeURIComponent(ciclo)}` : "";
    const resposta = await fetch(`/api/projetos/${encodeURIComponent(slug)}/painel${consulta}`, {
      headers: cabecalhos(sessao.ator),
    });
    const corpo = (await resposta.json()) as PainelRodada & { erro?: string };
    if (!resposta.ok) {
      setPainel(null);
      setErro(corpo.erro ?? "Não foi possível carregar.");
      return;
    }
    setErro("");
    setPainel(corpo);
  }

  useEffect(() => {
    if (!sessao) return;
    let ativo = true;
    const consulta = ciclo ? `?ciclo=${encodeURIComponent(ciclo)}` : "";
    fetch(`/api/projetos/${encodeURIComponent(slug)}/painel${consulta}`, { headers: cabecalhos(sessao.ator) })
      .then(async (resposta) => {
        const corpo = (await resposta.json()) as PainelRodada & { erro?: string };
        if (!ativo) return;
        if (!resposta.ok) {
          setPainel(null);
          setErro(corpo.erro ?? "Não foi possível carregar.");
        } else {
          setErro("");
          setPainel(corpo);
        }
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar.");
      });
    return () => {
      ativo = false;
    };
  }, [sessao?.ator.id, sessao?.versao, slug, ciclo]);

  async function acao(corpo: Record<string, unknown>) {
    if (!sessao) return;
    setAviso("");
    const resposta = await fetch(`/api/projetos/${encodeURIComponent(slug)}/acoes`, {
      method: "POST",
      headers: cabecalhos(sessao.ator, true),
      body: JSON.stringify(corpo),
    });
    const json = (await resposta.json()) as { erro?: string };
    if (!resposta.ok) {
      setAviso(json.erro ?? "Não foi possível concluir.");
      return false;
    }
    await carregar();
    return true;
  }

  return { sessao, painel, erro, aviso, setAviso, acao, carregar };
}
