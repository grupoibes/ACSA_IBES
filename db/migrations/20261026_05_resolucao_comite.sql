-- Resolução do Comitê de Certificação do IBES.
-- decisao, pontuacao, nivel_concedido, data e documento.
-- As telas deste registro ficam para a Fase 2.

create table resolucoes_comite (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  avaliacao_id uuid not null references avaliacoes (id),
  decisao text not null check (length(btrim(decisao)) > 0),
  pontuacao numeric(5, 2) not null check (pontuacao >= 0 and pontuacao <= 100),
  nivel_concedido text check (nivel_concedido in ('avancado', 'otimo', 'excelente')),
  data date not null,
  documento text not null check (length(btrim(documento)) > 0),
  registrado_por uuid not null references usuarios (id),
  criado_em timestamptz not null default now()
);

comment on table resolucoes_comite is
  'Decisão do Comitê de Certificação do IBES: decisao, pontuacao, nivel_concedido, data e documento. Tela na Fase 2.';

create or replace function app.resolucao_da_mesma_avaliacao()
returns trigger
language plpgsql
as $$
declare
  projeto uuid;
begin
  select projeto_id into projeto from avaliacoes where id = new.avaliacao_id;
  if projeto is distinct from new.projeto_id then
    raise exception 'a resolução usa uma avaliação do mesmo projeto'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger resolucoes_mesmo_projeto
before insert or update on resolucoes_comite
for each row
execute function app.resolucao_da_mesma_avaliacao();
