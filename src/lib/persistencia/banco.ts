import type { Candidatura } from "@/domain/candidatura";
import {
  linhaDoProjeto,
  type DocumentoRegistro,
  type LinhaAuditoria,
  type OrigemCriacao,
  type ProjetoRegistro,
  type VersaoDocumento,
} from "@/domain/demo";
import type { PadraoCatalogo } from "@/domain/catalogo";
import { cicloValido, etapaFluxoValida, fluxoDoEstado, ROTULO_ETAPA, type Ciclo, type EtapaFluxo } from "@/domain/rodada";
import { prazoAutoavaliacao } from "@/lib/regras/prazos";
import type { Ator, DadosRodada, Repo } from "@/lib/persistencia/tipos";

type Linha = Record<string, unknown>;

export type Consulta = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Linha[]; rowCount?: number | null }>;
};

export type Banco = {
  transacao: <T>(fn: (query: Consulta["query"]) => Promise<T>) => Promise<T>;
};

export const SQL_CRIAR =
  "select app.criar_projeto($1, $2, $3, $4, $5, $6::uuid, $7::date, $8) as id";
export const SQL_VALIDAR = "select app.validar_candidatura($1::uuid)";
export const SQL_DEVOLVER = "select app.devolver_candidatura($1::uuid, $2)";
export const SQL_CONVERTER = "select app.converter_candidatura($1::uuid, $2::uuid)";
export const SQL_DOCUMENTO =
  "insert into documentos (id, projeto_id, nome, classificacao, created_by) values ($1::uuid, $2::uuid, $3, $4, $5::uuid)";
export const SQL_VERSAO =
  "insert into documento_versoes (documento_id, versao, arquivo_path, sha256, tamanho_bytes, mime, enviado_por) values ($1::uuid, $2, $3, $4, $5, $6, $7::uuid)";
export const SQL_RECLASSIFICAR = "update documentos set classificacao = $2 where id = $1::uuid";
export const SQL_DADOS = "select app.ler_rodada($1::uuid) as dados";
export const SQL_PADROES =
  "select p.id, p.codigo, p.titulo, p.grupo, p.obrigatorio, p.nao_se_aplica_manual, coalesce(c.codigo, '01') as criterio from padroes p join projetos pr on pr.manual_id = p.manual_id left join criterios c on c.id = p.criterio_id where pr.id = $1::uuid and p.anexo_id is null order by p.codigo";
export const SQL_DIAGNOSTICO = "select app.salvar_diagnostico($1::uuid, $2::uuid, $3::date, $4, $5)";
export const SQL_NA = "select app.definir_nao_aplicavel($1::uuid, $2::uuid, $3)";
export const SQL_RESPOSTA = "select app.salvar_resposta($1::uuid, $2::uuid, $3, $4, $5)";
export const SQL_EVIDENCIA = "select app.enviar_evidencia($1::uuid, $2::uuid, $3::uuid, $4)";
export const SQL_VINCULO = "select app.vincular_evidencia($1::uuid, $2::uuid)";
export const SQL_TRANSITAR_EVIDENCIA = "select app.transitar_evidencia($1::uuid, $2)";
export const SQL_CUMPRE = "select app.marcar_cumpre($1::uuid, $2::uuid, $3)";
export const SQL_CRIAR_AREA = "select app.criar_area($1::uuid, $2::uuid, $3::uuid, $4)";
export const SQL_AREA = "select app.transitar_area($1::uuid, $2)";
export const SQL_AVANCAR = "select app.avancar_etapa($1::uuid)";
export const SQL_COMPLEMENTAR = "select app.abrir_complementar($1::uuid) as id";
export const SQL_VISITA = "select data_visita::text as data from avaliacoes where projeto_id = $1::uuid order by rodada desc limit 1";
export const SQL_SEMANAS =
  "select chave, valor from app_config where chave in ('restricao_semanas_antes', 'restricao_semanas_depois')";
export const SQL_LER_SEGUNDA = "select app.ler_segunda($1::uuid, $2::date) as dados";
export const SQL_APLICAR_SEGUNDA = "select app.aplicar_segunda($1::uuid, $2::jsonb) as aviso";

const ETAPA: Record<string, string> = {
  rascunho: "Rascunho",
  diagnostico: "Diagnóstico",
  autoavaliacao: "Autoavaliação",
  avaliacao: "Avaliação",
  comite: "Comitê",
  certificado: "Certificação",
  recusado: "Recusado",
  abandonado: "Abandonado",
};

async function comAtor(banco: Banco, ator: Ator, sql: string, params: unknown[] = []) {
  return banco.transacao(async (query) => {
    await query("select app.definir_perfil($1)", [ator.perfil]);
    await query("select app.definir_usuario($1::uuid)", [ator.usuarioId]);
    await query("set local role app_sessao");
    return query(sql, params);
  });
}

function texto(valor: unknown): string | null {
  if (valor == null) return null;
  return String(valor);
}

function dataIso(valor: unknown): string {
  return String(valor).slice(0, 10);
}

function seloDaLinha(linha: Linha): string {
  if (linha.tipo === "complementar" && linha.origem_codigo) return `Complementar de ${linha.origem_codigo}`;
  if (linha.origem_criacao === "zero" || linha.origem_criacao === "candidatura") return "Criado do zero";
  if (linha.vencimento) return "IBES";
  return "—";
}

function registroDaLinha(linha: Linha): ProjetoRegistro {
  const abertura = dataIso(linha.abertura);
  const estado = String(linha.estado) as ProjetoRegistro["estado"];
  const fluxoBruto = texto(linha.etapa_fluxo);
  const etapaFluxo: EtapaFluxo = fluxoBruto && etapaFluxoValida(fluxoBruto) ? fluxoBruto : fluxoDoEstado(estado);
  const cicloBruto = texto(linha.ciclo);
  const ciclo: Ciclo = cicloBruto && cicloValido(cicloBruto) ? cicloBruto : "inicial";
  return {
    id: String(linha.id),
    codigo: String(linha.codigo),
    instituicao: String(linha.instituicao),
    unidade: String(linha.unidade ?? linha.instituicao),
    tipoUnidade: texto(linha.tipo_unidade),
    grupo: texto(linha.grupo),
    manualId: String(linha.manual_id),
    manual: String(linha.manual),
    abertura,
    origem: (texto(linha.origem_criacao) as OrigemCriacao) ?? null,
    estado,
    etapa: fluxoBruto && etapaFluxoValida(fluxoBruto) ? ROTULO_ETAPA[etapaFluxo] : (ETAPA[estado] ?? estado),
    etapaFluxo,
    ciclo,
    prazoEtapa: prazoAutoavaliacao(abertura),
    vencimento: linha.vencimento ? dataIso(linha.vencimento) : null,
    abre: true,
    tipo: linha.tipo === "complementar" ? "complementar" : "inicial",
    origemCodigo: texto(linha.origem_codigo),
    origemId: texto(linha.projeto_origem_id),
    selo: seloDaLinha(linha),
  };
}

function versaoDaLinha(linha: Linha): VersaoDocumento {
  const caminho = String(linha.arquivo_path);
  return {
    versao: Number(linha.versao),
    caminho,
    sha256: String(linha.sha256),
    tamanho: Number(linha.tamanho_bytes),
    mime: String(linha.mime),
    nomeArquivo: caminho.split("/").pop() || "arquivo",
  };
}

function candidaturaDaLinha(linha: Linha): Candidatura {
  return {
    id: String(linha.id),
    codigo: String(linha.codigo),
    instituicao: String(linha.instituicao),
    situacao: String(linha.situacao) as Candidatura["situacao"],
    motivoDevolucao: texto(linha.motivo_devolucao),
    avaliadaPor: texto(linha.avaliada_por),
    avaliadaEm: linha.avaliada_em ? String(linha.avaliada_em) : null,
    projetoId: texto(linha.projeto_id),
    recebidaEm: dataIso(linha.created_at),
  };
}

const SQL_PROJETOS = `select p.id, p.codigo, o.nome as instituicao, p.unidade, p.tipo_unidade, p.grupo,
  p.manual_id, m.codigo as manual, p.abertura, p.origem_criacao, p.estado, p.tipo,
  p.etapa_fluxo, p.ciclo, p.projeto_origem_id,
  origem.codigo as origem_codigo, c.validade as vencimento
  from projetos p
  join organizacoes o on o.id = p.organizacao_id
  join manuais m on m.id = p.manual_id
  left join projetos origem on origem.id = p.projeto_origem_id
  left join certificados c on c.projeto_id = p.id`;

export function criarRepoBanco(banco: Banco): Repo {
  return {
    modo: "banco",
    async codigosProjeto() {
      const resultado = await banco.transacao((query) => query("select codigo from projetos"));
      return resultado.rows.map((linha) => String(linha.codigo));
    },
    async codigosOcupados() {
      const resultado = await banco.transacao((query) =>
        query(`select codigo from projetos
          union
          select codigo from candidaturas where situacao <> 'convertida'`),
      );
      return resultado.rows.map((linha) => String(linha.codigo));
    },
    async linhas(hoje) {
      const resultado = await banco.transacao((query) => query(SQL_PROJETOS));
      return resultado.rows.map((linha) => linhaDoProjeto(registroDaLinha(linha), hoje));
    },
    async projetoPorSlug(slug) {
      const { slugParaCodigo } = await import("@/domain/slug");
      const codigo = slugParaCodigo(slug);
      if (!codigo) return null;
      const resultado = await banco.transacao((query) => query(`${SQL_PROJETOS} where p.codigo = $1`, [codigo]));
      const linha = resultado.rows[0];
      return linha ? registroDaLinha(linha) : null;
    },
    async projetoPorId(id) {
      const resultado = await banco.transacao((query) => query(`${SQL_PROJETOS} where p.id = $1::uuid`, [id]));
      const linha = resultado.rows[0];
      return linha ? registroDaLinha(linha) : null;
    },
    async inserirProjeto(registro, ator) {
      const resultado = await comAtor(banco, ator, SQL_CRIAR, [
        registro.codigo,
        registro.instituicao,
        registro.unidade,
        registro.tipoUnidade,
        registro.grupo,
        registro.manualId,
        registro.abertura,
        registro.origem ?? "zero",
      ]);
      const id = texto(resultado.rows[0]?.id);
      if (!id) throw new Error("O banco não devolveu o projeto.");
      return id;
    },
    async candidaturas() {
      const resultado = await banco.transacao((query) =>
        query(`select id, codigo, instituicao, situacao, motivo_devolucao, avaliada_por, avaliada_em, projeto_id, created_at
          from candidaturas order by created_at`),
      );
      return resultado.rows.map(candidaturaDaLinha);
    },
    async obterCandidatura(id) {
      const resultado = await banco.transacao((query) =>
        query(
          `select id, codigo, instituicao, situacao, motivo_devolucao, avaliada_por, avaliada_em, projeto_id, created_at
           from candidaturas where id = $1::uuid`,
          [id],
        ),
      );
      const linha = resultado.rows[0];
      return linha ? candidaturaDaLinha(linha) : null;
    },
    async salvarCandidatura(candidatura, ator) {
      if (candidatura.situacao === "validada") {
        await comAtor(banco, ator, SQL_VALIDAR, [candidatura.id]);
        return;
      }
      if (candidatura.situacao === "devolvida") {
        await comAtor(banco, ator, SQL_DEVOLVER, [candidatura.id, candidatura.motivoDevolucao]);
        return;
      }
      if (candidatura.situacao === "convertida") {
        await comAtor(banco, ator, SQL_CONVERTER, [candidatura.id, candidatura.projetoId]);
      }
    },
    async membros(projetoId) {
      const resultado = await banco.transacao((query) =>
        query("select usuario_id, projeto_id from projeto_membros where projeto_id = $1::uuid", [projetoId]),
      );
      return resultado.rows.map((linha) => ({ usuarioId: String(linha.usuario_id), projetoId: String(linha.projeto_id) }));
    },
    async projetosDoUsuario(usuarioId) {
      if (!usuarioId) return [];
      const resultado = await banco.transacao((query) =>
        query("select projeto_id from projeto_membros where usuario_id = $1::uuid", [usuarioId]),
      );
      return resultado.rows.map((linha) => String(linha.projeto_id));
    },
    async documentos(projetoId) {
      const resultado = await banco.transacao((query) =>
        query(
          `select d.id, d.projeto_id, d.nome, d.classificacao, v.versao, v.arquivo_path, v.sha256, v.tamanho_bytes, v.mime
           from documentos d
           left join documento_versoes v on v.documento_id = d.id
           where d.projeto_id = $1::uuid
           order by d.created_at, v.versao`,
          [projetoId],
        ),
      );
      const mapa = new Map<string, DocumentoRegistro>();
      for (const linha of resultado.rows) {
        const id = String(linha.id);
        const documento = mapa.get(id) ?? {
          id,
          projetoId: String(linha.projeto_id),
          nome: String(linha.nome),
          classificacao: String(linha.classificacao ?? "Procedimento"),
          versoes: [],
        };
        if (linha.versao != null) {
          documento.versoes.push(versaoDaLinha(linha));
        }
        mapa.set(id, documento);
      }
      return [...mapa.values()];
    },
    async hashes(projetoId) {
      const resultado = await banco.transacao((query) =>
        query(
          `select v.sha256, v.arquivo_path as caminho
           from documento_versoes v
           join documentos d on d.id = v.documento_id
           where d.projeto_id = $1::uuid`,
          [projetoId],
        ),
      );
      return resultado.rows.map((linha) => ({ sha256: String(linha.sha256), caminho: String(linha.caminho) }));
    },
    async inserirDocumento(documento, ator) {
      await comAtor(banco, ator, SQL_DOCUMENTO, [
        documento.id,
        documento.projetoId,
        documento.nome,
        documento.classificacao,
        ator.usuarioId,
      ]);
      const versao = documento.versoes[0];
      if (versao) await gravarVersao(banco, ator, documento.id, versao);
    },
    async acrescentarVersao(documentoId, versao, ator) {
      await gravarVersao(banco, ator, documentoId, versao);
    },
    async reclassificar(documentoId, classificacao, ator) {
      const resultado = await comAtor(banco, ator, SQL_RECLASSIFICAR, [documentoId, classificacao]);
      if (!resultado.rowCount) throw new Error("Documento não encontrado.");
    },
    async auditoria() {
      const resultado = await banco.transacao((query) =>
        query("select tipo, acao, objeto from auditoria order by em desc"),
      );
      return resultado.rows.map((linha) => ({
        tipo: String(linha.tipo),
        acao: String(linha.acao) as LinhaAuditoria["acao"],
        objeto: String(linha.objeto ?? ""),
      }));
    },
    async dadosRodada(projetoId) {
      const resultado = await banco.transacao(async (query) => {
        const dados = await query(SQL_DADOS, [projetoId]);
        const padroes = await query(SQL_PADROES, [projetoId]);
        return { dados: dados.rows[0]?.dados, padroes: padroes.rows };
      });
      return dadosDoJson(resultado.dados, resultado.padroes);
    },
    async salvarDiagnostico(registro, ator) {
      await comAtor(banco, ator, SQL_DIAGNOSTICO, [
        registro.projetoId,
        registro.avaliadorId,
        registro.realizadoEm,
        registro.anexoNome,
        registro.anexoCaminho,
      ]);
    },
    async definirNaoAplicavel(projetoId, padraoId, marcado, ator) {
      await comAtor(banco, ator, SQL_NA, [projetoId, padraoId, marcado]);
    },
    async salvarResposta(resposta, ator) {
      await comAtor(banco, ator, SQL_RESPOSTA, [
        resposta.projetoId,
        resposta.padraoId,
        resposta.ciclo,
        resposta.atende,
        resposta.texto,
      ]);
    },
    async enviarEvidencia(evidencia, ator) {
      await comAtor(banco, ator, SQL_EVIDENCIA, [evidencia.id, evidencia.projetoId, evidencia.padraoId, evidencia.descricao]);
    },
    async vincularEvidencia(evidenciaId, documentoId, ator) {
      await comAtor(banco, ator, SQL_VINCULO, [evidenciaId, documentoId]);
    },
    async transitarEvidencia(evidenciaId, etapa, ator) {
      await comAtor(banco, ator, SQL_TRANSITAR_EVIDENCIA, [evidenciaId, etapa]);
    },
    async marcarCumpre(projetoId, padraoId, ciclo, ator) {
      await comAtor(banco, ator, SQL_CUMPRE, [projetoId, padraoId, ciclo]);
    },
    async criarArea(area, ator) {
      await comAtor(banco, ator, SQL_CRIAR_AREA, [area.id, area.projetoId, area.padraoId, area.texto]);
    },
    async transitarArea(areaId, acao, ator) {
      await comAtor(banco, ator, SQL_AREA, [areaId, acao]);
    },
    async avancarEtapa(projetoId, ator) {
      await comAtor(banco, ator, SQL_AVANCAR, [projetoId]);
    },
    async abrirComplementar(origemId, ator) {
      const resultado = await comAtor(banco, ator, SQL_COMPLEMENTAR, [origemId]);
      const id = texto(resultado.rows[0]?.id);
      if (!id) throw new Error("O banco não devolveu o complementar.");
      return id;
    },
    async dataVisita(projetoId) {
      const resultado = await banco.transacao((query) => query(SQL_VISITA, [projetoId]));
      return texto(resultado.rows[0]?.data) || null;
    },
    async semanasRestricao() {
      const resultado = await banco.transacao((query) => query(SQL_SEMANAS));
      const mapa = new Map(resultado.rows.map((linha) => [texto(linha.chave), Number(linha.valor)]));
      return { antes: mapa.get("restricao_semanas_antes") ?? 5, depois: mapa.get("restricao_semanas_depois") ?? 0 };
    },
    async lerSegunda(projetoId, ator, hoje) {
      const resultado = await comAtor(banco, ator, SQL_LER_SEGUNDA, [projetoId, hoje]);
      const bruto = resultado.rows[0]?.dados;
      return (typeof bruto === "string" ? JSON.parse(bruto) : bruto) as import("@/lib/persistencia/segundaMemoria").PainelSegunda;
    },
    async aplicarSegunda(projetoId, comando, ator) {
      const resultado = await comAtor(banco, ator, SQL_APLICAR_SEGUNDA, [projetoId, JSON.stringify(comando)]);
      const aviso = resultado.rows[0]?.aviso;
      return aviso == null || aviso === "" ? null : String(aviso);
    },
  };
}

function dadosDoJson(bruto: unknown, padroes: Linha[]): DadosRodada {
  const json = (typeof bruto === "string" ? JSON.parse(bruto) : bruto ?? {}) as Record<string, unknown>;
  const lista = (valor: unknown) => (Array.isArray(valor) ? valor : []);
  return {
    padroes: padroes.map(padraoDaLinha),
    diagnostico: json.diagnostico ? (json.diagnostico as DadosRodada["diagnostico"]) : null,
    naoAplicaveis: lista(json.naoAplicaveis).map(String),
    respostas: lista(json.respostas) as DadosRodada["respostas"],
    evidencias: lista(json.evidencias) as DadosRodada["evidencias"],
    areas: lista(json.areas) as DadosRodada["areas"],
    emails: lista(json.emails) as DadosRodada["emails"],
    auditoria: lista(json.auditoria) as DadosRodada["auditoria"],
    origem: (json.origem as DadosRodada["origem"]) ?? null,
  };
}

function padraoDaLinha(linha: Linha): PadraoCatalogo {
  const grupo = String(linha.grupo);
  return {
    id: String(linha.id),
    codigo: String(linha.codigo),
    titulo: String(linha.titulo),
    grupo: grupo === "II" || grupo === "III" ? grupo : "I",
    criterio: String(linha.criterio ?? "01"),
    obrigatorio: Boolean(linha.obrigatorio),
    naoSeAplicaManual: Boolean(linha.nao_se_aplica_manual),
  };
}

async function gravarVersao(banco: Banco, ator: Ator, documentoId: string, versao: VersaoDocumento) {
  await comAtor(banco, ator, SQL_VERSAO, [
    documentoId,
    versao.versao,
    versao.caminho,
    versao.sha256,
    versao.tamanho,
    versao.mime,
    ator.usuarioId,
  ]);
}

export async function criarRepoBancoDeUrl(url: string): Promise<Repo> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url });
  return criarRepoBanco({
    async transacao(fn) {
      const cliente = await pool.connect();
      try {
        await cliente.query("begin");
        const resultado = await fn((sql, params) => cliente.query(sql, params));
        await cliente.query("commit");
        return resultado;
      } catch (erro) {
        await cliente.query("rollback");
        throw erro;
      } finally {
        await cliente.query("reset role");
        await cliente.query("select set_config('app.perfil', '', false)");
        await cliente.query("select set_config('app.usuario', '', false)");
        cliente.release();
      }
    },
  });
}
