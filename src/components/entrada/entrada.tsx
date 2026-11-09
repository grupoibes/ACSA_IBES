"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PERFIS_TELA, type PerfilTela } from "@/domain/demo";
import { gravarAtor, lerAtor } from "@/components/sessao/api";

export function Entrada() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilTela>(PERFIS_TELA[4]);

  useEffect(() => {
    const atual = lerAtor();
    if (atual) setPerfil(atual);
  }, []);

  return (
    <div className="ent">
      <div className="ent-card">
        <img src="/brand/ibes-emblema.png" alt="GRUPO IBES" width={160} height={48} />
        <h1>ACSAS IBES MODERN</h1>
        <p className="muted">Homologação sem senha. Escolha o perfil da matriz para entrar.</p>
        <form
          className="ent-form"
          onSubmit={(evento) => {
            evento.preventDefault();
            gravarAtor(perfil);
            router.push("/projetos");
          }}
        >
          <label className="field" htmlFor="entrada-perfil">
            Perfil
            <select id="entrada-perfil" value={perfil.id} onChange={(evento) => setPerfil(PERFIS_TELA.find((item) => item.id === evento.target.value) ?? perfil)}>
              {PERFIS_TELA.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.grupo} · {item.rotulo}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn pri">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
