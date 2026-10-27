-- Importação só de arquivos já exportados (CSV ou JSON) e dos anexos que os acompanham.
-- Extração automática da plataforma atual não tem tabela, credencial nem função.
-- O formato interno do arquivo está PENDENTE IBES: formato_entrada permanece nulo.

create table lotes_importacao (
  id uuid primary key default gen_random_uuid(),
  meio text not null check (meio in ('csv', 'json')),
  arquivo text not null check (length(btrim(arquivo)) > 0),
  anexos_diretorio text,
  formato_entrada text,
  criado_em timestamptz not null default now(),
  constraint lotes_importacao_formato_pendente check (formato_entrada is null)
);

comment on table lotes_importacao is
  'Lote recebido em CSV ou JSON exportado, com diretório de anexos. Formato de entrada PENDENTE IBES. Não lê a plataforma de origem.';

comment on column lotes_importacao.formato_entrada is
  'PENDENTE IBES. A constraint impede gravar um layout antes da definição.';

alter table lotes_importacao enable row level security;
alter table lotes_importacao force row level security;

create policy lotes_importacao_ibes
on lotes_importacao
for all
to app_sessao
using (app.perfil_atual() in ('admin_ibes', 'responsavel_ibes'))
with check (app.perfil_atual() in ('admin_ibes', 'responsavel_ibes'));

grant select, insert, update, delete on lotes_importacao to app_sessao;
