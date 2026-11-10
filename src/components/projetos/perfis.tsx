"use client";

import { COLUNAS_MATRIZ, MATRIZ, type ColunaMatriz } from "@/domain/matriz";
import { useSegunda } from "@/components/projetos/useSegunda";

function marca(valor: boolean): string {
  return valor ? "Sim" : "Não";
}

export function Perfis({ slug }: { slug: string }) {
  const { painel, aviso, enviar } = useSegunda(slug);
  return (
    <>
      <div className="phead">
        <div>
          <h1>Perfis e permissões</h1>
          <p className="sub">A matriz publicada e o cadastro da organização. O limite de {painel?.limiteUsuarios ?? 40} é configuração e não bloqueia.</p>
        </div>
      </div>
      <p className="note">
        Aprovar/chancelar do Comitê é a resolução. A chancela da evidência e da área de melhoria é a mesma função: Administrador, Backoffice, Tutor, Avaliador e Avaliador líder. O Autorizador confere e não chancela.
      </p>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Perfil</th>
              {COLUNAS_MATRIZ.map((coluna) => (
                <th key={coluna.id}>{coluna.rotulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIZ.map((linha) => (
              <tr key={linha.perfil}>
                <td>{linha.rotulo}</td>
                {COLUNAS_MATRIZ.map((coluna) => (
                  <td key={coluna.id} data-testid={`matriz-${linha.perfil}-${coluna.id}`}>
                    {marca(linha[coluna.id as ColunaMatriz])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sec">
        <h2>Usuários da organização</h2>
        <p className="note" data-testid="limite-usuarios">
          {painel?.ativos ?? 0} ativos de {painel?.limiteUsuarios ?? 40}. Ao passar do configurado, o Backoffice vê o aviso e o cadastro segue aberto.
        </p>
        {aviso ? <p className="note">{aviso}</p> : null}
        {painel?.avisoLimite ? <p className="note">{painel.avisoLimite}</p> : null}
        <ul>
          {(painel?.usuarios ?? []).map((usuario) => (
            <li key={usuario.id}>
              {usuario.nome} · {usuario.email} · {usuario.perfil}
            </li>
          ))}
        </ul>
        {painel?.pode.cadastrar ? (
          <form
            className="form"
            onSubmit={(evento) => {
              evento.preventDefault();
              const dados = new FormData(evento.currentTarget);
              void enviar({
                tipo: "usuario",
                nome: String(dados.get("nome") ?? ""),
                email: String(dados.get("email") ?? ""),
                perfil: String(dados.get("perfil") ?? ""),
              });
              evento.currentTarget.reset();
            }}
          >
            <div className="frow">
              <label className="field">
                Nome
                <input name="nome" aria-label="Nome do usuário" required />
              </label>
              <label className="field">
                E-mail
                <input name="email" aria-label="E-mail do usuário" type="email" required />
              </label>
              <label className="field">
                Perfil
                <select name="perfil" aria-label="Perfil do usuário" defaultValue="conferente">
                  <option value="responsavel_projeto">Responsável do projeto</option>
                  <option value="responsavel_upload">Responsável pelo upload</option>
                  <option value="conferente">Conferente</option>
                  <option value="autorizador">Autorizador</option>
                </select>
              </label>
            </div>
            <button className="btn" type="submit">
              Cadastrar usuário
            </button>
          </form>
        ) : null}
      </div>
    </>
  );
}
