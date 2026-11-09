"use client";

import { ROTULO_FASE, acaoDaFase, podeExecutarAcaoArea, rotuloAcaoArea } from "@/domain/rodada";
import { formatarData } from "@/domain/rotulos";
import { usePainel } from "@/components/projetos/usePainel";

export function Melhorias({ slug }: { slug: string }) {
  const { sessao, painel, erro, aviso, acao } = usePainel(slug);
  if (erro) return <p className="note">{erro}</p>;
  if (!painel || !sessao) return <p className="muted">Carregando as áreas de melhoria…</p>;
  return (
    <>
      <div className="phead">
        <div>
          <h1>Planos de ação</h1>
          <p className="sub">Detectada, planejada, aguardando conferência, aguardando chancela, concluída. Um passo por vez.</p>
        </div>
      </div>
      {aviso ? <p className="note">{aviso}</p> : null}
      <p className="sub">A chancela usa a mesma função da evidência: Administrador, Backoffice, Tutor, Avaliador e Avaliador líder.</p>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Padrão</th>
              <th>Área</th>
              <th>Fase</th>
              <th>Prazo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {painel.areas.map((area) => {
              const passo = acaoDaFase(area.fase);
              const libera = passo && podeExecutarAcaoArea(sessao.ator.canonico, passo);
              return (
                <tr key={area.id}>
                  <td className="mono">{area.codigo}</td>
                  <td>{area.texto}</td>
                  <td>{ROTULO_FASE[area.fase]}</td>
                  <td>{area.inicio && area.fim ? `${formatarData(area.inicio)} – ${formatarData(area.fim)}` : "—"}</td>
                  <td>
                    {libera && passo ? (
                      <button type="button" className="btn sm" onClick={() => void acao({ tipo: "transitar-area", areaId: area.id, acao: passo })}>
                        {rotuloAcaoArea(passo)}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
