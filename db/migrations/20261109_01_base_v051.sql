-- Beta v0.5.1, seção 0 (09/11/2026). Migração nova: não edita as anteriores.
-- PENDÊNCIA 49: os apelidos responsavel_ibes, gestor_instituicao e
-- profissional_instituicao saem depois da migração dos dados. admin_ibes,
-- avaliador_ibes e membro_comite permanecem: são nomes da matriz de 11.

create or replace function app.perfil_canonico()
returns text
language sql
stable
as $$
  select case app.perfil_atual()
    when 'responsavel_ibes' then 'backoffice_ibes'
    when 'gestor_instituicao' then 'responsavel_projeto'
    when 'profissional_instituicao' then 'conferente'
    else app.perfil_atual()
  end
$$;

comment on function app.perfil_canonico() is
  'PENDÊNCIA 49: apelidos antigos viram o nome da matriz. Remover os apelidos depois da migração.';

create or replace function app.definir_perfil(p_perfil text)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  if p_perfil is not null and p_perfil not in (
    'admin_ibes',
    'backoffice_ibes',
    'responsavel_ibes',
    'educador',
    'tutor_relatorio',
    'membro_comite',
    'avaliador_lider',
    'avaliador_ibes',
    'responsavel_projeto',
    'gestor_instituicao',
    'responsavel_upload',
    'conferente',
    'profissional_instituicao',
    'autorizador'
  ) then
    raise exception 'perfil desconhecido';
  end if;
  perform set_config('app.perfil', coalesce(p_perfil, ''), false);
end;
$$;

create or replace function app.eh_perfil_instituicao()
returns boolean
language sql
stable
as $$
  select app.perfil_canonico() in (
    'responsavel_projeto',
    'responsavel_upload',
    'conferente',
    'autorizador'
  )
$$;

create or replace function app.eh_perfil_ibes()
returns boolean
language sql
stable
as $$
  select app.perfil_canonico() in (
    'admin_ibes',
    'backoffice_ibes',
    'educador',
    'tutor_relatorio',
    'membro_comite',
    'avaliador_lider',
    'avaliador_ibes'
  )
$$;

create or replace function app.pode_chancelar_evidencia()
returns boolean
language sql
stable
as $$
  select app.perfil_canonico() in (
    'admin_ibes',
    'backoffice_ibes',
    'tutor_relatorio',
    'avaliador_ibes',
    'avaliador_lider'
  )
$$;

comment on function app.pode_chancelar_evidencia() is
  'Chancela da evidência: Administrador, Backoffice, Tutor, Avaliador e Avaliador líder. O Comitê aprova só a resolução. O Autorizador confere e não chancela.';

create or replace function app.pode_conferir_evidencia()
returns boolean
language sql
stable
as $$
  select app.perfil_canonico() in (
    'admin_ibes',
    'backoffice_ibes',
    'educador',
    'tutor_relatorio',
    'avaliador_lider',
    'avaliador_ibes',
    'conferente',
    'autorizador'
  )
$$;

create or replace function app.pode_enviar_evidencia()
returns boolean
language sql
stable
as $$
  select app.perfil_canonico() in (
    'admin_ibes',
    'backoffice_ibes',
    'avaliador_lider',
    'avaliador_ibes',
    'responsavel_projeto',
    'responsavel_upload',
    'autorizador'
  )
$$;

create or replace function app.usuario_atual()
returns uuid
language plpgsql
stable
as $$
declare
  bruto text;
begin
  bruto := nullif(current_setting('app.usuario', true), '');
  if bruto is null then
    return null;
  end if;
  begin
    return bruto::uuid;
  exception
    when others then
      return null;
  end;
end;
$$;

create or replace function app.definir_usuario(p_usuario uuid)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  perform set_config('app.usuario', coalesce(p_usuario::text, ''), false);
end;
$$;

alter table usuarios drop constraint if exists usuarios_perfil_check;
alter table usuarios add constraint usuarios_perfil_check check (
  perfil in (
    'admin_ibes',
    'backoffice_ibes',
    'responsavel_ibes',
    'educador',
    'tutor_relatorio',
    'membro_comite',
    'avaliador_lider',
    'avaliador_ibes',
    'responsavel_projeto',
    'gestor_instituicao',
    'responsavel_upload',
    'conferente',
    'profissional_instituicao',
    'autorizador'
  )
);

create or replace function app.registrar_mudanca_estado()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  perfil text := app.perfil_atual();
  motivo text := nullif(current_setting('app.motivo_estado', true), '');
begin
  if tg_op = 'UPDATE' and new.estado is not distinct from old.estado then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.estado in ('recusado', 'abandonado')
     and app.perfil_canonico() not in ('admin_ibes', 'backoffice_ibes') then
    raise exception 'apenas admin_ibes e responsavel_ibes podem alterar o estado para %', new.estado
      using errcode = '42501';
  end if;

  insert into historico_estados (projeto_id, estado_anterior, estado_novo, perfil_ator, motivo)
  values (
    new.id,
    case when tg_op = 'INSERT' then null else old.estado end,
    new.estado,
    perfil,
    motivo
  );

  return new;
end;
$$;

alter table evidencias alter column avaliacao_id drop not null;
alter table evidencias add column etapa text not null default 'enviada'
  check (etapa in ('enviada', 'conferida', 'chancelada'));
alter table evidencias add column created_at timestamptz;
update evidencias set created_at = criada_em where created_at is null;
alter table evidencias alter column created_at set not null;
alter table evidencias alter column created_at set default now();
alter table evidencias add column created_by uuid references usuarios (id);

comment on column evidencias.avaliacao_id is
  'Nulo na autoavaliação, antes de existir avaliação. A evidência pertence ao projeto e ao padrão.';

comment on column evidencias.etapa is
  'enviada, conferida ou chancelada. Não há devolução.';

create table aprovacoes_evidencia (
  id uuid primary key default gen_random_uuid(),
  evidencia_id uuid not null references evidencias (id),
  acao text not null check (acao in ('envio', 'conferencia', 'chancela')),
  usuario_id uuid not null references usuarios (id),
  em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid
);

comment on table aprovacoes_evidencia is
  'Cadeia da evidência. Sem devolução. Chancela só pelos perfis IBES da matriz.';

create table documento_versoes (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documentos (id),
  versao integer not null check (versao >= 1),
  arquivo_path text not null,
  sha256 text not null,
  tamanho_bytes bigint not null check (tamanho_bytes >= 0),
  mime text not null,
  enviado_por uuid references usuarios (id),
  enviado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid,
  unique (documento_id, versao)
);

comment on table documento_versoes is
  'Cada versão guarda o próprio arquivo. evidencias_arquivos continua o N:N com documentos.';

create table resultados_padrao (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references avaliacoes (id),
  padrao_id uuid not null references padroes (id),
  resultado text not null check (
    resultado in ('cumpre', 'nao_cumpre', 'mantem', 'nao_mantem', 'pendente')
  ),
  observacao text,
  created_at timestamptz not null default now(),
  created_by uuid,
  unique (avaliacao_id, padrao_id)
);

comment on table resultados_padrao is
  'Resultado do avaliador. mantem conta como cumpre. pendente não conta. Ausente não é gravado.';

comment on column resultados_padrao.observacao is
  'Achado do avaliador que vai ao relatório.';

insert into resultados_padrao (avaliacao_id, padrao_id, resultado)
select avaliacao_id, padrao_id, case when cumprido then 'cumpre' else 'nao_cumpre' end
from conformidades;

create trigger resultados_sem_nao_aplicavel
before insert or update on resultados_padrao
for each row
execute function app.impede_conformidade_de_nao_aplicavel();

alter table avaliacoes add column resultado text not null default 'em_curso'
  check (resultado in ('em_curso', 'positiva', 'negativa'));
alter table avaliacoes add column data_visita date;
alter table avaliacoes add column lider_id uuid references usuarios (id);
alter table avaliacoes add column resultado_positivo_em timestamptz;

comment on column avaliacoes.resultado_positivo_em is
  'Preenchido quando o resultado passa a positiva.';

create or replace function app.marcar_resultado_positivo()
returns trigger
language plpgsql
as $$
begin
  if new.resultado = 'positiva'
     and (tg_op = 'INSERT' or old.resultado is distinct from 'positiva') then
    new.resultado_positivo_em := coalesce(new.resultado_positivo_em, now());
  elsif new.resultado = 'em_curso' then
    new.resultado_positivo_em := null;
  end if;
  return new;
end;
$$;

create trigger avaliacoes_resultado_positivo
before insert or update of resultado on avaliacoes
for each row
execute function app.marcar_resultado_positivo();

alter table projetos add column projeto_origem_id uuid references projetos (id);
alter table projetos add column tipo text not null default 'inicial'
  check (tipo in ('inicial', 'complementar'));
alter table projetos add column codigo text;

update projetos
   set codigo = '2026/001'
 where id = '22222222-2222-4222-8222-222222222222';

alter table projetos alter column codigo set not null;
alter table projetos add constraint projetos_codigo_unico unique (codigo);
alter table projetos add constraint projetos_codigo_formato
  check (codigo ~ '^[0-9]{4}/[0-9]{3}(-C)?$');
alter table projetos add constraint projetos_tipo_origem check (
  (tipo = 'inicial' and projeto_origem_id is null and codigo !~ '-C$')
  or (tipo = 'complementar' and projeto_origem_id is not null and codigo ~ '-C$')
);

comment on column projetos.tipo is
  'Recertificação abre projeto complementar com código AAAA/NNN-C.';

create table areas_melhoria (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  padrao_id uuid not null references padroes (id),
  texto text not null check (length(btrim(texto)) > 0),
  fase text not null check (
    fase in (
      'detectada',
      'planejada',
      'aguardando_conferencia',
      'aguardando_chancela',
      'concluida'
    )
  ),
  responsavel_id uuid references usuarios (id),
  inicio date,
  fim date,
  conferida_por uuid references usuarios (id),
  conferida_em timestamptz,
  chancelada_por uuid references usuarios (id),
  chancelada_em timestamptz,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid
);

comment on table areas_melhoria is
  'Fases em sequência: detectada, planejada, aguardando_conferencia, aguardando_chancela, concluida.';

create or replace function app.fase_area_sequencia()
returns trigger
language plpgsql
as $$
declare
  ordem text[] := array[
    'detectada',
    'planejada',
    'aguardando_conferencia',
    'aguardando_chancela',
    'concluida'
  ];
  antiga integer;
  nova integer;
begin
  if tg_op = 'INSERT' and new.fase <> 'detectada' then
    raise exception 'área de melhoria nasce na fase detectada'
      using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.fase is distinct from old.fase then
    antiga := array_position(ordem, old.fase);
    nova := array_position(ordem, new.fase);
    if nova is distinct from antiga + 1 then
      raise exception 'fase da área de melhoria não pode pular'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger areas_melhoria_fase
before insert or update of fase on areas_melhoria
for each row
execute function app.fase_area_sequencia();

create table pedidos_upgrade (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  nivel_pedido text not null check (nivel_pedido in ('avancado', 'otimo', 'excelente')),
  created_at timestamptz not null default now(),
  created_by uuid
);

create table certificados (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id),
  nivel text not null check (nivel in ('avancado', 'otimo', 'excelente')),
  emissao date not null,
  validade date not null,
  origem text not null check (origem in ('IBES', 'ACSA_migrado')),
  created_at timestamptz not null default now(),
  created_by uuid
);

comment on column certificados.origem is
  'IBES ou ACSA_migrado.';

create table projeto_membros (
  usuario_id uuid not null references usuarios (id),
  projeto_id uuid not null references projetos (id),
  perfil text not null,
  created_at timestamptz not null default now(),
  created_by uuid,
  primary key (usuario_id, projeto_id)
);

comment on table projeto_membros is
  'Cliente lê e grava só o projeto em que é membro. Perfis IBES leem todos.';

insert into projeto_membros (usuario_id, projeto_id, perfil)
values (
  '66666666-6666-4666-8666-666666666663',
  '22222222-2222-4222-8222-222222222222',
  'responsavel_projeto'
);

insert into usuarios (id, nome, perfil) values
  ('66666666-6666-4666-8666-666666666665', 'Otávio Lima', 'membro_comite'),
  ('66666666-6666-4666-8666-666666666666', 'Helena Duarte', 'membro_comite'),
  ('66666666-6666-4666-8666-666666666667', 'Fernando Lopes', 'autorizador');

insert into evidencias (
  projeto_id, padrao_id, avaliacao_id, descricao, criada_em, etapa, created_by
)
select
  '22222222-2222-4222-8222-222222222222',
  c.padrao_id,
  c.avaliacao_id,
  'Evidência de demonstração da amostra Serra Verde',
  '2026-10-03 16:40:00-03',
  'chancelada',
  '66666666-6666-4666-8666-666666666661'
from conformidades c
where c.avaliacao_id = '44444444-4444-4444-8444-444444444442'
  and c.cumprido;

insert into aprovacoes_evidencia (evidencia_id, acao, usuario_id, em)
select e.id, 'chancela', '66666666-6666-4666-8666-666666666662', e.criada_em
from evidencias e
where e.descricao = 'Evidência de demonstração da amostra Serra Verde';

alter table manuais drop constraint manuais_codigo_operacional;

comment on table manuais is
  'Manual importado. app.calcular_nivel usa a contagem dos padrões deste manual, inclusive ME 2 1_05. O 144 de referencias_estrutura não é denominador.';

create or replace function app.calcular_nivel(p_avaliacao_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, app
as $$
declare
  v_manual text;
  v_manual_id uuid;
  v_oficial boolean;
  v_tipo text;
  v_projeto uuid;
  v_limiar_i integer;
  v_limiar_i_sup integer;
  v_limiar_ii integer;
  v_limiar_ii_exc integer;
  v_limiar_iii integer;
  v_grupos jsonb := '[]'::jsonb;
  v_grupo text;
  v_escopo boolean;
  v_total integer;
  v_excluidos integer;
  v_aplicavel integer;
  v_cumpridos integer;
  v_obr_a integer;
  v_obr_c integer;
  v_imp_a integer;
  v_imp_c integer;
  v_pct integer;
  v_ocultar boolean;
  v_i jsonb;
  v_ii jsonb;
  v_iii jsonb;
  v_avancado boolean;
  v_otimo boolean;
  v_excelente boolean;
  v_nivel text;
begin
  select m.codigo, m.id, m.catalogo_oficial, a.tipo, a.projeto_id
    into v_manual, v_manual_id, v_oficial, v_tipo, v_projeto
  from avaliacoes a
  join projetos p on p.id = a.projeto_id
  join manuais m on m.id = p.manual_id
  where a.id = p_avaliacao_id;

  if v_manual is null then
    raise exception 'avaliação inexistente';
  end if;

  select percentual into v_limiar_i
  from regras_nivel
  where manual_id = v_manual_id and nivel = 'avancado' and grupo = 'I';

  select percentual into v_limiar_i_sup
  from regras_nivel
  where manual_id = v_manual_id and nivel = 'otimo' and grupo = 'I';

  select percentual into v_limiar_ii
  from regras_nivel
  where manual_id = v_manual_id and nivel = 'otimo' and grupo = 'II';

  select percentual into v_limiar_ii_exc
  from regras_nivel
  where manual_id = v_manual_id and nivel = 'excelente' and grupo = 'II';

  select percentual into v_limiar_iii
  from regras_nivel
  where manual_id = v_manual_id and nivel = 'excelente' and grupo = 'III';

  if v_limiar_i is null or v_limiar_i_sup is null or v_limiar_ii is null
     or v_limiar_ii_exc is null or v_limiar_iii is null then
    raise exception 'regras_nivel incompleta para o manual %', v_manual;
  end if;

  v_ocultar := coalesce(app.eh_perfil_instituicao(), false);

  foreach v_grupo in array array['I', 'II', 'III']
  loop
    v_escopo := v_tipo <> 'manutencao' or v_grupo <> 'III';
    v_pct := case v_grupo
      when 'I' then v_limiar_i
      when 'II' then v_limiar_ii
      else v_limiar_iii
    end;

    select
      count(*)::integer,
      count(*) filter (where na.padrao_id is not null)::integer,
      count(*) filter (where na.padrao_id is null)::integer,
      count(*) filter (
        where na.padrao_id is null
          and r.resultado in ('cumpre', 'mantem')
          and exists (
            select 1
            from evidencias e
            where e.projeto_id = v_projeto
              and e.padrao_id = pad.id
              and e.etapa = 'chancelada'
          )
      )::integer,
      count(*) filter (where pad.obrigatorio and na.padrao_id is null)::integer,
      count(*) filter (
        where pad.obrigatorio
          and na.padrao_id is null
          and r.resultado in ('cumpre', 'mantem')
          and exists (
            select 1
            from evidencias e
            where e.projeto_id = v_projeto
              and e.padrao_id = pad.id
              and e.etapa = 'chancelada'
          )
      )::integer,
      count(*) filter (where pad.imprescindivel and na.padrao_id is null)::integer,
      count(*) filter (
        where pad.imprescindivel
          and na.padrao_id is null
          and r.resultado in ('cumpre', 'mantem')
          and exists (
            select 1
            from evidencias e
            where e.projeto_id = v_projeto
              and e.padrao_id = pad.id
              and e.etapa = 'chancelada'
          )
      )::integer
    into v_total, v_excluidos, v_aplicavel, v_cumpridos, v_obr_a, v_obr_c, v_imp_a, v_imp_c
    from padroes pad
    left join padroes_nao_aplicaveis na
      on na.projeto_id = v_projeto and na.padrao_id = pad.id
    left join resultados_padrao r
      on r.avaliacao_id = p_avaliacao_id and r.padrao_id = pad.id
    where pad.manual_id = v_manual_id
      and pad.grupo = v_grupo;

    v_grupos := v_grupos || jsonb_build_array(jsonb_build_object(
      'grupo', v_grupo,
      'no_escopo', v_escopo,
      'total_manual', case when v_ocultar then 'null'::jsonb else to_jsonb(v_total) end,
      'excluidos_nao_aplicaveis', case when v_ocultar then 'null'::jsonb else to_jsonb(v_excluidos) end,
      'total_aplicavel', v_aplicavel,
      'cumpridos', v_cumpridos,
      'minimo_percentual', case when v_escopo then to_jsonb(v_pct) else 'null'::jsonb end,
      'minimo_cumpridos', case
        when v_escopo then to_jsonb(app.minimo_cumpridos(v_aplicavel, v_pct))
        else 'null'::jsonb
      end,
      'obrigatorios_aplicaveis', v_obr_a,
      'obrigatorios_cumpridos', v_obr_c,
      'imprescindiveis_aplicaveis', v_imp_a,
      'imprescindiveis_cumpridos', v_imp_c
    ));
  end loop;

  select elemento into v_i from jsonb_array_elements(v_grupos) elemento where elemento->>'grupo' = 'I';
  select elemento into v_ii from jsonb_array_elements(v_grupos) elemento where elemento->>'grupo' = 'II';
  select elemento into v_iii from jsonb_array_elements(v_grupos) elemento where elemento->>'grupo' = 'III';

  v_avancado :=
    (v_i->>'no_escopo')::boolean
    and (v_i->>'cumpridos')::integer >= app.minimo_cumpridos((v_i->>'total_aplicavel')::integer, v_limiar_i)
    and (v_i->>'obrigatorios_cumpridos')::integer = (v_i->>'obrigatorios_aplicaveis')::integer;

  v_otimo :=
    (v_i->>'no_escopo')::boolean
    and (v_ii->>'no_escopo')::boolean
    and (v_i->>'cumpridos')::integer >= app.minimo_cumpridos((v_i->>'total_aplicavel')::integer, v_limiar_i_sup)
    and (v_ii->>'cumpridos')::integer >= app.minimo_cumpridos((v_ii->>'total_aplicavel')::integer, v_limiar_ii)
    and (v_i->>'obrigatorios_cumpridos')::integer = (v_i->>'obrigatorios_aplicaveis')::integer
    and (v_ii->>'imprescindiveis_cumpridos')::integer = (v_ii->>'imprescindiveis_aplicaveis')::integer;

  v_excelente :=
    v_tipo <> 'manutencao'
    and (v_iii->>'no_escopo')::boolean
    and (v_i->>'cumpridos')::integer >= app.minimo_cumpridos((v_i->>'total_aplicavel')::integer, v_limiar_i_sup)
    and (v_ii->>'cumpridos')::integer >= app.minimo_cumpridos((v_ii->>'total_aplicavel')::integer, v_limiar_ii_exc)
    and (v_iii->>'cumpridos')::integer >= app.minimo_cumpridos((v_iii->>'total_aplicavel')::integer, v_limiar_iii)
    and (v_i->>'obrigatorios_cumpridos')::integer = (v_i->>'obrigatorios_aplicaveis')::integer
    and (v_ii->>'imprescindiveis_cumpridos')::integer = (v_ii->>'imprescindiveis_aplicaveis')::integer;

  v_nivel := case
    when v_excelente then 'excelente'
    when v_otimo then 'otimo'
    when v_avancado then 'avancado'
    else null
  end;

  return jsonb_build_object(
    'manual', v_manual,
    'tipo', v_tipo,
    'nivel', case when v_nivel is null then 'null'::jsonb else to_jsonb(v_nivel) end,
    'grupos', v_grupos,
    'catalogo_contado', (select count(*) from padroes where manual_id = v_manual_id),
    'catalogo_oficial', v_oficial,
    'referencia_estrutura', (
      select jsonb_build_object('manual', manual, 'padroes', padroes_citados, 'uso', uso)
      from referencias_estrutura
      where manual = 'ME 2 1_05'
    )
  );
end;
$$;

comment on function app.calcular_nivel(uuid) is
  'Lê regras_nivel do manual do projeto. cumpre e mantem contam só com evidência chancelada. pendente não conta. Ausente é a ausência de evidência e não é gravado. Manutenção ignora o Grupo III.';

create or replace function app.estado_evidencia(p_projeto uuid, p_padrao uuid)
returns text
language sql
stable
as $$
  select case
    when exists (
      select 1 from padroes_nao_aplicaveis
      where projeto_id = p_projeto and padrao_id = p_padrao
    ) then 'nao_aplicavel'
    when not exists (
      select 1 from evidencias
      where projeto_id = p_projeto and padrao_id = p_padrao
    ) then 'ausente'
    when exists (
      select 1 from evidencias
      where projeto_id = p_projeto and padrao_id = p_padrao and etapa = 'chancelada'
    ) then 'chancelada'
    else 'pendente'
  end
$$;

comment on function app.estado_evidencia(uuid, uuid) is
  'Ausente: padrão aplicável sem nenhuma evidência. Pendente: evidência enviada ou conferida, sem chancela. Nenhum dos dois entra no numerador.';

create or replace function app.exige_consenso()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
declare
  votos integer;
  distintos integer;
begin
  select count(*), count(distinct voto)
    into votos, distintos
  from pareceres_comite
  where avaliacao_id = new.avaliacao_id;

  if votos < 3 or distintos <> 1 then
    raise exception 'Sem consenso'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger resolucoes_exigem_consenso
before insert on resolucoes_comite
for each row
execute function app.exige_consenso();

comment on function app.exige_consenso() is
  'A resolução só entra com 3 pareceres do mesmo voto. Pendência 34: o que acontece quando divergem.';

do $$
declare
  tabela text;
begin
  for tabela in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format(
      'alter table %I add column if not exists created_at timestamptz not null default now()',
      tabela
    );
    execute format(
      'alter table %I add column if not exists created_by uuid',
      tabela
    );
  end loop;
end $$;

create or replace function app.auditar()
returns trigger
language plpgsql
security definer
set search_path = public, app
as $$
begin
  insert into auditoria (usuario_id, perfil, tipo, acao, objeto)
  values (
    app.usuario_atual(),
    coalesce(nullif(app.perfil_atual(), ''), 'sistema'),
    tg_table_name,
    lower(tg_op),
    tg_table_name
  );
  return coalesce(new, old);
end;
$$;

comment on function app.auditar() is
  'Uma linha por ação. Não roda em auditoria nem nas tabelas stg_*. A importação grava uma linha por lote.';

do $$
declare
  tabela text;
begin
  for tabela in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename <> 'auditoria'
      and tablename not like 'stg_%'
  loop
    execute format('drop trigger if exists %I on %I', tabela || '_auditar', tabela);
    execute format(
      'create trigger %I after insert or update or delete on %I for each row execute function app.auditar()',
      tabela || '_auditar',
      tabela
    );
  end loop;
end $$;

create or replace function app.registrar_auditoria_lote(p_lote uuid, p_contagem integer)
returns void
language plpgsql
security definer
set search_path = public, app
as $$
begin
  insert into auditoria (usuario_id, perfil, tipo, acao, objeto)
  values (
    app.usuario_atual(),
    coalesce(nullif(app.perfil_atual(), ''), 'sistema'),
    'importacao',
    'lote',
    format('lote %s contagem %s', p_lote, p_contagem)
  );
end;
$$;

comment on function app.registrar_auditoria_lote(uuid, integer) is
  'A importação grava uma linha de auditoria por lote, com a contagem. As tabelas stg_* não disparam app.auditar().';

drop policy if exists projetos_leitura on projetos;
drop policy if exists projetos_atualizacao on projetos;
drop policy if exists projetos_insercao on projetos;

create policy projetos_leitura
on projetos
for select
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = projetos.id
      and m.usuario_id = app.usuario_atual()
  )
);

create policy projetos_atualizacao
on projetos
for update
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = projetos.id
      and m.usuario_id = app.usuario_atual()
  )
)
with check (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = projetos.id
      and m.usuario_id = app.usuario_atual()
  )
);

create policy projetos_insercao
on projetos
for insert
to app_sessao
with check (app.perfil_canonico() in ('admin_ibes', 'backoffice_ibes'));

alter table evidencias enable row level security;
alter table evidencias force row level security;

create policy evidencias_leitura
on evidencias
for select
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = evidencias.projeto_id
      and m.usuario_id = app.usuario_atual()
  )
);

create policy evidencias_exclusao
on evidencias
for delete
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = evidencias.projeto_id
      and m.usuario_id = app.usuario_atual()
  )
);

create policy evidencias_insercao
on evidencias
for insert
to app_sessao
with check (
  app.pode_enviar_evidencia()
  and (
    app.eh_perfil_ibes()
    or exists (
      select 1 from projeto_membros m
      where m.projeto_id = evidencias.projeto_id
        and m.usuario_id = app.usuario_atual()
    )
  )
);

alter table documentos enable row level security;
alter table documentos force row level security;

create policy documentos_leitura
on documentos
for select
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1 from projeto_membros m
    where m.projeto_id = documentos.projeto_id
      and m.usuario_id = app.usuario_atual()
  )
);

alter table resultados_padrao enable row level security;
alter table resultados_padrao force row level security;

create policy resultados_leitura
on resultados_padrao
for select
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1
    from avaliacoes a
    join projeto_membros m on m.projeto_id = a.projeto_id
    where a.id = resultados_padrao.avaliacao_id
      and m.usuario_id = app.usuario_atual()
  )
);

alter table aprovacoes_evidencia enable row level security;
alter table aprovacoes_evidencia force row level security;

create policy aprovacoes_leitura
on aprovacoes_evidencia
for select
to app_sessao
using (
  app.eh_perfil_ibes()
  or exists (
    select 1
    from evidencias e
    join projeto_membros m on m.projeto_id = e.projeto_id
    where e.id = aprovacoes_evidencia.evidencia_id
      and m.usuario_id = app.usuario_atual()
  )
);

create policy aprovacoes_insercao
on aprovacoes_evidencia
for insert
to app_sessao
with check (
  (acao = 'chancela' and app.pode_chancelar_evidencia())
  or (acao = 'conferencia' and app.pode_conferir_evidencia())
  or (acao = 'envio' and app.pode_enviar_evidencia())
);

grant select, insert, update, delete on
  aprovacoes_evidencia,
  documento_versoes,
  resultados_padrao,
  areas_melhoria,
  pedidos_upgrade,
  certificados,
  projeto_membros
to app_sessao;

grant execute on function app.perfil_canonico() to app_sessao;
grant execute on function app.eh_perfil_ibes() to app_sessao;
grant execute on function app.pode_chancelar_evidencia() to app_sessao;
grant execute on function app.pode_conferir_evidencia() to app_sessao;
grant execute on function app.pode_enviar_evidencia() to app_sessao;
grant execute on function app.usuario_atual() to app_sessao;
grant execute on function app.definir_usuario(uuid) to app_sessao;
grant execute on function app.fase_area_sequencia() to app_sessao;
grant execute on function app.estado_evidencia(uuid, uuid) to app_sessao;
grant execute on function app.exige_consenso() to app_sessao;
grant execute on function app.auditar() to app_sessao;
grant execute on function app.registrar_auditoria_lote(uuid, integer) to app_sessao;
