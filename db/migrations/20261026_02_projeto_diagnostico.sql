-- Diagnóstico é um registro por projeto (avaliador, data, anexo).
-- Digitalizar o diagnóstico, padrão a padrão, é v2 e não tem tabela aqui.
-- Padrão não aplicável nasce desse diagnóstico, com origem fixa.

create table organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null
);

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid references organizacoes (id),
  nome text not null,
  perfil text not null check (
    perfil in (
      'admin_ibes',
      'responsavel_ibes',
      'avaliador_ibes',
      'membro_comite',
      'gestor_instituicao',
      'profissional_instituicao'
    )
  )
);

create table projetos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references organizacoes (id),
  manual_id uuid not null references manuais (id),
  nome text not null,
  estado text not null default 'rascunho' check (
    estado in (
      'rascunho',
      'diagnostico',
      'autoavaliacao',
      'avaliacao',
      'comite',
      'certificado',
      'recusado',
      'abandonado'
    )
  )
);

comment on column projetos.estado is
  'recusado e abandonado só podem ser gravados por admin_ibes ou responsavel_ibes. Toda mudança vai para historico_estados.';

create table diagnosticos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null unique references projetos (id),
  avaliador_id uuid not null references usuarios (id),
  realizado_em date not null,
  anexo_nome text not null,
  anexo_caminho text not null,
  constraint diagnosticos_anexo_preenchido check (
    length(btrim(anexo_nome)) > 0 and length(btrim(anexo_caminho)) > 0
  )
);

comment on table diagnosticos is
  'v1: avaliador, data e anexo do relatório. A digitalização do diagnóstico é v2.';

create table padroes_nao_aplicaveis (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  padrao_id uuid not null references padroes (id),
  diagnostico_id uuid not null references diagnosticos (id),
  origem text not null default 'diagnostico' check (origem = 'diagnostico'),
  registrado_por uuid not null references usuarios (id),
  registrado_em timestamptz not null default now(),
  unique (projeto_id, padrao_id)
);

comment on table padroes_nao_aplicaveis is
  'Oculta para perfis da instituição (RLS). Sai do total e do mínimo em calcular_nivel. A origem desta decisão é somente diagnostico.';

create or replace function app.nao_aplicavel_do_mesmo_projeto()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  projeto_do_diagnostico uuid;
begin
  select projeto_id into projeto_do_diagnostico
  from diagnosticos
  where id = new.diagnostico_id;

  if projeto_do_diagnostico is distinct from new.projeto_id then
    raise exception 'o padrão não aplicável usa o diagnóstico do mesmo projeto'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger padroes_nao_aplicaveis_mesmo_projeto
before insert or update on padroes_nao_aplicaveis
for each row
execute function app.nao_aplicavel_do_mesmo_projeto();
