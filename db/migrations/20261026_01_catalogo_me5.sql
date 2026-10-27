-- Decisão de 26/10: a contagem operacional é o ME 5 1_07.
-- ME 2 1_05 (144 padrões) fica só como referência de estrutura.

create schema if not exists app;

create or replace function app.minimo_cumpridos(total integer, percentual integer)
returns integer
language sql
immutable
as $$
  select case
    when total is null or percentual is null then null
    when total < 0 or percentual < 0 or percentual > 100 then
      null
    when total = 0 or percentual = 0 then 0
    when percentual = 100 then total
    else (percentual * total + 99) / 100
  end
$$;

create or replace function app.perfil_atual()
returns text
language plpgsql
stable
as $$
declare
  bruto text;
begin
  bruto := nullif(current_setting('app.perfil', true), '');
  if bruto is not null then
    return bruto;
  end if;

  bruto := nullif(current_setting('request.jwt.claims', true), '');
  if bruto is null then
    return null;
  end if;

  begin
    return bruto::json ->> 'perfil';
  exception
    when others then
      return null;
  end;
end;
$$;

create or replace function app.eh_perfil_instituicao()
returns boolean
language sql
stable
as $$
  select app.perfil_atual() in ('gestor_instituicao', 'profissional_instituicao')
$$;

create or replace function app.definir_perfil(p_perfil text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if p_perfil is not null and p_perfil not in (
    'admin_ibes',
    'responsavel_ibes',
    'avaliador_ibes',
    'membro_comite',
    'gestor_instituicao',
    'profissional_instituicao'
  ) then
    raise exception 'perfil desconhecido';
  end if;
  perform set_config('app.perfil', coalesce(p_perfil, ''), false);
end;
$$;

create or replace function app.definir_motivo_estado(p_motivo text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform set_config('app.motivo_estado', coalesce(p_motivo, ''), false);
end;
$$;

create table manuais (
  id uuid primary key,
  codigo text not null unique,
  titulo text not null,
  catalogo_oficial boolean not null,
  limiar_i_avancado integer not null,
  limiar_i_superior integer not null,
  limiar_ii_otimo integer not null,
  limiar_ii_excelente integer not null,
  limiar_iii_excelente integer not null,
  constraint manuais_codigo_operacional check (codigo <> 'ME 2 1_05'),
  constraint manuais_limiares check (
    limiar_i_avancado between 0 and 100
    and limiar_i_superior between 0 and 100
    and limiar_ii_otimo between 0 and 100
    and limiar_ii_excelente between 0 and 100
    and limiar_iii_excelente between 0 and 100
  )
);

comment on table manuais is
  'Manual operacional ME 5 1_07. A contagem usada por calcular_nivel é o número de padrões deste manual, menos os não aplicáveis do projeto.';

create table referencias_estrutura (
  manual text primary key,
  padroes_citados integer not null check (padroes_citados > 0),
  uso text not null
);

comment on table referencias_estrutura is
  'Números do mapeamento que não entram em total nem mínimo. ME 2 1_05 cita 144 padrões só como estrutura.';

insert into referencias_estrutura (manual, padroes_citados, uso)
values (
  'ME 2 1_05',
  144,
  'Referência de estrutura do mapeamento. Proibido usar 144 como denominador ou como mínimo.'
);

create table padroes (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references manuais (id),
  codigo text not null,
  titulo text not null,
  grupo text not null check (grupo in ('I', 'II', 'III')),
  obrigatorio boolean not null default false,
  imprescindivel boolean not null default false,
  unique (manual_id, codigo),
  constraint padroes_obrigatorio_grupo_i check (not obrigatorio or grupo = 'I'),
  constraint padroes_imprescindivel_grupo_ii check (not imprescindivel or grupo = 'II')
);

comment on table padroes is
  'Catálogo do manual operacional. Não carregar aqui os 144 padrões do ME 2 1_05.';

comment on column padroes.obrigatorio is
  'Obrigatório do Grupo I. Entra no mínimo de qualquer nível, salvo se estiver em padroes_nao_aplicaveis.';

comment on column padroes.imprescindivel is
  'Imprescindível do Grupo II. Entra no mínimo de Ótima e Excelente, salvo se não aplicável.';
