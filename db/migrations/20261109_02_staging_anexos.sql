-- Seção 4. Colunas do casamento dos anexos. app.auditar() continua fora das tabelas stg_*.

alter table stg_documentos add column arquivo_local text;
alter table stg_documentos add column sha256 text;
alter table stg_documentos add column mime_detectado text;
alter table stg_documentos add column status text not null default 'ok'
  check (status in ('ok', 'ausente', 'html_erro', 'nome_alterado'));

comment on column stg_documentos.arquivo_local is
  'Nome do arquivo na pasta da extração. A importação não o renomeia.';

comment on column stg_documentos.sha256 is
  'Hash do conteúdo. O mesmo hash compartilha um objeto no Storage.';

comment on column stg_documentos.mime_detectado is
  'Tipo lido pelos bytes quando o nome não tem extensão.';

comment on column stg_documentos.status is
  'ok, ausente, html_erro (página de 214 bytes) ou nome_alterado (prefixo id_fichero_ com o restante diferente).';
