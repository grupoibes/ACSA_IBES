-- Rodada 2b. Não altera as migrações anteriores.
-- PENDÊNCIA 51: a restrição continua depois da visita? Hoje vai de 5 semanas antes até o dia da visita, inclusive.
-- PENDÊNCIA 52: 40 usuários é limite rígido ou volume esperado? Hoje é configuração e não bloqueia.

create table app_config (
  chave text primary key,
  valor integer not null
);

insert into app_config (chave, valor) values
  ('restricao_semanas_antes', 5),
  ('restricao_semanas_depois', 0);

comment on table app_config is
  'PENDÊNCIA 51: semanas antes e depois da visita. Padrão 5 e 0. A restrição inclui os dois extremos e, com 0 depois, termina no dia da visita.';

alter table organizacoes add column limite_usuarios integer not null default 40;
comment on column organizacoes.limite_usuarios is
  'PENDÊNCIA 52: volume configurado por organização. O cadastro não é bloqueado ao passar.';

alter table usuarios add column email text;
alter table usuarios add column ativo boolean not null default true;

create table pontos_avaliacao (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references avaliacoes (id),
  tipo text not null check (tipo in ('forte', 'fraco')),
  texto text not null check (length(btrim(texto)) > 0),
  avaliador_id uuid,
  consolidado boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid
);

comment on table pontos_avaliacao is
  'Pontos fortes e fracos. O avaliador registra. Só o consolidado pelo avaliador líder entra no relatório.';

create trigger pontos_avaliacao_auditar
after insert or update or delete on pontos_avaliacao
for each row
execute function app.auditar();

alter table pareceres_comite add column nivel_proposto text
  check (nivel_proposto is null or nivel_proposto in ('avancado', 'otimo', 'excelente'));
alter table pareceres_comite add column sem_conflito boolean not null default false;
comment on column pareceres_comite.sem_conflito is
  'A tela e app.registrar_parecer exigem a declaração. O vocabulário do voto continua aberto.';

alter table resolucoes_comite add column justificativa text not null default '';
alter table resolucoes_comite add column numero text;

alter table pedidos_upgrade add column motivo text not null default '';
alter table pedidos_upgrade add column situacao text not null default 'recebida'
  check (situacao in ('recebida', 'incluida'));

create or replace function app.semanas_restricao()
returns table (antes integer, depois integer)
language sql
stable
as $$
  select
    (select valor from app_config where chave = 'restricao_semanas_antes'),
    (select valor from app_config where chave = 'restricao_semanas_depois')
$$;

create or replace function app.janela_visita(p_data date)
returns table (inicio date, fim date)
language sql
stable
as $$
  select
    p_data - (select antes from app.semanas_restricao()) * 7,
    p_data + (select depois from app.semanas_restricao()) * 7
$$;

create or replace function app.cliente_na_restricao(p_hoje date, p_visita date, p_perfil text)
returns boolean
language plpgsql
stable
as $$
declare
  inicio date;
  fim date;
begin
  if p_visita is null then
    return false;
  end if;
  if p_perfil in (
    'admin_ibes', 'backoffice_ibes', 'responsavel_ibes', 'educador',
    'tutor_relatorio', 'membro_comite', 'avaliador_lider', 'avaliador_ibes'
  ) then
    return false;
  end if;
  select j.inicio, j.fim into inicio, fim from app.janela_visita(p_visita) j;
  return p_hoje >= inicio and p_hoje <= fim;
end;
$$;

create or replace function app.cadastrar_usuario(
  p_org uuid,
  p_nome text,
  p_email text,
  p_perfil text
)
returns text
language plpgsql
security definer
set search_path = public, app
as $$
declare
  limite integer;
  ativos integer;
  canonico text := app.perfil_canonico();
begin
  if canonico not in ('responsavel_projeto', 'backoffice_ibes', 'admin_ibes') then
    raise exception 'Sem permissão para cadastrar usuário'
      using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_nome, ''))) = 0 or length(btrim(coalesce(p_email, ''))) = 0 then
    raise exception 'Informe nome, e-mail e perfil'
      using errcode = '23514';
  end if;
  insert into usuarios (organizacao_id, nome, email, perfil, ativo)
  values (p_org, btrim(p_nome), btrim(p_email), p_perfil, true);
  select limite_usuarios into limite from organizacoes where id = p_org;
  select count(*) into ativos
  from usuarios
  where organizacao_id = p_org
    and ativo
    and perfil in (
      'responsavel_projeto', 'gestor_instituicao', 'responsavel_upload',
      'conferente', 'profissional_instituicao', 'autorizador'
    );
  if ativos > limite and canonico in ('backoffice_ibes', 'admin_ibes') then
    return format(
      'A organização passou de %s usuários ativos e está com %s. O cadastro segue aberto.',
      limite,
      ativos
    );
  end if;
  return null;
end;
$$;

create or replace function app.registrar_parecer(
  p_projeto uuid,
  p_avaliacao uuid,
  p_voto text,
  p_nivel text,
  p_texto text,
  p_sem_conflito boolean
)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if app.perfil_canonico() <> 'membro_comite' then
    raise exception 'Somente membro do comitê registra parecer'
      using errcode = '42501';
  end if;
  if p_sem_conflito is distinct from true then
    raise exception 'A declaração de ausência de conflito é obrigatória'
      using errcode = '23514';
  end if;
  if length(btrim(coalesce(p_texto, ''))) = 0 then
    raise exception 'Escreva o parecer'
      using errcode = '23514';
  end if;
  insert into pareceres_comite (
    projeto_id, avaliacao_id, membro, parecer, voto, data, nivel_proposto, sem_conflito
  ) values (
    p_projeto, p_avaliacao, app.usuario_atual(), btrim(p_texto), btrim(p_voto), current_date, p_nivel, true
  )
  on conflict (avaliacao_id, membro) do update
    set parecer = excluded.parecer,
        voto = excluded.voto,
        nivel_proposto = excluded.nivel_proposto,
        sem_conflito = true,
        data = current_date;
end;
$$;

alter table pareceres_comite drop constraint if exists pareceres_comite_avaliacao_membro;
alter table pareceres_comite add constraint pareceres_comite_avaliacao_membro unique (avaliacao_id, membro);

create or replace function app.registrar_resolucao(
  p_projeto uuid,
  p_avaliacao uuid,
  p_numero text,
  p_nivel text,
  p_nivel_calculado text,
  p_justificativa text
)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
declare
  positivo date;
  voto text;
begin
  if app.perfil_canonico() <> 'membro_comite' then
    raise exception 'Somente membro do comitê registra a resolução'
      using errcode = '42501';
  end if;
  select resultado_positivo_em::date into positivo from avaliacoes where id = p_avaliacao;
  if positivo is not null and current_date > positivo + 30 then
    raise exception 'O prazo de 30 dias do comitê venceu'
      using errcode = '23514';
  end if;
  if p_nivel is distinct from p_nivel_calculado and length(btrim(coalesce(p_justificativa, ''))) = 0 then
    raise exception 'A justificativa é obrigatória quando o nível final difere do calculado'
      using errcode = '23514';
  end if;
  select p.voto into voto
  from pareceres_comite p
  where p.avaliacao_id = p_avaliacao
  limit 1;
  insert into resolucoes_comite (
    projeto_id, avaliacao_id, decisao, pontuacao, nivel_concedido, data, documento, registrado_por, justificativa, numero
  ) values (
    p_projeto,
    p_avaliacao,
    coalesce(voto, 'conceder'),
    0,
    case when voto = 'conceder' then p_nivel else null end,
    current_date,
    btrim(p_numero),
    app.usuario_atual(),
    coalesce(p_justificativa, ''),
    btrim(p_numero)
  );
end;
$$;

create or replace function app.texto_relatorio(p_avaliacao uuid)
returns text
language sql
stable
as $$
  select concat_ws(
    E'\n',
    'Relatório de avaliação',
    'Pontos consolidados',
    coalesce((
      select string_agg(texto, ' ' order by created_at)
      from pontos_avaliacao
      where avaliacao_id = p_avaliacao and consolidado and tipo = 'forte'
    ), 'nenhum'),
    'Texto de demonstração. Nenhum enunciado de manual entra neste relatório.'
  )
$$;

create or replace function app.aplicar_segunda(p_projeto uuid, p_comando jsonb)
returns text
language plpgsql
security definer
set search_path = public, app
as $$
declare
  tipo text := p_comando->>'tipo';
  avaliacao uuid;
  aviso text;
  organizacao uuid;
  canonico text := app.perfil_canonico();
begin
  select id into avaliacao from avaliacoes where projeto_id = p_projeto order by rodada desc limit 1;
  if avaliacao is null then
    insert into avaliacoes (projeto_id, rodada, tipo) values (p_projeto, 1, 'certificacao') returning id into avaliacao;
  end if;

  if tipo = 'agendar' then
    if canonico not in ('backoffice_ibes', 'admin_ibes') then
      raise exception 'Somente backoffice e administrador agendam a visita' using errcode = '42501';
    end if;
    update avaliacoes
       set data_visita = (p_comando->>'dataVisita')::date,
           tipo = coalesce(nullif(p_comando->>'tipoAvaliacao', ''), avaliacoes.tipo)
     where id = avaliacao;
    return null;
  elsif tipo = 'resultado' then
    if canonico not in ('avaliador_ibes', 'avaliador_lider') then
      raise exception 'Somente avaliador e avaliador líder registram o resultado' using errcode = '42501';
    end if;
    insert into resultados_padrao (avaliacao_id, padrao_id, resultado, observacao, created_by)
    values (avaliacao, (p_comando->>'padraoId')::uuid, p_comando->>'resultado', p_comando->>'observacao', app.usuario_atual())
    on conflict (avaliacao_id, padrao_id) do update
      set resultado = excluded.resultado, observacao = excluded.observacao;
    return null;
  elsif tipo = 'ponto' then
    if canonico not in ('avaliador_ibes', 'avaliador_lider') then
      raise exception 'Somente avaliador e avaliador líder registram pontos' using errcode = '42501';
    end if;
    insert into pontos_avaliacao (avaliacao_id, tipo, texto, avaliador_id, consolidado, created_by)
    values (avaliacao, p_comando->>'tipoPonto', p_comando->>'texto', app.usuario_atual(), false, app.usuario_atual());
    return null;
  elsif tipo = 'consolidar' then
    if canonico <> 'avaliador_lider' then
      raise exception 'Somente o avaliador líder consolida os pontos' using errcode = '42501';
    end if;
    update pontos_avaliacao set consolidado = true where avaliacao_id = avaliacao;
    return null;
  elsif tipo = 'rodada' then
    if canonico <> 'avaliador_lider' then
      raise exception 'Somente o avaliador líder define o resultado da rodada' using errcode = '42501';
    end if;
    update avaliacoes set resultado = p_comando->>'resultadoRodada' where id = avaliacao;
    return null;
  elsif tipo = 'parecer' then
    perform app.registrar_parecer(
      p_projeto, avaliacao, p_comando->>'voto', p_comando->>'nivel', p_comando->>'texto', (p_comando->>'semConflito')::boolean
    );
    return null;
  elsif tipo = 'resolucao' then
    perform app.registrar_resolucao(
      p_projeto, avaliacao, p_comando->>'numero', p_comando->>'nivelFinal', p_comando->>'nivelCalculado', p_comando->>'justificativa'
    );
    return null;
  elsif tipo = 'upgrade' then
    if canonico <> 'responsavel_projeto' then
      raise exception 'Só o Responsável do projeto solicita upgrade' using errcode = '42501';
    end if;
    insert into pedidos_upgrade (projeto_id, nivel_pedido, motivo, situacao, created_by)
    values (p_projeto, p_comando->>'nivel', p_comando->>'motivo', 'recebida', app.usuario_atual());
    return null;
  elsif tipo = 'incluir-upgrade' then
    if canonico not in ('backoffice_ibes', 'admin_ibes') then
      raise exception 'Somente backoffice e administrador incluem o upgrade' using errcode = '42501';
    end if;
    update pedidos_upgrade set situacao = 'incluida' where id = (p_comando->>'upgradeId')::uuid and projeto_id = p_projeto;
    return null;
  elsif tipo = 'usuario' then
    select organizacao_id into organizacao from projetos where id = p_projeto;
    return app.cadastrar_usuario(organizacao, p_comando->>'nome', p_comando->>'email', p_comando->>'perfil');
  end if;
  raise exception 'Ação desconhecida' using errcode = '23514';
end;
$$;

create or replace function app.ler_segunda(p_projeto uuid, p_hoje date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, app
as $$
declare
  avaliacao uuid;
  visita date;
  inicio date;
  fim date;
  relatorio text;
begin
  select id, data_visita into avaliacao, visita
  from avaliacoes where projeto_id = p_projeto order by rodada desc limit 1;
  if visita is not null then
    select j.inicio, j.fim into inicio, fim from app.janela_visita(visita) j;
  end if;
  relatorio := case when avaliacao is null then 'Relatório de avaliação' else app.texto_relatorio(avaliacao) end;
  return jsonb_build_object(
    'semanasAntes', (select antes from app.semanas_restricao()),
    'semanasDepois', (select depois from app.semanas_restricao()),
    'restricao', case when visita is null then null else jsonb_build_object('inicio', inicio, 'fim', fim, 'ativa', app.cliente_na_restricao(p_hoje, visita, 'gestor_instituicao')) end,
    'avaliacao', (select to_jsonb(a) from avaliacoes a where a.id = avaliacao),
    'resultados', '[]'::jsonb,
    'requisitos', case when app.eh_perfil_ibes() then coalesce((
      select jsonb_agg(jsonb_build_object('padraoId', r.padrao_id, 'ordem', r.ordem, 'texto', r.texto, 'provas', coalesce((
        select jsonb_agg(v.nome) from requisitos_provas rp join provas v on v.id = rp.prova_id where rp.requisito_id = r.id
      ), '[]'::jsonb)))
      from requisitos_avaliacao r
      join padroes p on p.id = r.padrao_id
      join projetos pr on pr.manual_id = p.manual_id and pr.id = p_projeto
    ), '[]'::jsonb) else '[]'::jsonb end,
    'pontos', coalesce((select jsonb_agg(to_jsonb(p)) from pontos_avaliacao p where p.avaliacao_id = avaliacao and (app.eh_perfil_ibes() or p.consolidado)), '[]'::jsonb),
    'pareceres', '[]'::jsonb,
    'resolucao', null,
    'bloqueioResolucao', null,
    'prazoComite', null,
    'prazoComiteVencido', false,
    'nivelCalculado', 'Abaixo de Avançado',
    'upgrades', coalesce((select jsonb_agg(to_jsonb(u)) from pedidos_upgrade u where u.projeto_id = p_projeto), '[]'::jsonb),
    'usuarios', '[]'::jsonb,
    'limiteUsuarios', 40,
    'ativos', 0,
    'avisoLimite', null,
    'relatorio', relatorio,
    'indicadores', '[]'::jsonb,
    'log', '[]'::jsonb,
    'migracao', jsonb_build_object(
      'manuais', jsonb_build_array(
        jsonb_build_object('codigo', 'ME 2 1_05', 'nome', 'Centros hospitalares', 'padroes', 144),
        jsonb_build_object('codigo', 'ME 5 1_07', 'nome', 'Unidades de gestão clínica', 'padroes', 159),
        jsonb_build_object('codigo', 'ME 28 1_01', 'nome', 'Centros sem internação', 'padroes', 118)
      ),
      'inventario', 72,
      'etapas', jsonb_build_array(
        jsonb_build_object('nome', 'Manuais contados', 'situacao', 'Concluído'),
        jsonb_build_object('nome', 'Inventário de projetos', 'situacao', 'Concluído'),
        jsonb_build_object('nome', 'Exportação formal', 'situacao', 'Em negociação'),
        jsonb_build_object('nome', 'Anexos da exportação', 'situacao', 'A fazer')
      ),
      'staging', case when app.eh_perfil_ibes() then coalesce((
        select jsonb_agg(jsonb_build_object(
          'codigo', s.codigo,
          'instituicao', s.payload->>'instituicao',
          'documentos', (select count(*) from stg_documentos d where d.idpry_acsa = s.idpry_acsa),
          'vinculos', (select count(*) from stg_doc_vinculos v join stg_documentos d on d.id_fichero_acsa = v.id_fichero_acsa where d.idpry_acsa = s.idpry_acsa)
        ))
        from stg_projetos s
      ), '[]'::jsonb) else '[]'::jsonb end,
      'restrita', not app.eh_perfil_ibes()
    ),
    'pode', jsonb_build_object(
      'agendar', canonico_ibes_agendar(),
      'resultado', app.perfil_canonico() in ('avaliador_ibes', 'avaliador_lider'),
      'consolidar', app.perfil_canonico() = 'avaliador_lider',
      'parecer', app.perfil_canonico() = 'membro_comite',
      'upgrade', app.perfil_canonico() = 'responsavel_projeto',
      'incluir', app.perfil_canonico() in ('backoffice_ibes', 'admin_ibes'),
      'cadastrar', app.perfil_canonico() in ('responsavel_projeto', 'backoffice_ibes', 'admin_ibes'),
      'verRequisitos', app.eh_perfil_ibes()
    )
  );
end;
$$;

create or replace function canonico_ibes_agendar()
returns boolean
language sql
stable
as $$
  select app.perfil_canonico() in ('backoffice_ibes', 'admin_ibes')
$$;

create policy requisitos_avaliacao_leitura_todo_ibes
on requisitos_avaliacao
for select
to app_sessao
using (app.eh_perfil_ibes());

create policy requisitos_provas_leitura_todo_ibes
on requisitos_provas
for select
to app_sessao
using (app.eh_perfil_ibes());

alter table pontos_avaliacao enable row level security;
alter table pontos_avaliacao force row level security;
create policy pontos_leitura_ibes on pontos_avaliacao for select to app_sessao using (app.eh_perfil_ibes());
create policy pontos_escrita_ibes on pontos_avaliacao for all to app_sessao using (app.eh_perfil_ibes()) with check (app.eh_perfil_ibes());

grant select, insert, update, delete on app_config, pontos_avaliacao to app_sessao;
grant execute on function app.semanas_restricao() to app_sessao;
grant execute on function app.janela_visita(date) to app_sessao;
grant execute on function app.cliente_na_restricao(date, date, text) to app_sessao;
grant execute on function app.cadastrar_usuario(uuid, text, text, text) to app_sessao;
grant execute on function app.registrar_parecer(uuid, uuid, text, text, text, boolean) to app_sessao;
grant execute on function app.registrar_resolucao(uuid, uuid, text, text, text, text) to app_sessao;
grant execute on function app.texto_relatorio(uuid) to app_sessao;
grant execute on function app.aplicar_segunda(uuid, jsonb) to app_sessao;
grant execute on function app.ler_segunda(uuid, date) to app_sessao;
grant execute on function canonico_ibes_agendar() to app_sessao;
