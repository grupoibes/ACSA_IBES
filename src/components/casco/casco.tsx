"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PERFIS_TELA, type PerfilTela } from "@/domain/demo";
import { slugParaCodigo } from "@/domain/slug";
import { cabecalhos, gravarAtor, lerAtor, sair } from "@/components/sessao/api";

type Contexto = { ator: PerfilTela; versao: number };

const Sessao = createContext<Contexto | null>(null);

export function useSessao(): Contexto | null {
  return useContext(Sessao);
}

const TELAS: Record<string, string> = {
  ficha: "Ficha do projeto",
  biblioteca: "Biblioteca de documentos",
  diagnostico: "Diagnóstico e escopo",
  workflow: "Workflow e prazos",
  usuarios: "Usuários",
  indicadores: "Indicadores",
  log: "Painel de log",
  auto: "Painel da autoavaliação",
  padrao: "Ficha de autoavaliação",
  atribuicao: "Atribuição por critério",
  planos: "Planos de ação",
  relatorios: "Relatórios e listas",
  avaliacao: "Agendamento e relatório",
  comite: "Comitê de Certificação",
};

export function Casco({ children }: { children: ReactNode }) {
  const router = useRouter();
  const caminho = usePathname();
  const [ator, setAtor] = useState<PerfilTela | null>(null);
  const [versao, setVersao] = useState(0);
  const [instituicao, setInstituicao] = useState("");
  const partes = caminho.split("/").filter(Boolean);
  const slug = partes[0] === "projetos" && partes[1] ? partes[1] : null;
  const codigo = codigoDoSlug(slug);
  const dentro = Boolean(codigo);
  const tela = telaDoProjeto(partes);

  useEffect(() => {
    const atual = lerAtor();
    if (!atual) {
      router.replace("/");
      return;
    }
    setAtor(atual);
  }, [router, versao]);

  useEffect(() => {
    if (!ator || !slug || !codigo) return;
    let ativo = true;
    fetch(`/api/projetos/${encodeURIComponent(slug)}`, { headers: cabecalhos(ator) })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((corpo: { projeto?: { instituicao: string } } | null) => {
        if (ativo) setInstituicao(corpo?.projeto?.instituicao ?? "");
      })
      .catch(() => {
        if (ativo) setInstituicao("");
      });
    return () => {
      ativo = false;
    };
  }, [ator, slug, codigo, versao]);

  function trocarPerfil(id: string) {
    const perfil = PERFIS_TELA.find((item) => item.id === id);
    if (!perfil) return;
    gravarAtor(perfil);
    setAtor(perfil);
    setVersao((valor) => valor + 1);
  }

  if (!ator) return <p className="wrap muted">Carregando…</p>;

  const item = (href: string, rotulo: string, atual: boolean) => (
    <Link href={href} aria-current={atual ? "page" : undefined}>
      <span>{rotulo}</span>
    </Link>
  );

  return (
    <Sessao.Provider value={{ ator, versao }}>
      <header className="top">
        <div className="brand">
          <img className="logo-img" src="/brand/ibes-emblema.png" alt="GRUPO IBES · Gerando valor para a saúde desde 2012" />
          <div className="prod">
            ACSAS IBES <span>MODERN</span>
            <span className="envchip">Beta v0.5 · Tester</span>
            <span className="envchip hom">Homologação</span>
          </div>
        </div>
        <nav className="mainnav" aria-label="Menu principal">
          <Link href="/projetos" aria-current={caminho === "/projetos" ? "page" : undefined}>
            Início
          </Link>
          <Link href="/em-breve?tela=Avaliações">Avaliações</Link>
          <Link href="/em-breve?tela=Manutenção">Manutenção</Link>
          <Link href="/migracao">Migração ACSA</Link>
          <Link href="/em-breve?tela=Testes v0.5">Testes v0.5</Link>
        </nav>
        <div className="who">
          <span id="papel-rotulo">Perfil (demonstração)</span>
          <select id="papel" aria-labelledby="papel-rotulo" value={ator.id} onChange={(evento) => trocarPerfil(evento.target.value)}>
            <optgroup label="Cliente">
              {PERFIS_TELA.filter((item) => item.grupo === "Cliente").map((item) => (
                <option key={item.id} value={item.id}>
                  {item.rotulo}
                </option>
              ))}
            </optgroup>
            <optgroup label="IBES">
              {PERFIS_TELA.filter((item) => item.grupo === "IBES").map((item) => (
                <option key={item.id} value={item.id}>
                  {item.rotulo}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <button
          type="button"
          className="btn sm"
          onClick={() => {
            sair();
            router.replace("/");
          }}
        >
          Sair
        </button>
      </header>
      <div className="ctx">
        <div className="crumb">
          {dentro ? (
            <>
              <Link href="/projetos">Projetos</Link>
              <span className="sep" aria-hidden="true">
                /
              </span>
              <span>Projeto {codigo}</span>
            </>
          ) : (
            <span>{caminho === "/projetos" ? "Índice de projetos" : "ACSAS IBES MODERN"}</span>
          )}
        </div>
        {dentro ? (
          <div className="ctx-r">
            <span className="mono">{codigo}</span>
            <span>{instituicao}</span>
          </div>
        ) : null}
      </div>
      <div className="body">
        {dentro && slug ? (
          <nav className="pmenu" aria-label="Menu do projeto">
            <h3>Projeto</h3>
            {item(`/projetos/${slug}`, "Ficha do projeto", tela === "ficha")}
            {item(`/projetos/${slug}/diagnostico`, "Diagnóstico e escopo", tela === "diagnostico")}
            {item(`/projetos/${slug}/workflow`, "Workflow e prazos", tela === "workflow")}
            {item(`/projetos/${slug}/perfis`, "Usuários", tela === "usuarios")}
            {item(`/projetos/${slug}/indicadores`, "Indicadores", tela === "indicadores")}
            {item(`/projetos/${slug}/log`, "Painel de log", tela === "log")}
            <h3>Autoavaliação</h3>
            {item(`/projetos/${slug}/autoavaliacao`, "Painel da autoavaliação", tela === "autoavaliacao")}
            {item(`/projetos/${slug}/padroes`, "Ficha de autoavaliação", tela === "padrao")}
            {item(`/projetos/${slug}/biblioteca`, "Biblioteca de documentos", tela === "biblioteca")}
            {item(`/em-breve?tela=Atribuição por critério&slug=${slug}`, "Atribuição por critério", false)}
            {item(`/projetos/${slug}/melhorias`, "Planos de ação", tela === "planos")}
            <h3>Avaliação</h3>
            {item(`/projetos/${slug}/avaliacao`, "Agendamento e relatório", tela === "avaliacao")}
            {item(`/projetos/${slug}/relatorios`, "Relatório", tela === "relatorios")}
            {item(`/projetos/${slug}/comite`, "Comitê de Certificação", tela === "comite")}
          </nav>
        ) : null}
        <main className="main">
          <div className="wrap">{children}</div>
        </main>
      </div>
    </Sessao.Provider>
  );
}

function telaDoProjeto(partes: string[]): string {
  if (partes[0] !== "projetos" || !partes[1]) return "";
  if (partes[2] === "padroes") return "padrao";
  if (partes[2] === "melhorias") return "planos";
  if (partes[2] === "perfis") return "usuarios";
  return partes[2] ?? "ficha";
}

function codigoDoSlug(slug: string | null): string | null {
  if (!slug) return null;
  try {
    return slugParaCodigo(slug);
  } catch {
    return null;
  }
}

export function nomeTela(valor: string | null): string {
  if (!valor) return "Esta tela";
  return TELAS[valor] ?? valor;
}
