-- Seções 2 e o prazo do Comitê. Não edita as migrações anteriores.
-- PENDÊNCIA 48: o código é sugerido e pode ser editado. Nesta versão só
-- Administrador e Backoffice criam o projeto. A pergunta continua aberta.

alter table projetos add column abertura date;
alter table projetos add column unidade text;
alter table projetos add column tipo_unidade text;
alter table projetos add column grupo text;
alter table projetos add column origem_criacao text
  check (origem_criacao in ('zero', 'candidatura'));

update projetos set abertura = date '2025-09-12' where abertura is null;

alter table projetos alter column abertura set not null;
alter table projetos alter column abertura set default current_date;

comment on column projetos.abertura is
  'A janela única de 12 meses conta desta data. Não há segunda coluna de prazo.';

comment on column projetos.origem_criacao is
  'zero ou candidatura. Nulo nos projetos que já estavam na base.';

create table emails_enviados (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  destinatario text not null,
  assunto text not null,
  corpo text not null,
  enviado_em timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid
);

comment on table emails_enviados is
  'Registro do aviso. enviado_em fica nulo: esta versão não envia SMTP.';

create trigger emails_enviados_auditar
after insert or update or delete on emails_enviados
for each row
execute function app.auditar();

alter table emails_enviados enable row level security;
alter table emails_enviados force row level security;

create policy emails_leitura
on emails_enviados
for select
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = emails_enviados.projeto_id
      and m.usuario_id = app.usuario_atual()
  )
);

grant select on emails_enviados to app_sessao;

create or replace function app.criar_projeto(
  p_codigo text,
  p_instituicao text,
  p_unidade text,
  p_tipo_unidade text,
  p_grupo text,
  p_manual_id uuid,
  p_abertura date,
  p_origem text default 'zero'
)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  organizacao uuid;
  projeto uuid;
begin
  if app.perfil_canonico() not in ('admin_ibes', 'backoffice_ibes') then
    raise exception 'somente administrador e backoffice criam projeto'
      using errcode = '42501';
  end if;
  if p_codigo is null or p_codigo !~ '^[0-9]{4}/[0-9]{3}$' then
    raise exception 'código de projeto inválido'
      using errcode = '23514';
  end if;
  if nullif(btrim(p_instituicao), '') is null or nullif(btrim(p_unidade), '') is null then
    raise exception 'informe a instituição e a unidade'
      using errcode = '23514';
  end if;
  if p_origem is null or p_origem not in ('zero', 'candidatura') then
    raise exception 'origem de criação inválida'
      using errcode = '23514';
  end if;

  insert into organizacoes (nome) values (btrim(p_instituicao)) returning id into organizacao;
  insert into projetos (
    organizacao_id, manual_id, nome, estado, codigo, abertura, unidade, tipo_unidade, grupo, origem_criacao
  ) values (
    organizacao,
    p_manual_id,
    btrim(p_unidade),
    'diagnostico',
    p_codigo,
    p_abertura,
    btrim(p_unidade),
    nullif(btrim(p_tipo_unidade), ''),
    nullif(btrim(p_grupo), ''),
    p_origem
  ) returning id into projeto;

  insert into emails_enviados (projeto_id, destinatario, assunto, corpo)
  values (
    projeto,
    'Responsável do projeto',
    format('Projeto %s aberto na etapa Diagnóstico', p_codigo),
    'Aviso registrado nesta base. O envio por SMTP não está ligado.'
  );

  return projeto;
end;
$$;

comment on function app.criar_projeto(text, text, text, text, text, uuid, date, text) is
  'PENDÊNCIA 48: nasce em Diagnóstico, biblioteca vazia, código editável. Sem SMTP.';

grant execute on function app.criar_projeto(text, text, text, text, text, uuid, date, text) to app_sessao;

create or replace function app.prazo_comite(p_avaliacao uuid)
returns timestamptz
language sql
stable
as $$
  select resultado_positivo_em + interval '30 days'
  from avaliacoes
  where id = p_avaliacao
$$;

comment on function app.prazo_comite(uuid) is
  '30 dias a partir de avaliacoes.resultado_positivo_em.';

create or replace function app.comite_vencido(p_projeto uuid, p_agora timestamptz default now())
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from avaliacoes a
    where a.projeto_id = p_projeto
      and a.resultado = 'positiva'
      and a.resultado_positivo_em is not null
      and a.resultado_positivo_em + interval '30 days' < p_agora
      and not exists (
        select 1 from resolucoes_comite r
        where r.avaliacao_id = a.id
      )
  )
$$;

create or replace function app.impede_avanco_comite_vencido()
returns trigger
language plpgsql
as $$
begin
  if new.estado is distinct from old.estado
     and new.estado in ('comite', 'certificado')
     and app.comite_vencido(new.id) then
    raise exception 'prazo do comitê vencido: a etapa fica bloqueada'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger projetos_prazo_comite
before update of estado on projetos
for each row
execute function app.impede_avanco_comite_vencido();

comment on function app.impede_avanco_comite_vencido() is
  'Com o prazo de 30 dias vencido e sem resolução, o projeto não avança para comitê nem certificado.';

grant execute on function app.prazo_comite(uuid) to app_sessao;
grant execute on function app.comite_vencido(uuid, timestamptz) to app_sessao;
grant execute on function app.impede_avanco_comite_vencido() to app_sessao;
