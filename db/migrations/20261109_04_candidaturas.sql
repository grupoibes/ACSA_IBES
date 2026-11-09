-- Candidatura antes do projeto. Devolver exige motivo. A auditoria segue app.auditar().

create table candidaturas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[0-9]{4}/[0-9]{3}$'),
  instituicao text not null check (length(btrim(instituicao)) > 0),
  situacao text not null default 'recebida' check (situacao in ('recebida', 'validada', 'devolvida', 'convertida')),
  motivo_devolucao text,
  avaliada_por uuid references usuarios (id),
  avaliada_em timestamptz,
  projeto_id uuid references projetos (id),
  created_at timestamptz not null default now(),
  created_by uuid,
  constraint candidaturas_devolucao_com_motivo check (
    situacao <> 'devolvida'
    or (motivo_devolucao is not null and length(btrim(motivo_devolucao)) > 0)
  ),
  constraint candidaturas_convertida_com_projeto check (
    situacao <> 'convertida' or projeto_id is not null
  )
);

comment on table candidaturas is
  'Pedido antes do projeto. recebida, validada, devolvida ou convertida. Devolver exige motivo.';

comment on column candidaturas.motivo_devolucao is
  'Obrigatório quando a situação é devolvida. Nas demais fica nulo.';

create trigger candidaturas_auditar
after insert or update or delete on candidaturas
for each row
execute function app.auditar();

alter table candidaturas enable row level security;
alter table candidaturas force row level security;

create policy candidaturas_leitura
on candidaturas
for select
to app_sessao
using (true);

grant select, insert, update, delete on candidaturas to app_sessao;

create or replace function app.exigir_criador_projeto()
returns void
language plpgsql
as $$
begin
  if app.perfil_canonico() not in ('admin_ibes', 'backoffice_ibes') then
    raise exception 'somente administrador e backoffice tratam candidatura'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function app.validar_candidatura(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform app.exigir_criador_projeto();
  update candidaturas
     set situacao = 'validada',
         motivo_devolucao = null,
         avaliada_por = app.usuario_atual(),
         avaliada_em = now()
   where id = p_id
     and situacao = 'recebida';
  if not found then
    raise exception 'candidatura não está aguardando validação'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function app.devolver_candidatura(p_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform app.exigir_criador_projeto();
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'informe o motivo da devolução'
      using errcode = '23514';
  end if;
  update candidaturas
     set situacao = 'devolvida',
         motivo_devolucao = btrim(p_motivo),
         avaliada_por = app.usuario_atual(),
         avaliada_em = now()
   where id = p_id
     and situacao = 'recebida';
  if not found then
    raise exception 'candidatura não está aguardando validação'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function app.converter_candidatura(p_id uuid, p_projeto uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform app.exigir_criador_projeto();
  if p_projeto is null then
    raise exception 'informe o projeto'
      using errcode = '23514';
  end if;
  update candidaturas
     set situacao = 'convertida',
         projeto_id = p_projeto
   where id = p_id
     and situacao = 'validada';
  if not found then
    raise exception 'crie o projeto a partir da candidatura validada'
      using errcode = '23514';
  end if;
end;
$$;

comment on function app.devolver_candidatura(uuid, text) is
  'Devolver exige motivo. O banco recusa a situação devolvida sem texto.';

create or replace function app.pode_ler_documento(p_projeto uuid)
returns boolean
language sql
stable
as $$
  select app.eh_perfil_ibes()
    or exists (
      select 1 from projeto_membros m
      where m.projeto_id = p_projeto
        and m.usuario_id = app.usuario_atual()
    )
$$;

comment on function app.pode_ler_documento(uuid) is
  'Perfil IBES lê qualquer projeto. O cliente só lê o projeto em que é membro.';

alter table documentos add column classificacao text;

comment on column documentos.classificacao is
  'Classe na biblioteca. A mudança dispara a auditoria de documentos.';

create policy documentos_insercao
on documentos
for insert
to app_sessao
with check (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = documentos.projeto_id
      and m.usuario_id = app.usuario_atual()
  )
);

create policy documentos_atualizacao
on documentos
for update
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = documentos.projeto_id
      and m.usuario_id = app.usuario_atual()
  )
)
with check (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = documentos.projeto_id
      and m.usuario_id = app.usuario_atual()
  )
);

grant execute on function app.exigir_criador_projeto() to app_sessao;
grant execute on function app.validar_candidatura(uuid) to app_sessao;
grant execute on function app.devolver_candidatura(uuid, text) to app_sessao;
grant execute on function app.converter_candidatura(uuid, uuid) to app_sessao;
grant execute on function app.pode_ler_documento(uuid) to app_sessao;
