-- Decisão de 27/10: o Comitê de Certificação é do IBES.
-- pareceres_comite: membro, parecer, voto, data.
-- resolucoes_comite já nasce com decisao, pontuacao, nivel_concedido, data, documento.
-- Telas: Fase 2.

alter table usuarios drop constraint if exists usuarios_perfil_check;

alter table usuarios add constraint usuarios_perfil_check check (
  perfil in (
    'admin_ibes',
    'responsavel_ibes',
    'avaliador_ibes',
    'membro_comite',
    'gestor_instituicao',
    'profissional_instituicao'
  )
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resolucoes_comite'
      and column_name = 'orgao'
  ) then
    alter table resolucoes_comite drop column orgao;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resolucoes_comite'
      and column_name = 'resultado'
  ) then
    alter table resolucoes_comite rename column resultado to decisao;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resolucoes_comite'
      and column_name = 'documento_caminho'
  ) then
    alter table resolucoes_comite add column if not exists documento text;
    update resolucoes_comite
       set documento = documento_caminho
     where documento is null;
    alter table resolucoes_comite drop constraint if exists resolucoes_documento;
    alter table resolucoes_comite drop column documento_nome;
    alter table resolucoes_comite drop column documento_caminho;
    alter table resolucoes_comite alter column documento set not null;
    alter table resolucoes_comite
      add constraint resolucoes_documento check (length(btrim(documento)) > 0);
  end if;
end $$;

comment on table resolucoes_comite is
  'Decisão do Comitê de Certificação do IBES: decisao, pontuacao, nivel_concedido, data e documento. Tela na Fase 2.';

create table pareceres_comite (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  avaliacao_id uuid not null references avaliacoes (id),
  membro uuid not null references usuarios (id),
  parecer text not null check (length(btrim(parecer)) > 0),
  voto text not null check (length(btrim(voto)) > 0),
  data date not null,
  criado_em timestamptz not null default now()
);

comment on table pareceres_comite is
  'Parecer de um membro_comite: membro, parecer, voto e data. Tela na Fase 2. O vocabulário de voto não foi fechado.';

comment on column pareceres_comite.voto is
  'Texto livre. A lista de votos está em aberto até o IBES defini-la.';

create or replace function app.parecer_de_membro_comite()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  perfil text;
  projeto uuid;
begin
  select u.perfil into perfil from usuarios u where u.id = new.membro;
  if perfil is distinct from 'membro_comite' then
    raise exception 'o parecer é de um membro_comite'
      using errcode = '42501';
  end if;

  select a.projeto_id into projeto from avaliacoes a where a.id = new.avaliacao_id;
  if projeto is distinct from new.projeto_id then
    raise exception 'o parecer usa uma avaliação do mesmo projeto'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger pareceres_de_membro
before insert or update on pareceres_comite
for each row
execute function app.parecer_de_membro_comite();

alter table pareceres_comite enable row level security;
alter table pareceres_comite force row level security;

create policy pareceres_leitura_ibes
on pareceres_comite
for select
to app_sessao
using (
  app.perfil_atual() in ('admin_ibes', 'responsavel_ibes', 'avaliador_ibes', 'membro_comite')
);

create policy pareceres_escrita_membro
on pareceres_comite
for insert
to app_sessao
with check (app.perfil_atual() = 'membro_comite');

grant select, insert, update, delete on pareceres_comite to app_sessao;
grant execute on function app.parecer_de_membro_comite() to app_sessao;

insert into usuarios (id, nome, perfil)
values (
  '66666666-6666-4666-8666-666666666664',
  'Rita Campos',
  'membro_comite'
);
