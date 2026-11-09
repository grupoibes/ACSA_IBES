"use client";

import { useEffect, useState } from "react";
import { CLASSES_DOCUMENTO, type DocumentoRegistro, type ProjetoRegistro } from "@/domain/demo";
import { podeEnviarBiblioteca } from "@/domain/leituraDocumento";
import { formatarData } from "@/domain/rotulos";
import { useSessao } from "@/components/casco/casco";
import { cabecalhos } from "@/components/sessao/api";

type Ficha = { projeto: ProjetoRegistro; documentos: DocumentoRegistro[] };

export function Biblioteca({ slug }: { slug: string }) {
  const sessao = useSessao();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [aviso, setAviso] = useState("");
  const [preview, setPreview] = useState<{ nome: string; url: string; mime: string } | null>(null);

  async function carregar() {
    if (!sessao) return;
    const resposta = await fetch(`/api/projetos/${encodeURIComponent(slug)}`, { headers: cabecalhos(sessao.ator) });
    if (!resposta.ok) {
      setAviso("Projeto não encontrado.");
      return;
    }
    setFicha((await resposta.json()) as Ficha);
  }

  useEffect(() => {
    void carregar();
  }, [sessao?.ator.id, sessao?.versao, slug]);

  if (!sessao || !ficha) return <p className="muted">Carregando a biblioteca…</p>;
  const envia = podeEnviarBiblioteca(sessao.ator.canonico);

  async function enviar(arquivos: FileList | null, documentoId = "", versao = 1, classificacao = "Procedimento") {
    if (!arquivos?.length) return;
    const lista: string[] = [];
    for (const arquivo of Array.from(arquivos)) {
      const dados = new FormData();
      dados.set("arquivo", arquivo);
      dados.set("projetoId", ficha!.projeto.id);
      dados.set("classificacao", classificacao);
      dados.set("versao", String(versao));
      if (documentoId) dados.set("documentoId", documentoId);
      const resposta = await fetch("/api/documentos", { method: "POST", headers: cabecalhos(sessao!.ator), body: dados });
      const corpo = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) lista.push(`${arquivo.name}: ${corpo.erro ?? "não aceito"}`);
    }
    setErros(lista);
    setAviso(lista.length ? "" : documentoId ? "Nova versão registrada." : "Arquivo enviado.");
    await carregar();
  }

  async function reclassificar(documentoId: string, classificacao: string) {
    const resposta = await fetch("/api/documentos", {
      method: "PATCH",
      headers: cabecalhos(sessao!.ator, true),
      body: JSON.stringify({ documentoId, projetoId: ficha!.projeto.id, classificacao }),
    });
    const corpo = (await resposta.json()) as { erro?: string };
    setAviso(resposta.ok ? "Classificação atualizada." : corpo.erro ?? "Não foi possível reclassificar.");
    await carregar();
  }

  async function ver(documento: DocumentoRegistro) {
    const versao = documento.versoes.at(-1);
    if (!versao) return;
    const resposta = await fetch(`/api/documentos?caminho=${encodeURIComponent(versao.caminho)}`, { headers: cabecalhos(sessao!.ator) });
    if (!resposta.ok) {
      const corpo = (await resposta.json()) as { erro?: string };
      setAviso(corpo.erro ?? "Acesso negado.");
      return;
    }
    const mime = resposta.headers.get("content-type") ?? "application/octet-stream";
    const blob = await resposta.blob();
    if (!mime.startsWith("image/") && mime !== "application/pdf") {
      const url = URL.createObjectURL(blob);
      const ancora = document.createElement("a");
      ancora.href = url;
      ancora.download = versao.nomeArquivo;
      ancora.click();
      return;
    }
    setPreview({ nome: versao.nomeArquivo, url: URL.createObjectURL(blob), mime });
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1>Biblioteca de documentos</h1>
          <p className="sub">
            {ficha.projeto.codigo} · {ficha.projeto.instituicao}
          </p>
        </div>
      </div>
      {envia ? (
        <form
          className="sec form"
          onSubmit={(evento) => {
            evento.preventDefault();
            const campo = evento.currentTarget.elements.namedItem("arquivos");
            void enviar(campo instanceof HTMLInputElement ? campo.files : null);
            evento.currentTarget.reset();
          }}
        >
          <label>
            Arquivos
            <input name="arquivos" aria-label="Arquivos" type="file" multiple />
          </label>
          <button className="btn pri" type="submit">
            Enviar
          </button>
          <p className="muted">Até 25 MB. PDF, Office, imagem ou texto. ZIP e executável são recusados.</p>
        </form>
      ) : (
        <p className="note">Somente o Responsável do projeto e o Responsável pelo upload enviam arquivos.</p>
      )}
      {erros.map((item) => (
        <p key={item} className="err">
          {item}
        </p>
      ))}
      {aviso ? <p className="note">{aviso}</p> : null}
      <div className="sec">
        <table className="tbl">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Classificação</th>
              <th>Versão</th>
              <th>Arquivo</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {ficha.documentos.map((documento) => {
              const versao = documento.versoes.at(-1);
              return (
                <tr key={documento.id}>
                  <td>{documento.nome}</td>
                  <td>
                    {envia ? (
                      <select aria-label={`Classificação de ${documento.nome}`} value={documento.classificacao} onChange={(evento) => void reclassificar(documento.id, evento.target.value)}>
                        {CLASSES_DOCUMENTO.map((classe) => (
                          <option key={classe}>{classe}</option>
                        ))}
                      </select>
                    ) : (
                      documento.classificacao
                    )}
                  </td>
                  <td>{versao ? `v${versao.versao}` : "—"}</td>
                  <td>{versao ? `${versao.nomeArquivo} · ${formatarData(new Date().toISOString())}` : "—"}</td>
                  <td>
                    <button type="button" className="btn sm" onClick={() => void ver(documento)}>
                      Ver arquivo
                    </button>
                    {envia && versao ? (
                      <label className="btn sm">
                        Nova versão
                        <input
                          aria-label={`Nova versão de ${documento.nome}`}
                          type="file"
                          hidden
                          onChange={(evento) => void enviar(evento.target.files, documento.id, versao.versao + 1, documento.classificacao)}
                        />
                      </label>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ficha.documentos.length === 0 ? <p className="muted">A biblioteca está vazia.</p> : null}
      </div>
      {envia ? (
        <form
          className="sec form"
          onSubmit={(evento) => {
            evento.preventDefault();
            const campo = evento.currentTarget.elements.namedItem("evidencia");
            void enviar(campo instanceof HTMLInputElement ? campo.files : null);
            evento.currentTarget.reset();
          }}
        >
          <h2>Arquivo novo da evidência</h2>
          <label>
            Evidência
            <input name="evidencia" aria-label="Arquivo novo da evidência" type="file" />
          </label>
          <button className="btn" type="submit">
            Enviar evidência
          </button>
        </form>
      ) : null}
      {preview ? (
        <div className="prev-ov" role="dialog" aria-label={preview.nome}>
          <div className="prev-box">
            <div className="phead">
              <h2>{preview.nome}</h2>
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  URL.revokeObjectURL(preview.url);
                  setPreview(null);
                }}
              >
                Fechar
              </button>
            </div>
            {preview.mime.startsWith("image/") ? <img src={preview.url} alt={preview.nome} /> : <iframe title={preview.nome} src={preview.url} />}
          </div>
        </div>
      ) : null}
    </>
  );
}
