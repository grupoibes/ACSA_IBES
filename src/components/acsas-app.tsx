"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __acsasV03?: boolean;
  }
}

export function AcsasApp() {
  useEffect(() => {
    if (window.__acsasV03 || document.querySelector('script[data-acsas="v03"]')) return;
    const script = document.createElement("script");
    script.src = "/acsas-v03.js";
    script.async = false;
    script.dataset.acsas = "v03";
    document.body.appendChild(script);
  }, []);

  return (
    <>
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
              <option value="chan">Autorizador</option>
            </optgroup>
            <optgroup label="IBES">
              <option value="back">Backoffice IBES</option>
              <option value="aval">Avaliador</option>
              <option value="lider">Avaliador líder</option>
              <option value="comite">Membro do Comitê · F</option>
              <option value="comite2">Membro do Comitê · G</option>
              <option value="comite3">Membro do Comitê · H</option>
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
    </>
  );
}
