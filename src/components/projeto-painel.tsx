"use client";

import { useMemo, useState } from "react";
import { podeDefinirEstadoTerminal, podeRegistrarComite, podeVerNaoAplicaveis, podeEditarDiagnostico, podeAbrirRodada, podeRegistrarNaoAplicavel } from "@/domain/acesso";
import { minimoSeContasseExcluidos } from "@/domain/calcularNivel";
import {
  PERFIS,
  type Nivel,
  type OrgaoComite,
  type Perfil,
  type TipoAvaliacao,
} from "@/domain/manuais";
import {
  abrirRodada,
  adicionarEvidencia,
  alterarEstado,
  atualizarDiagnostico,
  criarProjetoAmostra,
  definirCumprido,
  definirTipo,
  marcarNaoAplicavel,
  nivelDaAvaliacao,
  padroesVisiveis,
  registrarResolucao,
  retirarNaoAplicavel,
  type Avaliacao,
  type Projeto,
} from "@/domain/projeto";
import {
  ROTULO_ESTADO,
  ROTULO_GRUPO,
  ROTULO_NIVEL,
  ROTULO_ORGAO,
  ROTULO_PERFIL,
  ROTULO_TIPO,
  formatarData,
  formatarDataHora,
} from "@/domain/rotulos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const TIPOS: TipoAvaliacao[] = ["certificacao", "manutencao", "recertificacao"];
const ORGAOS: OrgaoComite[] = ["ACSA", "IBES"];
const NIVEIS: Nivel[] = ["avancado", "otimo", "excelente"];

export function ProjetoPainel() {
  const [projeto, setProjeto] = useState<Projeto>(() => criarProjetoAmostra());
  const [perfil, setPerfil] = useState<Perfil>("gestor_instituicao");
  const [avaliacaoId, setAvaliacaoId] = useState("rodada-2");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [rascunhoEvidencia, setRascunhoEvidencia] = useState<Record<string, string>>({});
  const [orgao, setOrgao] = useState<OrgaoComite>("IBES");
  const [dataComite, setDataComite] = useState("2026-10-26");
  const [resultadoComite, setResultadoComite] = useState("");
  const [pontuacao, setPontuacao] = useState("82");
  const [nivelConcedido, setNivelConcedido] = useState<Nivel | "nenhum">("nenhum");
  const [documento, setDocumento] = useState("");

  const avaliacao = projeto.avaliacoes.find((item) => item.id === avaliacaoId) ?? projeto.avaliacoes.at(-1)!;
  const resultado = useMemo(
    () => nivelDaAvaliacao(projeto, avaliacao.id),
    [projeto, avaliacao.id],
  );
  const veExclusoes = podeVerNaoAplicaveis(perfil);
  const escopo = new Set(resultado.grupos.filter((grupo) => grupo.noEscopo).map((grupo) => grupo.grupo));
  const visiveis = padroesVisiveis(projeto, perfil).filter(
    (padrao) => escopo.has(padrao.grupo) || veExclusoes,
  );
  const foraDoEscopo = veExclusoes ? visiveis.filter((padrao) => !escopo.has(padrao.grupo)) : [];
  const emAvaliacao = visiveis.filter((padrao) => escopo.has(padrao.grupo));
  const excluidos = new Set(projeto.naoAplicaveis.map((item) => item.padraoId));

  function agir(acao: () => Projeto, proximaRodada?: (projeto: Projeto) => string) {
    try {
      const proximo = acao();
      setProjeto(proximo);
      if (proximaRodada) setAvaliacaoId(proximaRodada(proximo));
      setErro(null);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível concluir.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          {projeto.instituicao}
        </p>
        <h1 className="font-heading text-4xl leading-tight text-balance md:text-5xl">{projeto.nome}</h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          Certificação pelo manual operacional {projeto.manual}. O mapeamento ME 2 1_05, com 144
          padrões, fica só como referência de estrutura e não entra no total nem no mínimo.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>{projeto.manual}</Badge>
          <Badge variant="outline">Catálogo de demonstração, 12 padrões</Badge>
          <Badge variant="secondary">{ROTULO_ESTADO[projeto.estado]}</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Quem está olhando</CardTitle>
          <CardDescription>
            O perfil da instituição não vê padrões não aplicáveis. Admin IBES e responsável IBES
            são os únicos que podem recusar ou abandonar o projeto, e a mudança fica no histórico.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[280px_1fr] md:items-end">
          <div className="grid gap-2">
            <Label htmlFor="perfil">Perfil</Label>
            <Select
              value={perfil}
              onValueChange={(valor) => {
                if (!valor) return;
                setPerfil(valor as Perfil);
                setErro(null);
              }}
            >
              <SelectTrigger id="perfil" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERFIS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROTULO_PERFIL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {veExclusoes
              ? "Perfil IBES: a lista de não aplicáveis, a origem diagnóstico e o efeito no mínimo estão visíveis. A mesma leitura passa pela policy de padroes_nao_aplicaveis."
              : "Perfil da instituição: os padrões marcados no diagnóstico ficam de fora da lista e da conta. A RLS devolve a mesma lista, sem informar quais foram excluídos."}
          </p>
        </CardContent>
      </Card>

      {erro ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Estado</CardTitle>
            <CardDescription>Recusado e abandonado exigem motivo e ficam no histórico.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="font-heading text-3xl">{ROTULO_ESTADO[projeto.estado]}</p>
            <Label htmlFor="motivo">Motivo da mudança</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Por que o projeto muda de estado"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  agir(() => {
                    const proximo = alterarEstado(projeto, perfil, "recusado", motivo, new Date().toISOString());
                    setMotivo("");
                    return proximo;
                  })
                }
              >
                Recusar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  agir(() => {
                    const proximo = alterarEstado(projeto, perfil, "abandonado", motivo, new Date().toISOString());
                    setMotivo("");
                    return proximo;
                  })
                }
              >
                Abandonar
              </Button>
            </div>
            {!podeDefinirEstadoTerminal(perfil) ? (
              <p className="text-sm text-muted-foreground">
                Este perfil não grava recusado nem abandonado. A tentativa é recusada, como o trigger do banco.
              </p>
            ) : null}
            <Separator />
            <ol className="grid gap-2 text-sm">
              {projeto.historico.map((item, indice) => (
                <li key={`${item.em}-${indice}`}>
                  <span className="font-medium">
                    {item.de ? ROTULO_ESTADO[item.de] : "Abertura"} → {ROTULO_ESTADO[item.para]}
                  </span>
                  <span className="block text-muted-foreground">
                    {ROTULO_PERFIL[item.perfil]} · {formatarDataHora(item.em)} · {item.motivo}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Diagnóstico</CardTitle>
            <CardDescription>
              Um registro por projeto: avaliador, data e o relatório anexado. Digitalizar padrão a padrão é a v2.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="avaliador">Avaliador</Label>
              <Input
                id="avaliador"
                value={projeto.diagnostico.avaliador}
                disabled={!podeEditarDiagnostico(perfil)}
                onChange={(evento) =>
                  setProjeto({
                    ...projeto,
                    diagnostico: { ...projeto.diagnostico, avaliador: evento.target.value },
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data-diagnostico">Data</Label>
              <Input
                id="data-diagnostico"
                type="date"
                value={projeto.diagnostico.data}
                disabled={!podeEditarDiagnostico(perfil)}
                onChange={(evento) =>
                  setProjeto({
                    ...projeto,
                    diagnostico: { ...projeto.diagnostico, data: evento.target.value },
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="anexo-diagnostico">Relatório</Label>
              <Input
                id="anexo-diagnostico"
                type="file"
                accept="application/pdf"
                disabled={!podeEditarDiagnostico(perfil)}
                onChange={(evento) => {
                  const nome = evento.target.files?.[0]?.name;
                  if (!nome) return;
                  agir(() =>
                    atualizarDiagnostico(projeto, { ...projeto.diagnostico, anexoNome: nome }),
                  );
                }}
              />
              <p className="text-sm">
                Anexo atual: <span className="font-medium">{projeto.diagnostico.anexoNome}</span>
                <span className="block text-muted-foreground">
                  {formatarData(projeto.diagnostico.data)} · {projeto.diagnostico.avaliador}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Nível calculado</CardTitle>
            <CardDescription>
              Rodada {avaliacao.rodada}, {ROTULO_TIPO[avaliacao.tipo]}. O não aplicável sai do total e do mínimo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="font-heading text-3xl">
              {resultado.nivel ? ROTULO_NIVEL[resultado.nivel] : "Nenhum nível"}
            </p>
            <p className="text-sm text-muted-foreground">
              {resultado.catalogoContado} padrões carregados neste catálogo de demonstração. A referência
              ignorada continua sendo {resultado.referenciaEstruturaIgnorada.manual}, com{" "}
              {resultado.referenciaEstruturaIgnorada.padroes} padrões.
            </p>
            <div className="grid gap-2">
              {resultado.grupos.map((grupo) => (
                <div key={grupo.grupo} className="rounded-lg border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{ROTULO_GRUPO[grupo.grupo]}</span>
                    {grupo.noEscopo ? (
                      <span>
                        {grupo.cumpridos}/{grupo.totalAplicavel}
                        {grupo.minimoCumpridos !== null ? ` · mínimo ${grupo.minimoCumpridos}` : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Fora da manutenção</span>
                    )}
                  </div>
                  {veExclusoes && grupo.noEscopo && grupo.excluidosNaoAplicaveis > 0 ? (
                    <p className="mt-1 text-muted-foreground">
                      {grupo.excluidosNaoAplicaveis} saíram do manual de {grupo.totalManual}. O mínimo usado é{" "}
                      {grupo.minimoCumpridos}. Se continuassem no total, o mínimo seria{" "}
                      {minimoSeContasseExcluidos(grupo)}.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Rodadas</CardTitle>
          <CardDescription>
            A reavaliação é outra rodada no mesmo projeto. A evidência da rodada anterior permanece.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="rodada">Rodada</Label>
            <Select
              value={avaliacao.id}
              onValueChange={(valor) => {
                if (valor) setAvaliacaoId(valor);
              }}
            >
              <SelectTrigger id="rodada" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projeto.avaliacoes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    Rodada {item.rodada} · {ROTULO_TIPO[item.tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo do ciclo</Label>
            <Select
              value={avaliacao.tipo}
              onValueChange={(valor) => {
                if (!valor) return;
                agir(() => definirTipo(projeto, avaliacao.id, valor as TipoAvaliacao));
              }}
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {ROTULO_TIPO[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              disabled={!podeAbrirRodada(perfil)}
              onClick={() =>
                agir(
                  () => abrirRodada(projeto, perfil),
                  (proximo) => proximo.avaliacoes.at(-1)!.id,
                )
              }
            >
              Abrir próxima rodada
            </Button>
          </div>
          {avaliacao.tipo === "manutencao" ? (
            <p className="text-sm text-muted-foreground md:col-span-3">
              Manutenção avalia só os Grupos I e II aplicáveis. O Grupo III fica fora do cálculo, e esta rodada não concede Excelente.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-3">
        <h2 className="font-heading text-3xl">Padrões desta rodada</h2>
        {emAvaliacao.map((padrao) => (
          <PadraoCard
            key={padrao.id}
            projeto={projeto}
            avaliacao={avaliacao}
            padraoId={padrao.id}
            codigo={padrao.codigo}
            titulo={padrao.titulo}
            grupo={ROTULO_GRUPO[padrao.grupo]}
            obrigatorio={padrao.obrigatorio}
            imprescindivel={padrao.imprescindivel}
            naoAplicavel={excluidos.has(padrao.id)}
            cumprido={avaliacao.conformidades[padrao.id] === true}
            podeMarcar={podeRegistrarNaoAplicavel(perfil)}
            rascunho={rascunhoEvidencia[padrao.id] ?? ""}
            onRascunho={(valor) =>
              setRascunhoEvidencia((atual) => ({ ...atual, [padrao.id]: valor }))
            }
            onCumprido={(cumprido) =>
              agir(() => definirCumprido(projeto, avaliacao.id, padrao.id, cumprido))
            }
            onEvidencia={() =>
              agir(() => {
                const proximo = adicionarEvidencia(
                  projeto,
                  avaliacao.id,
                  padrao.id,
                  rascunhoEvidencia[padrao.id] ?? "",
                  new Date().toISOString(),
                );
                setRascunhoEvidencia((atual) => ({ ...atual, [padrao.id]: "" }));
                return proximo;
              })
            }
            onMarcar={() => agir(() => marcarNaoAplicavel(projeto, perfil, padrao.id, "diagnostico"))}
            onRetirar={() => agir(() => retirarNaoAplicavel(projeto, perfil, padrao.id))}
          />
        ))}
        {foraDoEscopo.length > 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
            Fora do escopo desta manutenção: {foraDoEscopo.map((padrao) => padrao.codigo).join(", ")}.
          </div>
        ) : null}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Resolução do comitê</CardTitle>
          <CardDescription>
            Registro manual. Órgão ACSA ou IBES, data, resultado, pontuação, nível concedido e documento. Não há acesso externo à ACSA.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {projeto.resolucao ? (
            <div className="rounded-lg bg-muted px-3 py-3 text-sm">
              <p className="font-medium">
                {ROTULO_ORGAO[projeto.resolucao.orgao]} · {formatarData(projeto.resolucao.data)} ·{" "}
                {projeto.resolucao.resultado}
              </p>
              <p className="text-muted-foreground">
                Pontuação {projeto.resolucao.pontuacao.toLocaleString("pt-BR")} · nível concedido{" "}
                {projeto.resolucao.nivelConcedido
                  ? ROTULO_NIVEL[projeto.resolucao.nivelConcedido]
                  : "não informado"}{" "}
                · {projeto.resolucao.documentoNome}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma resolução lançada. O nível calculado acima não preenche este registro.
            </p>
          )}
          {podeRegistrarComite(perfil) ? (
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(evento) => {
                evento.preventDefault();
                agir(() =>
                  registrarResolucao(projeto, {
                    orgao,
                    data: dataComite,
                    resultado: resultadoComite,
                    pontuacao: Number(pontuacao.replace(",", ".")),
                    nivelConcedido: nivelConcedido === "nenhum" ? null : nivelConcedido,
                    documentoNome: documento,
                  }),
                );
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="orgao">Órgão</Label>
                <Select
                  value={orgao}
                  onValueChange={(valor) => {
                    if (valor) setOrgao(valor as OrgaoComite);
                  }}
                >
                  <SelectTrigger id="orgao" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGAOS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {ROTULO_ORGAO[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data-comite">Data</Label>
                <Input
                  id="data-comite"
                  type="date"
                  value={dataComite}
                  onChange={(evento) => setDataComite(evento.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="resultado-comite">Resultado</Label>
                <Input
                  id="resultado-comite"
                  value={resultadoComite}
                  onChange={(evento) => setResultadoComite(evento.target.value)}
                  placeholder="Texto da resolução, como foi lavrado"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pontuacao">Pontuação</Label>
                <Input
                  id="pontuacao"
                  inputMode="decimal"
                  value={pontuacao}
                  onChange={(evento) => setPontuacao(evento.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nivel-concedido">Nível concedido</Label>
                <Select
                  value={nivelConcedido}
                  onValueChange={(valor) => {
                    if (valor) setNivelConcedido(valor as Nivel | "nenhum");
                  }}
                >
                  <SelectTrigger id="nivel-concedido" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Não informado</SelectItem>
                    {NIVEIS.map((nivel) => (
                      <SelectItem key={nivel} value={nivel}>
                        {ROTULO_NIVEL[nivel]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="documento-comite">Documento</Label>
                <Input
                  id="documento-comite"
                  type="file"
                  onChange={(evento) => setDocumento(evento.target.files?.[0]?.name ?? "")}
                  required={!documento}
                />
                {documento ? <p className="text-sm text-muted-foreground">{documento}</p> : null}
              </div>
              <Button type="submit" className="md:col-span-2">
                Gravar resolução
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este perfil consulta a resolução. Quem grava é admin IBES ou responsável IBES.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Horários em Brasília. As pendências 21 a 28 seguem sem decisão do IBES.
      </p>
    </main>
  );
}

function PadraoCard({
  projeto,
  avaliacao,
  padraoId,
  codigo,
  titulo,
  grupo,
  obrigatorio,
  imprescindivel,
  naoAplicavel,
  cumprido,
  podeMarcar,
  rascunho,
  onRascunho,
  onCumprido,
  onEvidencia,
  onMarcar,
  onRetirar,
}: {
  projeto: Projeto;
  avaliacao: Avaliacao;
  padraoId: string;
  codigo: string;
  titulo: string;
  grupo: string;
  obrigatorio: boolean;
  imprescindivel: boolean;
  naoAplicavel: boolean;
  cumprido: boolean;
  podeMarcar: boolean;
  rascunho: string;
  onRascunho: (valor: string) => void;
  onCumprido: (cumprido: boolean) => void;
  onEvidencia: () => void;
  onMarcar: () => void;
  onRetirar: () => void;
}) {
  const evidencias = projeto.evidencias
    .filter((item) => item.padraoId === padraoId)
    .sort((a, b) => a.rodada - b.rodada || a.criadaEm.localeCompare(b.criadaEm));

  return (
    <article className="rounded-xl border bg-card px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            {codigo} · {grupo}
          </p>
          <h3 className="font-heading text-xl">{titulo}</h3>
          <div className="flex flex-wrap gap-2">
            {obrigatorio ? <Badge variant="secondary">Obrigatório</Badge> : null}
            {imprescindivel ? <Badge variant="secondary">Imprescindível</Badge> : null}
            {naoAplicavel ? <Badge variant="outline">Não aplicável · diagnóstico</Badge> : null}
          </div>
        </div>
        {naoAplicavel ? (
          podeMarcar ? (
            <Button type="button" variant="outline" onClick={onRetirar}>
              Voltar ao cálculo
            </Button>
          ) : null
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={cumprido ? "default" : "outline"} onClick={() => onCumprido(true)}>
              Cumprido
            </Button>
            <Button type="button" variant={!cumprido && avaliacao.conformidades[padraoId] === false ? "default" : "outline"} onClick={() => onCumprido(false)}>
              Não cumprido
            </Button>
            {podeMarcar ? (
              <Button type="button" variant="ghost" onClick={onMarcar}>
                Marcar não aplicável
              </Button>
            ) : null}
          </div>
        )}
      </div>
      {!naoAplicavel ? (
        <div className="mt-4 grid gap-2">
          {evidencias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma evidência neste padrão, em nenhuma rodada.</p>
          ) : (
            <ul className="grid gap-1 text-sm">
              {evidencias.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">Rodada {item.rodada}.</span> {item.descricao}
                  <span className="block text-muted-foreground">{formatarDataHora(item.criadaEm)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label={`Evidência de ${codigo}`}
              value={rascunho}
              onChange={(evento) => onRascunho(evento.target.value)}
              placeholder="Nova evidência. As anteriores permanecem."
            />
            <Button type="button" variant="secondary" onClick={onEvidencia}>
              Acrescentar
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
