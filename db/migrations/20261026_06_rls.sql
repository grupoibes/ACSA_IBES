-- Perfis da instituição não leem, não gravam e não recebem a lista de
-- padroes_nao_aplicaveis. A tela usa a mesma regra em padroesVisiveis.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_sessao') then
    create role app_sessao nosuperuser nologin;
  end if;
end $$;

grant usage on schema public, app to app_sessao;
grant app_sessao to current_user;

grant select, insert, update, delete on all tables in schema public to app_sessao;
grant execute on all functions in schema app to app_sessao;

alter table padroes_nao_aplicaveis enable row level security;
alter table padroes_nao_aplicaveis force row level security;

create policy padroes_nao_aplicaveis_ibes
on padroes_nao_aplicaveis
for all
to app_sessao
using (
  app.perfil_atual() in ('admin_ibes', 'responsavel_ibes', 'avaliador_ibes')
)
with check (
  app.perfil_atual() in ('admin_ibes', 'responsavel_ibes', 'avaliador_ibes')
);

alter table historico_estados enable row level security;
alter table historico_estados force row level security;

create policy historico_estados_leitura
on historico_estados
for select
to app_sessao
using (true);

-- Insert só pelo trigger security definer. Não há policy de escrita.

alter table projetos enable row level security;
alter table projetos force row level security;

create policy projetos_leitura
on projetos
for select
to app_sessao
using (true);

create policy projetos_atualizacao
on projetos
for update
to app_sessao
using (true)
with check (true);

create policy projetos_insercao
on projetos
for insert
to app_sessao
with check (true);

alter table resolucoes_comite enable row level security;
alter table resolucoes_comite force row level security;

create policy resolucoes_leitura
on resolucoes_comite
for select
to app_sessao
using (true);

create policy resolucoes_escrita_ibes
on resolucoes_comite
for insert
to app_sessao
with check (
  app.perfil_atual() in ('admin_ibes', 'responsavel_ibes')
);

-- Não há role, chave ou policy para um acesso externo da ACSA.
