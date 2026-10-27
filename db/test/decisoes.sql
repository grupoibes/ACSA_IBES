-- Asserções das decisões de 26/10 contra o banco da amostra.

do $$
declare
  citados integer;
  oficiais integer;
begin
  select padroes_citados into citados from referencias_estrutura where manual = 'ME 2 1_05';
  select count(*) into oficiais from padroes;
  if citados <> 144 then
    raise exception 'referência estrutural deveria citar 144, veio %', citados;
  end if;
  if oficiais = 144 then
    raise exception 'o catálogo operacional não pode ser os 144 do mapeamento';
  end if;
  if exists (select 1 from manuais where codigo = 'ME 2 1_05') then
    raise exception 'ME 2 1_05 não é manual operacional';
  end if;
end $$;

select app.definir_perfil('admin_ibes');
set role app_sessao;

do $$
declare
  resultado jsonb;
  grupo_ii jsonb;
  visiveis integer;
  sala integer;
begin
  resultado := app.calcular_nivel('44444444-4444-4444-8444-444444444442');
  if resultado->>'manual' <> 'ME 5 1_07' then
    raise exception 'manual %', resultado->>'manual';
  end if;
  if resultado->>'nivel' <> 'otimo' then
    raise exception 'nível IBES esperado otimo, veio %', resultado->>'nivel';
  end if;
  if (resultado->>'catalogo_contado')::integer = 144 then
    raise exception 'denominador usou 144';
  end if;
  if resultado->'referencia_estrutura'->>'padroes' <> '144' then
    raise exception 'referência não preservada';
  end if;

  select elemento into grupo_ii
  from jsonb_array_elements(resultado->'grupos') elemento
  where elemento->>'grupo' = 'II';

  if (grupo_ii->>'total_manual')::integer <> 3
     or (grupo_ii->>'excluidos_nao_aplicaveis')::integer <> 1
     or (grupo_ii->>'total_aplicavel')::integer <> 2
     or (grupo_ii->>'minimo_cumpridos')::integer <> 1
     or (grupo_ii->>'cumpridos')::integer <> 1 then
    raise exception 'grupo II IBES inesperado: %', grupo_ii;
  end if;

  select count(*) into visiveis from app.padroes_do_projeto('22222222-2222-4222-8222-222222222222');
  select count(*) into sala
  from app.padroes_do_projeto('22222222-2222-4222-8222-222222222222')
  where codigo = '5.06.02' and nao_aplicavel and origem = 'diagnostico';
  if visiveis <> 12 or sala <> 1 then
    raise exception 'IBES deveria ver o não aplicável (visíveis %, sala %)', visiveis, sala;
  end if;
end $$;

select app.definir_perfil('gestor_instituicao');

do $$
declare
  n integer;
  sala integer;
  resultado jsonb;
  grupo_ii jsonb;
begin
  select count(*) into n from padroes_nao_aplicaveis;
  if n <> 0 then
    raise exception 'RLS mostrou % não aplicáveis à instituição', n;
  end if;

  select count(*) into sala
  from app.padroes_do_projeto('22222222-2222-4222-8222-222222222222')
  where codigo = '5.06.02';
  if sala <> 0 then
    raise exception 'a tela da instituição ainda receberia o padrão 5.06.02';
  end if;

  resultado := app.calcular_nivel('44444444-4444-4444-8444-444444444442');
  if resultado->>'nivel' <> 'otimo' then
    raise exception 'a instituição deve ser pontuada sem o não aplicável, veio %', resultado->>'nivel';
  end if;

  select elemento into grupo_ii
  from jsonb_array_elements(resultado->'grupos') elemento
  where elemento->>'grupo' = 'II';

  if grupo_ii->>'excluidos_nao_aplicaveis' is not null
     or grupo_ii->>'total_manual' is not null then
    raise exception 'a resposta vazou a exclusão: %', grupo_ii;
  end if;
  if (grupo_ii->>'total_aplicavel')::integer <> 2
     or (grupo_ii->>'minimo_cumpridos')::integer <> 1 then
    raise exception 'mínimo da instituição não saiu do aplicável: %', grupo_ii;
  end if;
end $$;

do $$
begin
  begin
    perform app.definir_motivo_estado('tentativa da instituição');
    update projetos
       set estado = 'recusado'
     where id = '22222222-2222-4222-8222-222222222222';
    raise exception 'transicao_indevida';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'transicao_indevida' then
        raise exception 'gestor alterou o estado para recusado';
      end if;
      raise;
  end;
end $$;

do $$
begin
  begin
    insert into conformidades (avaliacao_id, padrao_id, cumprido)
    values (
      '44444444-4444-4444-8444-444444444442',
      '55555555-5555-4555-8555-555555555509',
      false
    );
    raise exception 'conformidade_gravada';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'conformidade_gravada' then
        raise exception 'não aplicável recebeu conformidade';
      end if;
      raise;
  end;
end $$;

do $$
declare
  antes integer;
  depois integer;
begin
  select count(*) into antes from evidencias;
  begin
    delete from evidencias;
    raise exception 'delete_passou';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'delete_passou' then
        raise exception 'evidência foi apagada';
      end if;
      raise;
  end;
  select count(*) into depois from evidencias;
  if antes <> depois or antes < 2 then
    raise exception 'evidências não acumularam (antes %, depois %)', antes, depois;
  end if;
end $$;

reset role;
select app.definir_perfil('responsavel_ibes');
select app.definir_motivo_estado('escopo incompatível com o manual');
set role app_sessao;

update projetos
   set estado = 'recusado'
 where id = '22222222-2222-4222-8222-222222222222';

do $$
declare
  estado text;
  perfil text;
  motivo text;
begin
  select p.estado into estado
  from projetos p
  where p.id = '22222222-2222-4222-8222-222222222222';

  select h.perfil_ator, h.motivo into perfil, motivo
  from historico_estados h
  where h.projeto_id = '22222222-2222-4222-8222-222222222222'
    and h.estado_novo = 'recusado'
  order by h.em desc
  limit 1;

  if estado <> 'recusado' or perfil <> 'responsavel_ibes' or motivo <> 'escopo incompatível com o manual' then
    raise exception 'histórico do recusado incompleto (%, %, %)', estado, perfil, motivo;
  end if;
end $$;

reset role;
select app.definir_perfil('admin_ibes');
set role app_sessao;

begin;
update avaliacoes
   set tipo = 'manutencao'
 where id = '44444444-4444-4444-8444-444444444442';

do $$
declare
  resultado jsonb;
  grupo_iii jsonb;
begin
  resultado := app.calcular_nivel('44444444-4444-4444-8444-444444444442');
  select elemento into grupo_iii
  from jsonb_array_elements(resultado->'grupos') elemento
  where elemento->>'grupo' = 'III';

  if resultado->>'nivel' <> 'otimo' then
    raise exception 'manutenção deveria permanecer em otimo, veio %', resultado->>'nivel';
  end if;
  if (grupo_iii->>'no_escopo')::boolean or grupo_iii->>'minimo_cumpridos' is not null then
    raise exception 'Grupo III entrou na manutenção: %', grupo_iii;
  end if;
end $$;

rollback;

do $$
begin
  begin
    insert into padroes_nao_aplicaveis (
      projeto_id, padrao_id, diagnostico_id, origem, registrado_por
    ) values (
      '22222222-2222-4222-8222-222222222222',
      '55555555-5555-4555-8555-555555555512',
      '33333333-3333-4333-8333-333333333333',
      'visita',
      '66666666-6666-4666-8666-666666666661'
    );
    raise exception 'origem_gravada';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'origem_gravada' then
        raise exception 'origem diferente de diagnostico foi aceita';
      end if;
      raise;
  end;
end $$;

reset role;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resolucoes_comite' and column_name = 'orgao'
  ) then
    raise exception 'resolucoes_comite ainda tem orgao';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resolucoes_comite' and column_name = 'decisao'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resolucoes_comite' and column_name = 'documento'
  ) then
    raise exception 'resolucao sem decisao ou documento';
  end if;
end $$;

do $$
begin
  begin
    insert into lotes_importacao (meio, arquivo, formato_entrada)
    values ('csv', 'manual.csv', 'layout-fechado');
    raise exception 'formato_gravado';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'formato_gravado' then
        raise exception 'formato de entrada foi decidido no banco';
      end if;
      raise;
  end;

  begin
    insert into lotes_importacao (meio, arquivo)
    values ('plataforma', 'origem');
    raise exception 'meio_gravado';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'meio_gravado' then
        raise exception 'meio fora de csv/json foi aceito';
      end if;
      raise;
  end;
end $$;

select app.definir_perfil('membro_comite');
set role app_sessao;

insert into pareceres_comite (projeto_id, avaliacao_id, membro, parecer, voto, data)
values (
  '22222222-2222-4222-8222-222222222222',
  '44444444-4444-4444-8444-444444444442',
  '66666666-6666-4666-8666-666666666664',
  'Os obrigatórios aplicáveis estão cumpridos e o Grupo II fecha o mínimo.',
  'favoravel',
  '2026-10-27'
);

insert into resolucoes_comite (
  projeto_id, avaliacao_id, decisao, pontuacao, nivel_concedido, data, documento, registrado_por
) values (
  '22222222-2222-4222-8222-222222222222',
  '44444444-4444-4444-8444-444444444442',
  'Certificação Ótima concedida pelo comitê do IBES.',
  82,
  'otimo',
  '2026-10-27',
  'comite/serra-verde/resolucao.pdf',
  '66666666-6666-4666-8666-666666666664'
);

do $$
declare
  sala integer;
  pareceres integer;
begin
  select count(*) into sala
  from app.padroes_do_projeto('22222222-2222-4222-8222-222222222222')
  where codigo = '5.06.02' and nao_aplicavel;
  select count(*) into pareceres from pareceres_comite;
  if sala <> 1 or pareceres <> 1 then
    raise exception 'membro do comitê não viu o padrão ou o parecer (sala %, pareceres %)', sala, pareceres;
  end if;
end $$;

reset role;
select app.definir_perfil('gestor_instituicao');
set role app_sessao;

do $$
declare
  n integer;
begin
  select count(*) into n from pareceres_comite;
  if n <> 0 then
    raise exception 'a instituição leu % pareceres', n;
  end if;

  begin
    insert into pareceres_comite (projeto_id, avaliacao_id, membro, parecer, voto, data)
    values (
      '22222222-2222-4222-8222-222222222222',
      '44444444-4444-4444-8444-444444444442',
      '66666666-6666-4666-8666-666666666664',
      'Parecer indevido',
      'contra',
      '2026-10-27'
    );
    raise exception 'parecer_gravado';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'parecer_gravado' then
        raise exception 'gestor gravou parecer';
      end if;
      raise;
  end;
end $$;

reset role;

insert into auditoria (perfil, tipo, acao, objeto)
values ('admin_ibes', 'Teste', 'linha de auditoria', 'projeto');

do $$
begin
  begin
    update auditoria set acao = 'alterada';
    raise exception 'auditoria_alterada';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'auditoria_alterada' then
        raise exception 'auditoria aceitou update';
      end if;
      raise;
  end;
end $$;

do $$
declare
  iii integer;
begin
  select percentual into iii
  from regras_nivel
  where manual_id = '11111111-1111-4111-8111-111111111111'
    and nivel = 'excelente'
    and grupo = 'III';
  if iii <> 40 then
    raise exception 'regras_nivel v0.3 esperava Grupo III em 40, veio %', iii;
  end if;
end $$;
