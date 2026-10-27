-- Beta v0.3: auditoria só recebe insert, e os percentuais de nível ficam por manual.
-- PENDÊNCIA 30: calcular_nivel continua nos limiares de manuais (Grupo III em 70%).
-- A tela do protótipo lê o espírito desta tabela: Grupo III em 40% e mínimo para cima.

create table auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid,
  perfil text not null check (length(btrim(perfil)) > 0),
  tipo text not null check (length(btrim(tipo)) > 0),
  acao text not null check (length(btrim(acao)) > 0),
  objeto text,
  em timestamptz not null default now()
);

comment on table auditoria is
  'Quem fez o quê. Só insert: update e delete são recusados.';

create or replace function app.auditoria_imutavel()
returns trigger
language plpgsql
as $$
begin
  raise exception 'auditoria só aceita insert'
    using errcode = '42501';
end;
$$;

create trigger auditoria_imutavel
before update or delete on auditoria
for each row
execute function app.auditoria_imutavel();

alter table auditoria enable row level security;
alter table auditoria force row level security;

create policy auditoria_leitura
on auditoria
for select
to app_sessao
using (true);

create policy auditoria_escrita
on auditoria
for insert
to app_sessao
with check (true);

grant select, insert on auditoria to app_sessao;

create table regras_nivel (
  manual_id uuid not null references manuais (id),
  nivel text not null check (nivel in ('avancado', 'otimo', 'excelente')),
  grupo text not null check (grupo in ('I', 'II', 'III')),
  percentual integer not null check (percentual between 0 and 100),
  exige_obrigatorios boolean not null default false,
  primary key (manual_id, nivel, grupo)
);

comment on table regras_nivel is
  'Percentuais do Beta v0.3 por manual. PENDÊNCIA 30: o motor SQL ainda não lê esta tabela.';

insert into regras_nivel (manual_id, nivel, grupo, percentual, exige_obrigatorios) values
  ('11111111-1111-4111-8111-111111111111', 'avancado', 'I', 70, true),
  ('11111111-1111-4111-8111-111111111111', 'avancado', 'II', 0, false),
  ('11111111-1111-4111-8111-111111111111', 'avancado', 'III', 0, false),
  ('11111111-1111-4111-8111-111111111111', 'otimo', 'I', 100, true),
  ('11111111-1111-4111-8111-111111111111', 'otimo', 'II', 40, false),
  ('11111111-1111-4111-8111-111111111111', 'otimo', 'III', 0, false),
  ('11111111-1111-4111-8111-111111111111', 'excelente', 'I', 100, true),
  ('11111111-1111-4111-8111-111111111111', 'excelente', 'II', 100, false),
  ('11111111-1111-4111-8111-111111111111', 'excelente', 'III', 40, false);
