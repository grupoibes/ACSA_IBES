-- Rodada 2a. Não altera as migrações anteriores.
-- Sair da autoavaliação exige Cumpre e evidência chancelada. Fechado em 28/10.
-- A resposta de manutenção fica em outro ciclo e não substitui a inicial.
-- A chancela da área chama app.pode_chancelar_evidencia().

alter table projetos add column etapa_fluxo text;
update projetos set etapa_fluxo = case estado
  when 'autoavaliacao' then 'autoavaliacao'
  when 'avaliacao' then 'avaliacao'
  when 'comite' then 'avaliacao'
  when 'certificado' then 'certificacao'
  else 'diagnostico'
end;
alter table projetos alter column etapa_fluxo set default 'diagnostico';
alter table projetos alter column etapa_fluxo set not null;
alter table projetos add constraint projetos_etapa_fluxo check (
  etapa_fluxo in ('diagnostico', 'solicitacao', 'autoavaliacao', 'avaliacao', 'certificacao')
);

alter table projetos add column ciclo text not null default 'inicial'
  check (ciclo in ('inicial', 'manutencao_1', 'manutencao_2', 'manutencao_3', 'recertificacao'));

comment on column projetos.etapa_fluxo is
  'Diagnóstico, Solicitação, Autoavaliação, Avaliação e Certificação. Solicitação mantém estado diagnostico.';
comment on column projetos.ciclo is
  'Ciclo da resposta vigente: inicial, manutencao_1, manutencao_2, manutencao_3 ou recertificacao.';

create table respostas_padrao (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  padrao_id uuid not null references padroes (id),
  ciclo text not null check (ciclo in ('inicial', 'manutencao_1', 'manutencao_2', 'manutencao_3', 'recertificacao')),
  atende boolean,
  texto text not null default '',
  cumpre boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid,
  unique (projeto_id, padrao_id, ciclo)
);

comment on table respostas_padrao is
  'Uma linha por projeto, padrão e ciclo. A manutenção não substitui a autoavaliação inicial.';
comment on column respostas_padrao.cumpre is
  'Fechado em 28/10: a saída da autoavaliação exige Cumpre e evidência chancelada no obrigatório aplicável.';

create trigger respostas_padrao_auditar
after insert or update or delete on respostas_padrao
for each row
execute function app.auditar();

alter table respostas_padrao enable row level security;
alter table respostas_padrao force row level security;

create policy respostas_padrao_leitura
on respostas_padrao
for select
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = respostas_padrao.projeto_id
      and m.usuario_id = app.usuario_atual()
  )
);

grant select on respostas_padrao to app_sessao;

drop policy if exists padroes_nao_aplicaveis_ibes on padroes_nao_aplicaveis;
create policy padroes_nao_aplicaveis_ibes
on padroes_nao_aplicaveis
for all
to app_sessao
using (app.eh_perfil_ibes())
with check (app.eh_perfil_ibes());

create or replace function app.aplicaveis(p_projeto uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from padroes p
  join projetos pr on pr.manual_id = p.manual_id
  where pr.id = p_projeto
    and p.anexo_id is null
    and not p.nao_se_aplica_manual
    and not exists (
      select 1 from padroes_nao_aplicaveis n
      where n.projeto_id = pr.id and n.padrao_id = p.id
    )
$$;

create or replace function app.salvar_diagnostico(
  p_projeto uuid,
  p_avaliador uuid,
  p_data date,
  p_nome text,
  p_caminho text
)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if app.perfil_canonico() not in ('admin_ibes', 'backoffice_ibes') then
    raise exception 'somente backoffice e administrador registram o diagnóstico'
      using errcode = '42501';
  end if;
  if nullif(btrim(p_nome), '') is null or nullif(btrim(p_caminho), '') is null then
    raise exception 'o diagnóstico precisa do relatório'
      using errcode = '23514';
  end if;
  insert into diagnosticos (projeto_id, avaliador_id, realizado_em, anexo_nome, anexo_caminho)
  values (p_projeto, p_avaliador, p_data, btrim(p_nome), btrim(p_caminho))
  on conflict (projeto_id) do update
    set avaliador_id = excluded.avaliador_id,
        realizado_em = excluded.realizado_em,
        anexo_nome = excluded.anexo_nome,
        anexo_caminho = excluded.anexo_caminho;
end;
$$;

create or replace function app.definir_nao_aplicavel(p_projeto uuid, p_padrao uuid, p_marcado boolean)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  diagnostico uuid;
begin
  if app.perfil_canonico() not in ('admin_ibes', 'backoffice_ibes') then
    raise exception 'somente backoffice e administrador marcam não se aplica'
      using errcode = '42501';
  end if;
  if exists (select 1 from padroes where id = p_padrao and nao_se_aplica_manual) then
    raise exception 'diagnóstico não altera padrão que não se aplica no manual'
      using errcode = '42501';
  end if;
  select id into diagnostico from diagnosticos where projeto_id = p_projeto;
  if diagnostico is null then
    raise exception 'grave o diagnóstico antes de marcar não se aplica'
      using errcode = '23514';
  end if;
  if p_marcado then
    insert into padroes_nao_aplicaveis (projeto_id, padrao_id, diagnostico_id, origem, registrado_por)
    values (p_projeto, p_padrao, diagnostico, 'diagnostico', app.usuario_atual())
    on conflict (projeto_id, padrao_id) do nothing;
  else
    delete from padroes_nao_aplicaveis
    where projeto_id = p_projeto and padrao_id = p_padrao;
  end if;
end;
$$;

create or replace function app.salvar_resposta(
  p_projeto uuid,
  p_padrao uuid,
  p_ciclo text,
  p_atende boolean,
  p_texto text
)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if p_ciclo not in ('inicial', 'manutencao_1', 'manutencao_2', 'manutencao_3', 'recertificacao') then
    raise exception 'ciclo inválido'
      using errcode = '23514';
  end if;
  if app.perfil_canonico() not in (
    'admin_ibes', 'backoffice_ibes', 'responsavel_projeto', 'responsavel_upload',
    'autorizador', 'avaliador_ibes', 'avaliador_lider'
  ) then
    raise exception 'sem permissão para gravar a resposta'
      using errcode = '42501';
  end if;
  insert into respostas_padrao (projeto_id, padrao_id, ciclo, atende, texto, created_by)
  values (p_projeto, p_padrao, p_ciclo, p_atende, coalesce(p_texto, ''), app.usuario_atual())
  on conflict (projeto_id, padrao_id, ciclo) do update
    set atende = excluded.atende,
        texto = excluded.texto;
end;
$$;

comment on function app.salvar_resposta(uuid, uuid, text, boolean, text) is
  'Grava só o ciclo informado. A linha de outro ciclo permanece.';

create or replace function app.enviar_evidencia(p_id uuid, p_projeto uuid, p_padrao uuid, p_descricao text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if not app.pode_enviar_evidencia() then
    raise exception 'sem permissão para enviar evidência'
      using errcode = '42501';
  end if;
  if nullif(btrim(p_descricao), '') is null then
    raise exception 'a evidência descreve o fato'
      using errcode = '23514';
  end if;
  insert into evidencias (id, projeto_id, padrao_id, descricao, etapa, created_by)
  values (p_id, p_projeto, p_padrao, btrim(p_descricao), 'enviada', app.usuario_atual());
  insert into aprovacoes_evidencia (evidencia_id, acao, usuario_id)
  values (p_id, 'envio', app.usuario_atual());
end;
$$;

create or replace function app.vincular_evidencia(p_evidencia uuid, p_documento uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  insert into evidencias_arquivos (evidencia_id, documento_id)
  values (p_evidencia, p_documento)
  on conflict do nothing;
end;
$$;

create or replace function app.transitar_evidencia(p_evidencia uuid, p_etapa text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  atual text;
begin
  select etapa into atual from evidencias where id = p_evidencia;
  if p_etapa = 'conferida' then
    if not app.pode_conferir_evidencia() then
      raise exception 'sem permissão para conferir'
        using errcode = '42501';
    end if;
    if atual is distinct from 'enviada' then
      raise exception 'a evidência não está enviada'
        using errcode = '23514';
    end if;
    update evidencias set etapa = 'conferida' where id = p_evidencia;
    insert into aprovacoes_evidencia (evidencia_id, acao, usuario_id)
    values (p_evidencia, 'conferencia', app.usuario_atual());
  elsif p_etapa = 'chancelada' then
    if not app.pode_chancelar_evidencia() then
      raise exception 'sem permissão para chancelar'
        using errcode = '42501';
    end if;
    if atual is distinct from 'conferida' then
      raise exception 'a evidência não está conferida'
        using errcode = '23514';
    end if;
    update evidencias set etapa = 'chancelada' where id = p_evidencia;
    insert into aprovacoes_evidencia (evidencia_id, acao, usuario_id)
    values (p_evidencia, 'chancela', app.usuario_atual());
  else
    raise exception 'transição de evidência inválida'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function app.marcar_cumpre(p_projeto uuid, p_padrao uuid, p_ciclo text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if app.perfil_canonico() not in ('responsavel_projeto', 'autorizador') then
    raise exception 'somente o responsável do projeto ou o autorizador marcam Cumpre'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from respostas_padrao r
    where r.projeto_id = p_projeto and r.padrao_id = p_padrao and r.ciclo = p_ciclo and r.atende is true
  ) then
    raise exception 'Cumpre exige a resposta Sim neste ciclo'
      using errcode = '23514';
  end if;
  if not (
    exists (
      select 1 from evidencias e
      where e.projeto_id = p_projeto and e.padrao_id = p_padrao and e.etapa = 'chancelada'
    )
    or exists (
      select 1 from areas_melhoria a
      where a.projeto_id = p_projeto and a.padrao_id = p_padrao and a.fase = 'concluida'
    )
  ) then
    raise exception 'Cumpre exige evidência chancelada ou área concluída e chancelada'
      using errcode = '23514';
  end if;
  update respostas_padrao
     set cumpre = true
   where projeto_id = p_projeto and padrao_id = p_padrao and ciclo = p_ciclo;
end;
$$;

create or replace function app.criar_area(p_id uuid, p_projeto uuid, p_padrao uuid, p_texto text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if app.perfil_canonico() not in ('responsavel_projeto', 'responsavel_upload') then
    raise exception 'sem permissão para abrir área de melhoria'
      using errcode = '42501';
  end if;
  insert into areas_melhoria (id, projeto_id, padrao_id, texto, fase, responsavel_id, created_by)
  values (p_id, p_projeto, p_padrao, btrim(p_texto), 'detectada', app.usuario_atual(), app.usuario_atual());
end;
$$;

create or replace function app.transitar_area(p_area uuid, p_acao text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  atual text;
  destino text;
begin
  select fase into atual from areas_melhoria where id = p_area;
  destino := case
    when p_acao = 'planejar' and atual = 'detectada' then 'planejada'
    when p_acao = 'concluir' and atual = 'planejada' then 'aguardando_conferencia'
    when p_acao = 'conferir' and atual = 'aguardando_conferencia' then 'aguardando_chancela'
    when p_acao = 'chancelar' and atual = 'aguardando_chancela' then 'concluida'
    else null
  end;
  if destino is null then
    raise exception 'a fase da área de melhoria não pode pular'
      using errcode = '23514';
  end if;
  if p_acao in ('planejar', 'concluir')
     and app.perfil_canonico() not in ('responsavel_projeto', 'responsavel_upload') then
    raise exception 'sem permissão para esta fase'
      using errcode = '42501';
  end if;
  if p_acao = 'conferir' and not app.pode_conferir_evidencia() then
    raise exception 'sem permissão para conferir'
      using errcode = '42501';
  end if;
  if p_acao = 'chancelar' and not app.pode_chancelar_evidencia() then
    raise exception 'sem permissão para chancelar'
      using errcode = '42501';
  end if;
  update areas_melhoria
     set fase = destino,
         conferida_por = case when p_acao = 'conferir' then app.usuario_atual() else conferida_por end,
         conferida_em = case when p_acao = 'conferir' then now() else conferida_em end,
         chancelada_por = case when p_acao = 'chancelar' then app.usuario_atual() else chancelada_por end,
         chancelada_em = case when p_acao = 'chancelar' then now() else chancelada_em end,
         concluida_em = case when p_acao = 'chancelar' then now() else concluida_em end
   where id = p_area;
end;
$$;

comment on function app.transitar_area(uuid, text) is
  'A chancela da área chama app.pode_chancelar_evidencia(): Administrador, Backoffice, Tutor, Avaliador e Avaliador líder.';

create or replace function app.avancar_etapa(p_projeto uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  fluxo text;
  proxima text;
  codigo text;
  faltam integer;
begin
  if app.perfil_canonico() not in ('admin_ibes', 'backoffice_ibes') then
    raise exception 'somente backoffice e administrador avançam a etapa'
      using errcode = '42501';
  end if;
  select etapa_fluxo, projetos.codigo into fluxo, codigo from projetos where id = p_projeto;
  proxima := case fluxo
    when 'diagnostico' then 'solicitacao'
    when 'solicitacao' then 'autoavaliacao'
    when 'autoavaliacao' then 'avaliacao'
    when 'avaliacao' then 'certificacao'
    else null
  end;
  if proxima is null then
    raise exception 'não há próxima etapa'
      using errcode = '23514';
  end if;
  if fluxo = 'autoavaliacao' then
    select count(*) into faltam
    from padroes p
    join projetos pr on pr.id = p_projeto and pr.manual_id = p.manual_id
    where p.obrigatorio
      and p.anexo_id is null
      and not p.nao_se_aplica_manual
      and not exists (
        select 1 from padroes_nao_aplicaveis n
        where n.projeto_id = pr.id and n.padrao_id = p.id
      )
      and not (
        exists (
          select 1 from respostas_padrao r
          where r.projeto_id = pr.id
            and r.padrao_id = p.id
            and r.ciclo = pr.ciclo
            and r.cumpre
        )
        and exists (
          select 1 from evidencias e
          where e.projeto_id = pr.id and e.padrao_id = p.id and e.etapa = 'chancelada'
        )
      );
    if faltam > 0 then
      raise exception 'a saída da autoavaliação exige Cumpre e evidência chancelada em todo obrigatório aplicável'
        using errcode = '23514';
    end if;
  end if;
  update projetos
     set etapa_fluxo = proxima,
         estado = case proxima
           when 'autoavaliacao' then 'autoavaliacao'
           when 'avaliacao' then 'avaliacao'
           when 'certificacao' then 'certificado'
           else 'diagnostico'
         end
   where id = p_projeto;
  insert into emails_enviados (projeto_id, destinatario, assunto, corpo)
  values (
    p_projeto,
    'Responsável do projeto',
    format('Projeto %s avançou para %s', codigo, proxima),
    'Aviso registrado nesta base. O envio por SMTP não está ligado.'
  );
end;
$$;

comment on function app.avancar_etapa(uuid) is
  'Fechado em 28/10: deixa a autoavaliação só com Cumpre e evidência chancelada em cada obrigatório aplicável.';

create or replace function app.abrir_complementar(p_origem uuid)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  novo uuid;
  codigo_origem text;
begin
  if app.perfil_canonico() not in ('admin_ibes', 'backoffice_ibes') then
    raise exception 'somente backoffice e administrador abrem o complementar'
      using errcode = '42501';
  end if;
  select codigo into codigo_origem from projetos where id = p_origem and estado = 'certificado';
  if codigo_origem is null or codigo_origem !~ '^[0-9]{4}/[0-9]{3}$' then
    raise exception 'o complementar nasce de um projeto certificado'
      using errcode = '23514';
  end if;
  insert into projetos (
    organizacao_id, manual_id, nome, estado, codigo, abertura, unidade, tipo_unidade, grupo,
    origem_criacao, tipo, projeto_origem_id, etapa_fluxo, ciclo
  )
  select
    organizacao_id, manual_id, nome, 'diagnostico', codigo || '-C', current_date, unidade, tipo_unidade, grupo,
    'zero', 'complementar', id, 'diagnostico', 'inicial'
  from projetos
  where id = p_origem
  returning id into novo;
  insert into emails_enviados (projeto_id, destinatario, assunto, corpo)
  values (
    novo,
    'Responsável do projeto',
    format('Projeto complementar %s aberto', codigo_origem || '-C'),
    'Aviso registrado nesta base. O envio por SMTP não está ligado.'
  );
  return novo;
end;
$$;

create or replace function app.ler_rodada(p_projeto uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, app
as $$
declare
  resultado jsonb;
begin
  select jsonb_build_object(
    'diagnostico', (
      select jsonb_build_object(
        'projetoId', d.projeto_id,
        'avaliadorId', d.avaliador_id,
        'realizadoEm', d.realizado_em,
        'anexoNome', d.anexo_nome,
        'anexoCaminho', d.anexo_caminho
      )
      from diagnosticos d
      where d.projeto_id = p_projeto
    ),
    'naoAplicaveis', coalesce((
      select jsonb_agg(n.padrao_id) from padroes_nao_aplicaveis n where n.projeto_id = p_projeto
    ), '[]'::jsonb),
    'respostas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'projetoId', r.projeto_id,
        'padraoId', r.padrao_id,
        'ciclo', r.ciclo,
        'atende', r.atende,
        'texto', r.texto,
        'cumpre', r.cumpre
      ))
      from respostas_padrao r
      where r.projeto_id = p_projeto
    ), '[]'::jsonb),
    'evidencias', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'projetoId', e.projeto_id,
        'padraoId', e.padrao_id,
        'descricao', e.descricao,
        'etapa', e.etapa,
        'documentoIds', coalesce((
          select jsonb_agg(ea.documento_id) from evidencias_arquivos ea where ea.evidencia_id = e.id
        ), '[]'::jsonb)
      ))
      from evidencias e
      where e.projeto_id = p_projeto
    ), '[]'::jsonb),
    'areas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'projetoId', a.projeto_id,
        'padraoId', a.padrao_id,
        'texto', a.texto,
        'fase', a.fase,
        'responsavelId', a.responsavel_id,
        'inicio', a.inicio,
        'fim', a.fim
      ))
      from areas_melhoria a
      where a.projeto_id = p_projeto
    ), '[]'::jsonb),
    'emails', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'projetoId', m.projeto_id,
        'destinatario', m.destinatario,
        'assunto', m.assunto,
        'corpo', m.corpo,
        'enviadoEm', m.enviado_em
      ) order by m.created_at desc)
      from emails_enviados m
      where m.projeto_id = p_projeto
    ), '[]'::jsonb),
    'auditoria', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', x.tipo, 'acao', x.acao, 'objeto', coalesce(x.objeto, '')))
      from (
        select tipo, acao, objeto from auditoria order by em desc limit 12
      ) x
    ), '[]'::jsonb),
    'origem', (
      select jsonb_build_object(
        'codigo', o.codigo,
        'evidencias', coalesce((
          select jsonb_agg(jsonb_build_object('id', e.id, 'descricao', e.descricao, 'etapa', e.etapa))
          from evidencias e
          where e.projeto_id = o.id
        ), '[]'::jsonb)
      )
      from projetos o
      where o.id = (select projeto_origem_id from projetos where id = p_projeto)
    )
  ) into resultado;
  return resultado;
end;
$$;

grant execute on function app.aplicaveis(uuid) to app_sessao;
grant execute on function app.salvar_diagnostico(uuid, uuid, date, text, text) to app_sessao;
grant execute on function app.definir_nao_aplicavel(uuid, uuid, boolean) to app_sessao;
grant execute on function app.salvar_resposta(uuid, uuid, text, boolean, text) to app_sessao;
grant execute on function app.enviar_evidencia(uuid, uuid, uuid, text) to app_sessao;
grant execute on function app.vincular_evidencia(uuid, uuid) to app_sessao;
grant execute on function app.transitar_evidencia(uuid, text) to app_sessao;
grant execute on function app.marcar_cumpre(uuid, uuid, text) to app_sessao;
grant execute on function app.criar_area(uuid, uuid, uuid, text) to app_sessao;
grant execute on function app.transitar_area(uuid, text) to app_sessao;
grant execute on function app.avancar_etapa(uuid) to app_sessao;
grant execute on function app.abrir_complementar(uuid) to app_sessao;
grant execute on function app.ler_rodada(uuid) to app_sessao;
