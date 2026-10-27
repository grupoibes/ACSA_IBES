-- recusado e abandonado: somente admin_ibes e responsavel_ibes.
-- Toda mudança de estado grava historico_estados.

create table historico_estados (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  estado_anterior text,
  estado_novo text not null,
  perfil_ator text,
  motivo text,
  em timestamptz not null default now()
);

comment on table historico_estados is
  'Trilha de estados do projeto. Transições para recusado e abandonado só entram se o perfil for admin_ibes ou responsavel_ibes.';

create or replace function app.registrar_mudanca_estado()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  perfil text := app.perfil_atual();
  motivo text := nullif(current_setting('app.motivo_estado', true), '');
begin
  if tg_op = 'UPDATE' and new.estado is not distinct from old.estado then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.estado in ('recusado', 'abandonado')
     and perfil not in ('admin_ibes', 'responsavel_ibes') then
    raise exception 'apenas admin_ibes e responsavel_ibes podem alterar o estado para %', new.estado
      using errcode = '42501';
  end if;

  insert into historico_estados (projeto_id, estado_anterior, estado_novo, perfil_ator, motivo)
  values (
    new.id,
    case when tg_op = 'INSERT' then null else old.estado end,
    new.estado,
    perfil,
    motivo
  );

  return new;
end;
$$;

create trigger projetos_historico_estado
after insert or update of estado on projetos
for each row
execute function app.registrar_mudanca_estado();
