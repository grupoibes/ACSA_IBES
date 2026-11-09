-- Seção 0 do Beta v0.5.1. Roda depois de decisoes.sql.

reset role;
select app.definir_perfil('admin_ibes');

do $$
declare
  evidencia uuid;
  antes integer;
  depois integer;
begin
  insert into evidencias (projeto_id, padrao_id, avaliacao_id, descricao, etapa)
  values (
    '22222222-2222-4222-8222-222222222222',
    '55555555-5555-4555-8555-555555555511',
    null,
    'Evidência da autoavaliação, antes da visita.',
    'enviada'
  )
  returning id into evidencia;

  if evidencia is null then
    raise exception 'evidência sem avaliação não foi gravada';
  end if;

  begin
    insert into aprovacoes_evidencia (evidencia_id, acao, usuario_id)
    values (evidencia, 'devolucao', '66666666-6666-4666-8666-666666666662');
    raise exception 'devolucao_gravada';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'devolucao_gravada' then
        raise exception 'devolução foi aceita na cadeia';
      end if;
      raise;
  end;

  if app.estado_evidencia(
    '22222222-2222-4222-8222-222222222222',
    '55555555-5555-4555-8555-555555555508'
  ) <> 'ausente' then
    raise exception 'padrão sem evidência deveria ser ausente';
  end if;

  if app.estado_evidencia(
    '22222222-2222-4222-8222-222222222222',
    '55555555-5555-4555-8555-555555555511'
  ) <> 'pendente' then
    raise exception 'evidência enviada deveria ser pendente';
  end if;

  select (elemento->>'cumpridos')::integer into antes
  from jsonb_array_elements(app.calcular_nivel('44444444-4444-4444-8444-444444444442')->'grupos') elemento
  where elemento->>'grupo' = 'III';

  update evidencias set etapa = 'conferida' where id = evidencia;

  select (elemento->>'cumpridos')::integer into depois
  from jsonb_array_elements(app.calcular_nivel('44444444-4444-4444-8444-444444444442')->'grupos') elemento
  where elemento->>'grupo' = 'III';

  if antes is distinct from depois then
    raise exception 'pendente entrou no numerador (% → %)', antes, depois;
  end if;
end $$;

do $$
declare
  doc uuid;
begin
  insert into documentos (projeto_id, nome)
  values ('22222222-2222-4222-8222-222222222222', 'POP de demonstração')
  returning id into doc;

  insert into documento_versoes (documento_id, versao, arquivo_path, sha256, tamanho_bytes, mime)
  values
    (doc, 1, 'projeto/serra/documentos/v1/pop.pdf', repeat('a', 64), 1200, 'application/pdf'),
    (doc, 2, 'projeto/serra/documentos/v2/pop.pdf', repeat('b', 64), 1300, 'application/pdf');

  if (select count(*) from documento_versoes where documento_id = doc) <> 2 then
    raise exception 'versão nova não conservou a anterior';
  end if;

  if not exists (
    select 1
    from evidencias_arquivos ea
    join documentos d on d.id = ea.documento_id
  ) and not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name
    where tc.table_name = 'evidencias_arquivos'
      and kcu.column_name = 'documento_id'
      and tc.constraint_type = 'FOREIGN KEY'
  ) then
    raise exception 'evidencias_arquivos não aponta para documentos';
  end if;
end $$;

do $$
declare
  observacao text;
begin
  update resultados_padrao
     set observacao = 'Achado de demonstração para o relatório.'
   where avaliacao_id = '44444444-4444-4444-8444-444444444442'
     and padrao_id = '55555555-5555-4555-8555-555555555501';

  select r.observacao into observacao
  from resultados_padrao r
  where r.avaliacao_id = '44444444-4444-4444-8444-444444444442'
    and r.padrao_id = '55555555-5555-4555-8555-555555555501';

  if observacao <> 'Achado de demonstração para o relatório.' then
    raise exception 'observação do avaliador não ficou em resultados_padrao';
  end if;
end $$;

do $$
declare
  quando timestamptz;
begin
  update avaliacoes
     set resultado = 'em_curso'
   where id = '44444444-4444-4444-8444-444444444442';

  select resultado_positivo_em into quando
  from avaliacoes
  where id = '44444444-4444-4444-8444-444444444442';

  if quando is not null then
    raise exception 'em curso preencheu resultado_positivo_em';
  end if;

  update avaliacoes
     set resultado = 'positiva'
   where id = '44444444-4444-4444-8444-444444444442';

  select resultado_positivo_em into quando
  from avaliacoes
  where id = '44444444-4444-4444-8444-444444444442';

  if quando is null then
    raise exception 'positiva não preencheu resultado_positivo_em';
  end if;

  update avaliacoes
     set resultado = 'em_curso'
   where id = '44444444-4444-4444-8444-444444444442';
end $$;

do $$
declare
  nivel text;
  grupo_iii jsonb;
  grupo_ii jsonb;
begin
  update avaliacoes
     set tipo = 'manutencao'
   where id = '44444444-4444-4444-8444-444444444442';

  update resultados_padrao
     set resultado = 'mantem'
   where avaliacao_id = '44444444-4444-4444-8444-444444444442'
     and resultado = 'cumpre';

  nivel := app.calcular_nivel('44444444-4444-4444-8444-444444444442')->>'nivel';
  if nivel <> 'otimo' then
    raise exception 'manutenção com mantem deveria ficar otimo, veio %', nivel;
  end if;

  select elemento into grupo_iii
  from jsonb_array_elements(app.calcular_nivel('44444444-4444-4444-8444-444444444442')->'grupos') elemento
  where elemento->>'grupo' = 'III';

  if (grupo_iii->>'no_escopo')::boolean then
    raise exception 'Grupo III entrou na manutenção';
  end if;

  update resultados_padrao
     set resultado = 'pendente'
   where avaliacao_id = '44444444-4444-4444-8444-444444444442'
     and padrao_id = '55555555-5555-4555-8555-555555555501';

  nivel := app.calcular_nivel('44444444-4444-4444-8444-444444444442')->>'nivel';
  if nivel = 'otimo' or nivel = 'excelente' then
    raise exception 'pendente contou no numerador e sustentou %', nivel;
  end if;

  update resultados_padrao
     set resultado = 'mantem'
   where avaliacao_id = '44444444-4444-4444-8444-444444444442'
     and padrao_id = '55555555-5555-4555-8555-555555555501';

  update resultados_padrao
     set resultado = 'nao_mantem'
   where avaliacao_id = '44444444-4444-4444-8444-444444444442'
     and padrao_id = '55555555-5555-4555-8555-555555555507';

  select elemento into grupo_ii
  from jsonb_array_elements(app.calcular_nivel('44444444-4444-4444-8444-444444444442')->'grupos') elemento
  where elemento->>'grupo' = 'II';

  if (grupo_ii->>'imprescindiveis_cumpridos')::integer <> 0 then
    raise exception 'nao_mantem contou como cumpre';
  end if;

  update avaliacoes
     set tipo = 'certificacao'
   where id = '44444444-4444-4444-8444-444444444442';

  update resultados_padrao
     set resultado = 'cumpre'
   where avaliacao_id = '44444444-4444-4444-8444-444444444442'
     and padrao_id in (
       '55555555-5555-4555-8555-555555555501',
       '55555555-5555-4555-8555-555555555507'
     );
end $$;

do $$
declare
  complementar uuid;
begin
  insert into projetos (organizacao_id, manual_id, nome, estado, codigo, tipo, projeto_origem_id)
  values (
    '77777777-7777-4777-8777-777777777777',
    '11111111-1111-4111-8111-111111111111',
    'UGC Farmácia complementar',
    'rascunho',
    '2026/001-C',
    'complementar',
    '22222222-2222-4222-8222-222222222222'
  )
  returning id into complementar;

  if complementar is null then
    raise exception 'projeto complementar não abriu';
  end if;

  begin
    insert into projetos (organizacao_id, manual_id, nome, estado, codigo, tipo, projeto_origem_id)
    values (
      '77777777-7777-4777-8777-777777777777',
      '11111111-1111-4111-8111-111111111111',
      'Segundo complementar',
      'rascunho',
      '2026/001-C',
      'complementar',
      '22222222-2222-4222-8222-222222222222'
    );
    raise exception 'codigo_repetido';
  exception
    when unique_violation then
      null;
    when raise_exception then
      if sqlerrm = 'codigo_repetido' then
        raise exception 'código complementar repetido foi aceito';
      end if;
      raise;
  end;
end $$;

do $$
declare
  area uuid;
begin
  begin
    insert into areas_melhoria (projeto_id, padrao_id, texto, fase)
    values (
      '22222222-2222-4222-8222-222222222222',
      '55555555-5555-4555-8555-555555555501',
      'Fila da farmácia',
      'concluida'
    );
    raise exception 'fase_pulou';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'fase_pulou' then
        raise exception 'área de melhoria nasceu fora de detectada';
      end if;
      raise;
  end;

  insert into areas_melhoria (projeto_id, padrao_id, texto, fase)
  values (
    '22222222-2222-4222-8222-222222222222',
    '55555555-5555-4555-8555-555555555501',
    'Fila da farmácia',
    'detectada'
  )
  returning id into area;

  begin
    update areas_melhoria set fase = 'concluida' where id = area;
    raise exception 'fase_pulou';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'fase_pulou' then
        raise exception 'área de melhoria pulou fase';
      end if;
      raise;
  end;
end $$;

do $$
begin
  begin
    insert into certificados (projeto_id, nivel, emissao, validade, origem)
    values (
      '22222222-2222-4222-8222-222222222222',
      'otimo',
      '2026-10-27',
      '2031-10-27',
      'origem_inventada'
    );
    raise exception 'origem_gravada';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'origem_gravada' then
        raise exception 'origem de certificado fora da lista foi aceita';
      end if;
      raise;
  end;

  insert into certificados (projeto_id, nivel, emissao, validade, origem)
  values (
    '22222222-2222-4222-8222-222222222222',
    'otimo',
    '2026-10-27',
    '2031-10-27',
    'IBES'
  );
end $$;

do $$
declare
  evidencia uuid;
  antes integer;
  depois integer;
begin
  select id into evidencia
  from evidencias
  where projeto_id = '22222222-2222-4222-8222-222222222222'
  limit 1;

  perform app.definir_perfil('autorizador');
  set role app_sessao;

  insert into aprovacoes_evidencia (evidencia_id, acao, usuario_id)
  values (evidencia, 'conferencia', '66666666-6666-4666-8666-666666666667');

  begin
    insert into aprovacoes_evidencia (evidencia_id, acao, usuario_id)
    values (evidencia, 'chancela', '66666666-6666-4666-8666-666666666667');
    raise exception 'chancela_gravada';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'chancela_gravada' then
        raise exception 'autorizador chancelou evidência';
      end if;
      raise;
  end;

  reset role;
  perform app.definir_perfil('responsavel_ibes');
  set role app_sessao;

  select count(*) into antes
  from auditoria
  where tipo = 'aprovacoes_evidencia' and acao = 'insert';

  insert into aprovacoes_evidencia (evidencia_id, acao, usuario_id)
  values (evidencia, 'chancela', '66666666-6666-4666-8666-666666666662');

  select count(*) into depois
  from auditoria
  where tipo = 'aprovacoes_evidencia' and acao = 'insert';

  if depois <> antes + 1 then
    raise exception 'chancela não gerou auditoria (% → %)', antes, depois;
  end if;

  reset role;
end $$;

do $$
declare
  outro uuid;
  vistos integer;
begin
  insert into projetos (organizacao_id, manual_id, nome, estado, codigo)
  values (
    '77777777-7777-4777-8777-777777777777',
    '11111111-1111-4111-8111-111111111111',
    'Outro hospital',
    'rascunho',
    '2026/002'
  )
  returning id into outro;

  perform app.definir_perfil('gestor_instituicao');
  perform app.definir_usuario('66666666-6666-4666-8666-666666666663');
  set role app_sessao;

  select count(*) into vistos from projetos where id = outro;
  if vistos <> 0 then
    raise exception 'cliente leu projeto de que não é membro';
  end if;

  select count(*) into vistos from evidencias where projeto_id = outro;
  if vistos <> 0 then
    raise exception 'cliente leu evidência de outro projeto';
  end if;

  update projetos set nome = 'Nome indevido' where id = '22222222-2222-4222-8222-222222222222';
  if not found then
    raise exception 'cliente não atualizou o próprio projeto';
  end if;

  reset role;
  perform app.definir_perfil('admin_ibes');
  set role app_sessao;

  select count(*) into vistos from projetos where id = outro;
  if vistos <> 1 then
    raise exception 'IBES não leu o projeto novo';
  end if;

  reset role;
end $$;

do $$
declare
  antes integer;
  depois integer;
  gatilhos integer;
  objeto text;
begin
  select count(*) into gatilhos
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname like 'stg_%'
    and not t.tgisinternal;

  if gatilhos <> 0 then
    raise exception 'tabela stg_* tem trigger de auditoria';
  end if;

  select count(*) into antes from auditoria;

  insert into stg_documentos (id_fichero_acsa, idpry_acsa, idaut_acsa, nome, tamanho_bytes)
  values (900001, 62, 140, '1110112_laudo.pdf', 100);

  select count(*) into depois from auditoria;
  if depois <> antes then
    raise exception 'insert em stg_documentos gerou auditoria';
  end if;

  perform app.registrar_auditoria_lote('99999999-9999-4999-8999-999999999999', 112009);

  select count(*), max(a.objeto) into depois, objeto
  from auditoria a
  where a.tipo = 'importacao' and a.acao = 'lote';

  if depois <> 1 or objeto not like '%contagem 112009%' then
    raise exception 'auditoria do lote incompleta (% , %)', depois, objeto;
  end if;
end $$;

do $$
declare
  manual uuid := '88888888-8888-4888-8888-888888888888';
  projeto uuid := '99999999-9999-4999-8999-999999999991';
  avaliacao uuid := '99999999-9999-4999-8999-999999999992';
  padrao uuid := '99999999-9999-4999-8999-999999999993';
  resultado jsonb;
begin
  insert into manuais (
    id, codigo, titulo, catalogo_oficial,
    limiar_i_avancado, limiar_i_superior,
    limiar_ii_otimo, limiar_ii_excelente, limiar_iii_excelente
  ) values (
    manual, 'ME 2 1_05', 'Centros hospitalares, amostra mínima', false,
    70, 100, 40, 100, 40
  );

  insert into regras_nivel (manual_id, nivel, grupo, percentual, exige_obrigatorios) values
    (manual, 'avancado', 'I', 70, true),
    (manual, 'avancado', 'II', 0, false),
    (manual, 'avancado', 'III', 0, false),
    (manual, 'otimo', 'I', 100, true),
    (manual, 'otimo', 'II', 40, false),
    (manual, 'otimo', 'III', 0, false),
    (manual, 'excelente', 'I', 100, true),
    (manual, 'excelente', 'II', 100, false),
    (manual, 'excelente', 'III', 40, false);

  insert into padroes (id, manual_id, codigo, titulo, grupo, obrigatorio)
  values (padrao, manual, '2.01.01', 'Padrão fictício do ME 2', 'I', true);

  insert into projetos (id, organizacao_id, manual_id, nome, estado, codigo)
  values (
    projeto,
    '77777777-7777-4777-8777-777777777777',
    manual,
    'Hospital do ME 2',
    'avaliacao',
    '2026/144'
  );

  insert into avaliacoes (id, projeto_id, rodada, tipo)
  values (avaliacao, projeto, 1, 'certificacao');

  insert into resultados_padrao (avaliacao_id, padrao_id, resultado)
  values (avaliacao, padrao, 'cumpre');

  insert into evidencias (projeto_id, padrao_id, avaliacao_id, descricao, etapa)
  values (projeto, padrao, avaliacao, 'Evidência chancelada do ME 2.', 'chancelada');

  resultado := app.calcular_nivel(avaliacao);
  if resultado->>'manual' <> 'ME 2 1_05' then
    raise exception 'ME 2 não entrou no motor: %', resultado->>'manual';
  end if;
  if (resultado->>'catalogo_contado')::integer <> 1 then
    raise exception 'denominador do ME 2 usou outro número: %', resultado->>'catalogo_contado';
  end if;
  if (resultado->>'catalogo_contado')::integer = 144 then
    raise exception '144 voltou a ser denominador';
  end if;
  if resultado->'referencia_estrutura'->>'padroes' <> '144' then
    raise exception 'referência estrutural de 144 sumiu';
  end if;
end $$;
