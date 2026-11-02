-- Beta v0.5 (02/11/2026). Migração nova: não altera os arquivos de 26/10 e 27/10.
-- O motor SQL app.calcular_nivel continua recusando ME 2 1_05. A contagem
-- do universo (núcleo + anexos − N/A do manual − N/A do diagnóstico) vive
-- em src/lib/regras/universo.ts até uma decisão posterior sobre o denominador.

create table ambitos (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references manuais (id),
  codigo text not null check (codigo in ('I', 'II', 'III', 'IV', 'V')),
  nome text not null,
  ordem integer not null,
  unique (manual_id, codigo)
);

comment on table ambitos is
  'Âmbito I a V do manual. Fica acima do critério.';

create table criterios (
  id uuid primary key default gen_random_uuid(),
  ambito_id uuid not null references ambitos (id),
  codigo text not null check (codigo in ('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11')),
  nome text not null,
  ordem integer not null,
  unique (ambito_id, codigo)
);

comment on table criterios is
  'Critério 01 a 11. Substitui a ideia de blocos: o critério pende do âmbito.';

create table anexos_manual (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references manuais (id),
  nome text not null,
  ordem integer not null,
  unique (manual_id, nome)
);

comment on table anexos_manual is
  'Anexo opcional do manual. O núcleo do projeto não aponta para esta tabela.';

alter table padroes
  add column criterio_id uuid references criterios (id),
  add column anexo_id uuid references anexos_manual (id),
  add column nao_se_aplica_manual boolean not null default false,
  add column id_origem_acsa text;

comment on column padroes.criterio_id is
  'Nulo na amostra de 26/10. O importador do manual preenche.';

comment on column padroes.anexo_id is
  'Nulo significa núcleo. O projeto soma o anexo só quando ele está em projetos_anexos.';

comment on column padroes.nao_se_aplica_manual is
  'Vale para todo projeto deste manual. O Diagnóstico não desmarca.';

comment on column padroes.id_origem_acsa is
  'Identificador numérico de origem, guardado como texto. O código do padrão no sistema leva o sufixo de versão.';

create table elementos_avaliaveis (
  id uuid primary key default gen_random_uuid(),
  padrao_id uuid not null references padroes (id),
  ordem integer not null,
  texto text not null,
  id_origem_acsa text,
  unique (padrao_id, ordem)
);

comment on table elementos_avaliaveis is
  'Elemento da autoavaliação. Separado do requisito de avaliação externa.';

create table requisitos_avaliacao (
  id uuid primary key default gen_random_uuid(),
  padrao_id uuid not null references padroes (id),
  ordem integer not null,
  texto text not null,
  id_origem_acsa text,
  unique (padrao_id, ordem)
);

comment on table requisitos_avaliacao is
  'Requisito da avaliação externa. Visível só para perfis IBES.';

create table provas (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references manuais (id),
  codigo text not null,
  nome text not null,
  unique (manual_id, codigo)
);

comment on table provas is
  'Catálogo de provas do manual. Um requisito tem zero ou mais provas. A prova é opcional.';

create table requisitos_provas (
  requisito_id uuid not null references requisitos_avaliacao (id),
  prova_id uuid not null references provas (id),
  primary key (requisito_id, prova_id)
);

create table projetos_anexos (
  projeto_id uuid not null references projetos (id),
  anexo_id uuid not null references anexos_manual (id),
  primary key (projeto_id, anexo_id)
);

comment on table projetos_anexos is
  'Anexos escolhidos na abertura do projeto. Entram no universo com o mesmo percentual do núcleo.';

alter table manuais
  add column prazo_autoavaliacao_meses integer not null default 12;

alter table manuais
  drop column if exists prazo_solicitar_auditoria_meses;

comment on column manuais.prazo_autoavaliacao_meses is
  'Janela única, em meses, desde a abertura: concluir a autoavaliação e solicitar a auditoria.';

create table documentos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  nome text not null,
  id_origem_acsa text
);

comment on table documentos is
  'Arquivo do projeto. O vínculo com a evidência é N:N em evidencias_arquivos.';

create table evidencias_arquivos (
  evidencia_id uuid not null references evidencias (id),
  documento_id uuid not null references documentos (id),
  primary key (evidencia_id, documento_id)
);

comment on table evidencias_arquivos is
  'N:N entre evidência e arquivo. O texto de área de melhoria do lote histórico fica em stg_doc_vinculos.descricao_area_melhoria.';

create table stg_projetos (
  idpry_acsa integer primary key,
  codigo text,
  manual_codigo text,
  payload jsonb not null,
  importado_em timestamptz not null default now()
);

comment on table stg_projetos is
  'Staging da migração de projetos. Sem tela final nesta versão. A extração chega em JSON, fora desta base.';

create table stg_documentos (
  id_fichero_acsa bigint primary key,
  idpry_acsa integer not null,
  idaut_acsa integer not null,
  nome text not null,
  tamanho_bytes bigint not null,
  enviado_em timestamptz,
  enviado_por text,
  arquivo_path text
);

comment on table stg_documentos is
  'Um registro por id_fichero. arquivo_path fica nulo até o arquivo entrar no bucket projeto/{id}/id_origem/{id}.';

create table stg_doc_vinculos (
  id uuid primary key default gen_random_uuid(),
  id_fichero_acsa bigint not null,
  cod_estandar text not null,
  id_evidencia_acsa bigint,
  descricao_evidencia text,
  descricao_area_melhoria text
);

comment on table stg_doc_vinculos is
  'Um documento pode ter vários vínculos. A deduplicação é por id_fichero, não por esta linha.';

create or replace function app.proteger_nao_se_aplica_manual()
returns trigger
language plpgsql
as $$
begin
  if old.nao_se_aplica_manual is true
     and new.nao_se_aplica_manual is distinct from true
     and app.perfil_atual() is distinct from 'admin_ibes'
     and app.perfil_atual() is distinct from 'responsavel_ibes' then
    raise exception 'só admin_ibes ou responsavel_ibes desmarca o não se aplica do manual'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger padroes_protege_na_manual
before update of nao_se_aplica_manual on padroes
for each row
execute function app.proteger_nao_se_aplica_manual();

create or replace function app.recusar_diagnostico_em_na_manual()
returns trigger
language plpgsql
as $$
declare
  do_manual boolean;
begin
  select nao_se_aplica_manual into do_manual
  from padroes
  where id = new.padrao_id;

  if do_manual is true then
    raise exception 'diagnóstico não altera padrão que não se aplica no manual'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger padroes_nao_aplicaveis_recusa_na_manual
before insert on padroes_nao_aplicaveis
for each row
execute function app.recusar_diagnostico_em_na_manual();

alter table requisitos_avaliacao enable row level security;
alter table requisitos_avaliacao force row level security;
alter table requisitos_provas enable row level security;
alter table requisitos_provas force row level security;

create policy requisitos_avaliacao_leitura_ibes
on requisitos_avaliacao
for select
to app_sessao
using (
  app.perfil_atual() in ('admin_ibes', 'responsavel_ibes', 'avaliador_ibes', 'membro_comite')
);

create policy requisitos_avaliacao_escrita_ibes
on requisitos_avaliacao
for insert
to app_sessao
with check (
  app.perfil_atual() in ('admin_ibes', 'responsavel_ibes', 'avaliador_ibes', 'membro_comite')
);

create policy requisitos_provas_leitura_ibes
on requisitos_provas
for select
to app_sessao
using (
  app.perfil_atual() in ('admin_ibes', 'responsavel_ibes', 'avaliador_ibes', 'membro_comite')
);

create policy requisitos_provas_escrita_ibes
on requisitos_provas
for insert
to app_sessao
with check (
  app.perfil_atual() in ('admin_ibes', 'responsavel_ibes', 'avaliador_ibes', 'membro_comite')
);

grant select, insert, update, delete on
  ambitos,
  criterios,
  anexos_manual,
  elementos_avaliaveis,
  requisitos_avaliacao,
  provas,
  requisitos_provas,
  projetos_anexos,
  documentos,
  evidencias_arquivos,
  stg_projetos,
  stg_documentos,
  stg_doc_vinculos
to app_sessao;

grant execute on function app.proteger_nao_se_aplica_manual() to app_sessao;
grant execute on function app.recusar_diagnostico_em_na_manual() to app_sessao;
