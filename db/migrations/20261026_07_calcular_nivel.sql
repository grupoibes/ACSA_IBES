-- Espelho de src/domain/calcularNivel.ts.
-- Lê os não aplicáveis mesmo quando o chamador é da instituição
-- (security definer) e omite a contagem de exclusões na resposta desse perfil.

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
  select m.codigo, m.id, m.catalogo_oficial, a.tipo, a.projeto_id,
         m.limiar_i_avancado, m.limiar_i_superior,
         m.limiar_ii_otimo, m.limiar_ii_excelente, m.limiar_iii_excelente
    into v_manual, v_manual_id, v_oficial, v_tipo, v_projeto,
         v_limiar_i, v_limiar_i_sup, v_limiar_ii, v_limiar_ii_exc, v_limiar_iii
  from avaliacoes a
  join projetos p on p.id = a.projeto_id
  join manuais m on m.id = p.manual_id
  where a.id = p_avaliacao_id;

  if v_manual is null then
    raise exception 'avaliação inexistente';
  end if;

  if v_manual = 'ME 2 1_05' then
    raise exception 'ME 2 1_05 é referência de estrutura (144 padrões no mapeamento) e não entra em calcular_nivel';
  end if;

  if v_manual <> 'ME 5 1_07' then
    raise exception 'calcular_nivel só usa a contagem do ME 5 1_07';
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
      count(*) filter (where na.padrao_id is null and coalesce(c.cumprido, false))::integer,
      count(*) filter (where pad.obrigatorio and na.padrao_id is null)::integer,
      count(*) filter (where pad.obrigatorio and na.padrao_id is null and coalesce(c.cumprido, false))::integer,
      count(*) filter (where pad.imprescindivel and na.padrao_id is null)::integer,
      count(*) filter (where pad.imprescindivel and na.padrao_id is null and coalesce(c.cumprido, false))::integer
    into v_total, v_excluidos, v_aplicavel, v_cumpridos, v_obr_a, v_obr_c, v_imp_a, v_imp_c
    from padroes pad
    left join padroes_nao_aplicaveis na
      on na.projeto_id = v_projeto and na.padrao_id = pad.id
    left join conformidades c
      on c.avaliacao_id = p_avaliacao_id and c.padrao_id = pad.id
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

create or replace function app.padroes_do_projeto(p_projeto uuid)
returns table (
  id uuid,
  codigo text,
  titulo text,
  grupo text,
  obrigatorio boolean,
  imprescindivel boolean,
  nao_aplicavel boolean,
  origem text
)
language sql
stable
security definer
set search_path = public, app
as $$
  select
    pad.id,
    pad.codigo,
    pad.titulo,
    pad.grupo,
    pad.obrigatorio,
    pad.imprescindivel,
    (na.padrao_id is not null) and not app.eh_perfil_instituicao() as nao_aplicavel,
    case when app.eh_perfil_instituicao() then null else na.origem end as origem
  from projetos pr
  join padroes pad on pad.manual_id = pr.manual_id
  left join padroes_nao_aplicaveis na
    on na.projeto_id = pr.id
   and na.padrao_id = pad.id
  where pr.id = p_projeto
    and (
      not app.eh_perfil_instituicao()
      or na.padrao_id is null
    )
  order by pad.codigo
$$;

grant execute on function app.calcular_nivel(uuid) to app_sessao;
grant execute on function app.padroes_do_projeto(uuid) to app_sessao;

comment on function app.calcular_nivel(uuid) is
  'Nível do ME 5 1_07. Não aplicável sai do total e do mínimo. Manutenção ignora o Grupo III. O 144 do ME 2 1_05 não é lido.';
