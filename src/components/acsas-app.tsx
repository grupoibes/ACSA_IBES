"use client";

import Script from "next/script";
import { useEffect } from "react";

/** Evita o flash da moldura interna antes do script saber se há sessão de teste. */
function marcarEntrada() {
  try {
    const salvo = JSON.parse(localStorage.getItem("acsas-ibes-modern-v5") || "null");
    if (!salvo?.logado) document.documentElement.classList.add("pre");
  } catch {
    document.documentElement.classList.add("pre");
  }
}

export function AcsasApp() {
  useEffect(() => {
    marcarEntrada();
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `(${marcarEntrada.toString()})()` }} />
      <div id="entrada" />
      <header className="top">
        <div className="brand">
          <span id="logo-top" />
          <div className="prod">
            ACSAS IBES <span>MODERN</span>
            <span className="envchip">Beta v0.3 · Tester</span>
            <span className="envchip hom">Homologação</span>
          </div>
        </div>
        <nav className="mainnav" id="mainnav" aria-label="Menu principal" />
        <label className="who" htmlFor="papel">
          <span>Perfil (demonstração)</span>
          <select id="papel" defaultValue="resp">
            <optgroup label="Cliente">
              <option value="resp">Responsável do projeto</option>
              <option value="upload">Responsável pelo upload</option>
              <option value="conf">Conferente</option>
              <option value="chan">Autorizador (chancela)</option>
            </optgroup>
            <optgroup label="IBES">
              <option value="back">Backoffice IBES</option>
              <option value="aval">Avaliador</option>
              <option value="lider">Avaliador líder</option>
              <option value="comite">Membro do Comitê · F</option>
              <option value="comite2">Membro do Comitê · G</option>
              <option value="admin">Administrador IBES</option>
            </optgroup>
          </select>
        </label>
        <button type="button" className="btn sm" data-act="sair">
          Sair
        </button>
      </header>
      <div className="ctx" id="ctx" />
      <div className="body">
        <nav className="pmenu" id="pmenu" aria-label="Menu do projeto" />
        <main className="main">
          <div className="wrap" id="view" />
        </main>
      </div>
      <div id="scrim-root" />
      <div className="toasts" id="toasts" aria-live="polite" />
      <Script src="/acsas-v03.js" strategy="afterInteractive" />
    </>
  );
}
