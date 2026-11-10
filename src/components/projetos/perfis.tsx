"use client";

import { COLUNAS_MATRIZ, MATRIZ, type ColunaMatriz } from "@/domain/matriz";

function marca(valor: boolean): string {
  return valor ? "Sim" : "Não";
}

export function Perfis() {
  return (
    <>
      <div className="phead">
        <div>
          <h1>Perfis e permissões</h1>
          <p className="sub">A matriz publicada. O cadastro de usuários entra na próxima rodada.</p>
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
    </>
  );
}
