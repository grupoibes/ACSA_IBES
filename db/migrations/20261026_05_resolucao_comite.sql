-- Resolução do comitê é registro manual.
-- Não há credencial, fila ou acesso externo para a ACSA.

create table resolucoes_comite (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  avaliacao_id uuid not null references avaliacoes (id),
  orgao text not null check (orgao in ('ACSA', 'IBES')),
  data date not null,
  resultado text not null check (length(btrim(resultado)) > 0),
  pontuacao numeric(5, 2) not null check (pontuacao >= 0 and pontuacao <= 100),
  nivel_concedido text check (nivel_concedido in ('avancado', 'otimo', 'excelente')),
  documento_nome text not null,
  documento_caminho text not null,
  registrado_por uuid not null references usuarios (id),
  criado_em timestamptz not null default now(),
  constraint resolucoes_documento check (
    length(btrim(documento_nome)) > 0 and length(btrim(documento_caminho)) > 0
  )
);

comment on table resolucoes_comite is
  'Registro manual da resolução (órgão ACSA ou IBES, data, resultado, pontuação, nível concedido e documento). Sem integração externa com a ACSA.';

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
