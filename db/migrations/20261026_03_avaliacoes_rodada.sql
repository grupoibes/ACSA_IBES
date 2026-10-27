-- Reavaliação é outra rodada (1..n) no mesmo projeto.
-- A evidência nova não apaga a anterior.

create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  rodada integer not null check (rodada >= 1),
  tipo text not null check (tipo in ('certificacao', 'manutencao', 'recertificacao')),
  unique (projeto_id, rodada)
);

comment on column avaliacoes.rodada is
  'Rodada 1..n da mesma avaliação de projeto. A reavaliação não abre outro projeto.';

comment on column avaliacoes.tipo is
  'certificacao, manutencao ou recertificacao. Manutenção avalia só os Grupos I e II aplicáveis.';

create table conformidades (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references avaliacoes (id),
  padrao_id uuid not null references padroes (id),
  cumprido boolean not null,
  unique (avaliacao_id, padrao_id)
);

comment on table conformidades is
  'Cumprido ou não cumprido. O resultado Ausente foi retirado em 26/10. Não aplicável não é conformidade: vive em padroes_nao_aplicaveis.';

create or replace function app.impede_conformidade_de_nao_aplicavel()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  projeto uuid;
begin
  select projeto_id into projeto from avaliacoes where id = new.avaliacao_id;

  if exists (
    select 1
    from padroes_nao_aplicaveis
    where projeto_id = projeto and padrao_id = new.padrao_id
  ) then
    raise exception 'padrão não aplicável não recebe conformidade'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger conformidades_sem_nao_aplicavel
before insert or update on conformidades
for each row
execute function app.impede_conformidade_de_nao_aplicavel();

create table evidencias (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  padrao_id uuid not null references padroes (id),
  avaliacao_id uuid not null references avaliacoes (id),
  descricao text not null check (length(btrim(descricao)) > 0),
  criada_em timestamptz not null default now()
);

comment on table evidencias is
  'Acumulam entre rodadas. Não há exclusão: a rodada nova acrescenta, não substitui.';

create index evidencias_projeto_padrao on evidencias (projeto_id, padrao_id, criada_em);

create or replace function app.impede_apagar_evidencia()
returns trigger
language plpgsql
as $$
begin
  raise exception 'evidências acumulam entre rodadas e não são apagadas'
    using errcode = '42501';
end;
$$;

create trigger evidencias_nao_apagam
before delete on evidencias
for each row
execute function app.impede_apagar_evidencia();
