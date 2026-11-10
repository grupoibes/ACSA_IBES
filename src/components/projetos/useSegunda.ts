"use client";

import { useEffect, useState } from "react";
import { useSessao } from "@/components/casco/casco";
import { cabecalhos } from "@/components/sessao/api";
import type { PainelSegunda, ComandoSegunda } from "@/lib/persistencia/segundaMemoria";

export function useSegunda(slug: string) {
  const sessao = useSessao();
  const [painel, setPainel] = useState<PainelSegunda | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  async function carregar() {
    if (!sessao) return;
    const resposta = await fetch(`/api/projetos/${encodeURIComponent(slug)}/segunda`, {
      headers: cabecalhos(sessao.ator),
    });
    const corpo = (await resposta.json()) as PainelSegunda & { erro?: string };
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
    fetch(`/api/projetos/${encodeURIComponent(slug)}/segunda`, { headers: cabecalhos(sessao.ator) })
      .then(async (resposta) => {
        const corpo = (await resposta.json()) as PainelSegunda & { erro?: string };
        if (!ativo) return;
        if (!resposta.ok) {
          setPainel(null);
          setErro(corpo.erro ?? "Não foi possível carregar.");
          return;
        }
        setErro("");
        setPainel(corpo);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar.");
      });
    return () => {
      ativo = false;
    };
  }, [sessao?.ator.id, sessao?.versao, slug]);

  async function enviar(comando: ComandoSegunda) {
    if (!sessao) return false;
    setAviso("");
    const resposta = await fetch(`/api/projetos/${encodeURIComponent(slug)}/segunda`, {
      method: "POST",
      headers: cabecalhos(sessao.ator, true),
      body: JSON.stringify(comando),
    });
    const corpo = (await resposta.json()) as { aviso?: string | null; erro?: string };
    if (!resposta.ok) {
      setAviso(corpo.erro ?? "Não foi possível gravar.");
      return false;
    }
    setAviso(corpo.aviso ?? "Gravado.");
    await carregar();
    return true;
  }

  return { sessao, painel, erro, aviso, setAviso, enviar, carregar };
}
