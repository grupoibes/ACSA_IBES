-- Ciclo da resposta, chancela da área e saída da autoavaliação. Roda depois de v053.sql.
reset role;
select app.definir_perfil('admin_ibes');
select app.definir_usuario('66666666-6666-4666-8666-666666666662');

insert into usuarios (id, nome, perfil) values
  ('66666666-6666-4666-8666-66666666666a', 'Conferente Fictício', 'conferente'),
  ('66666666-6666-4666-8666-666666666669', 'Upload Fictício', 'responsavel_upload'),
  ('66666666-6666-4666-8666-666666666671', 'Educador Fictício', 'educador'),
  ('66666666-6666-4666-8666-666666666672', 'Tutor Fictício', 'tutor_relatorio'),
  ('66666666-6666-4666-8666-666666666673', 'Líder Fictícia', 'avaliador_lider'),
  ('66666666-6666-4666-8666-666666666674', 'Admin Fictício', 'admin_ibes')
on conflict (id) do nothing;

do $$
begin
  if position('pode_chancelar_evidencia' in pg_get_functiondef('app.transitar_area(uuid,text)'::regprocedure)) = 0 then
    raise exception 'a chancela da área não usa a função da evidência';
  end if;
  if position('provis' in pg_get_functiondef('app.avancar_etapa(uuid)'::regprocedure)) > 0 then
    raise exception 'a saída da autoavaliação ainda está marcada como provisória';
  end if;
end $$;

do $$
declare
  manual uuid := 'f2000000-0000-4000-8000-0000000000aa';
  i integer;
  grupo text;
  seq integer;
  obrig boolean;
  na boolean;
  atual uuid;
  primeiro uuid;
  na_gii uuid;
  na_giii uuid;
  projeto uuid;
  contagem integer;
  gi integer;
  gii integer;
  giii integer;
  obrigatorios integer;
  texto_inicial text;
  texto_manutencao text;
  linhas integer;
begin
  insert into manuais (
    id, codigo, titulo, catalogo_oficial,
    limiar_i_avancado, limiar_i_superior, limiar_ii_otimo, limiar_ii_excelente, limiar_iii_excelente
  ) values (
    manual, 'PF 0 0_00', 'Manual fictício de teste', false, 70, 100, 40, 100, 40
  );

  for i in 1..101 loop
    if i <= 65 then
      grupo := 'I'; seq := i; obrig := i <= 41; na := false;
    elsif i <= 89 then
      grupo := 'II'; seq := i - 65; obrig := false; na := i = 89;
    else
      grupo := 'III'; seq := i - 89; obrig := false; na := i = 101;
    end if;
    insert into padroes (manual_id, codigo, titulo, grupo, obrigatorio, nao_se_aplica_manual)
    values (
      manual,
      format('PF %s %s_00', grupo, lpad(seq::text, 2, '0')),
      format('Padrão fictício %s %s', grupo, lpad(seq::text, 2, '0')),
      grupo,
      obrig,
      na
    )
    returning id into atual;
    if i = 1 then primeiro := atual; end if;
    if i = 89 then na_gii := atual; end if;
    if i = 101 then na_giii := atual; end if;
  end loop;

  select count(*) filter (where p.grupo = 'I'),
         count(*) filter (where p.grupo = 'II'),
         count(*) filter (where p.grupo = 'III'),
         count(*) filter (where p.obrigatorio),
         count(*) filter (where p.nao_se_aplica_manual)
    into gi, gii, giii, obrigatorios, contagem
  from padroes p
  where p.manual_id = manual;
  if gi <> 65 or gii <> 24 or giii <> 12 or obrigatorios <> 41 or contagem <> 2 then
    raise exception 'contagem do manual fictício divergiu (% % % % %)', gi, gii, giii, obrigatorios, contagem;
  end if;

  projeto := app.criar_projeto('2026/091', 'Hospital Fictício do Ciclo', 'Unidade', 'Hospital geral', null, manual, date '2026-04-09', 'zero');
  if app.aplicaveis(projeto) <> 99 then
    raise exception 'o núcleo aplicável não ficou em 99 (% )', app.aplicaveis(projeto);
  end if;

  perform app.avancar_etapa(projeto);
  perform app.avancar_etapa(projeto);
  if (select etapa_fluxo from projetos where id = projeto) <> 'autoavaliacao' then
    raise exception 'diagnóstico e solicitação não avançaram';
  end if;
  begin
    perform app.avancar_etapa(projeto);
    raise exception 'saida_passou';
  exception
    when check_violation then
      if sqlerrm not like '%Cumpre e evidência chancelada%' then
        raise;
      end if;
    when raise_exception then
      if sqlerrm = 'saida_passou' then
        raise exception 'a autoavaliação avançou sem Cumpre e evidência chancelada';
      end if;
      raise;
  end;

  perform app.salvar_diagnostico(projeto, '66666666-6666-4666-8666-666666666661', date '2026-11-06', 'relatorio.pdf', 'projeto/x/documentos/y/v1/relatorio.pdf');
  begin
    perform app.definir_nao_aplicavel(projeto, na_gii, true);
    raise exception 'manual_passou';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'manual_passou' then
        raise exception 'o diagnóstico alterou não se aplica do manual';
      end if;
      raise;
  end;
  perform app.definir_nao_aplicavel(projeto, primeiro, true);
  if app.aplicaveis(projeto) <> 98 then
    raise exception 'um não se aplica do diagnóstico não levou a conta a 98 (% )', app.aplicaveis(projeto);
  end if;

  perform app.salvar_resposta(projeto, primeiro, 'inicial', true, 'texto inicial');
  perform app.salvar_resposta(projeto, primeiro, 'manutencao_1', false, 'texto manutenção');
  perform app.salvar_resposta(projeto, primeiro, 'manutencao_1', true, 'texto revisto');
  select count(*) into linhas from respostas_padrao where projeto_id = projeto and padrao_id = primeiro;
  select texto into texto_inicial from respostas_padrao where projeto_id = projeto and padrao_id = primeiro and ciclo = 'inicial';
  select texto into texto_manutencao from respostas_padrao where projeto_id = projeto and padrao_id = primeiro and ciclo = 'manutencao_1';
  if linhas <> 2 or texto_inicial <> 'texto inicial' or texto_manutencao <> 'texto revisto' then
    raise exception 'a manutenção sobrescreveu a resposta inicial (% / % / %)', linhas, texto_inicial, texto_manutencao;
  end if;

  perform app.definir_perfil('backoffice_ibes');
  begin
    update padroes set nao_se_aplica_manual = false where id = na_giii;
    raise exception 'desmarcou';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'desmarcou' then
        raise exception 'backoffice desmarcou o não se aplica do manual';
      end if;
      raise;
  end;
  if (select nao_se_aplica_manual from padroes where id = na_giii) is not true then
    raise exception 'o não se aplica do manual foi desmarcado';
  end if;
end $$;

do $$
declare
  projeto uuid;
  padrao uuid;
  area_tutor uuid := 'c2000002-0002-4000-8000-000000000002';
  area_recusa uuid := 'c2000003-0003-4000-8000-000000000003';
  fase text;
  auditoria_antes integer;
  auditoria_depois integer;
begin
  select id into projeto from projetos where codigo = '2026/091';
  select id into padrao from padroes where codigo = 'PF II 02_00' and manual_id = 'f2000000-0000-4000-8000-0000000000aa';

  perform app.definir_perfil('responsavel_projeto');
  perform app.definir_usuario('66666666-6666-4666-8666-666666666663');
  perform app.criar_area(area_tutor, projeto, padrao, 'Área fictícia do tutor');
  perform app.criar_area(area_recusa, projeto, padrao, 'Área fictícia recusada');
  perform app.transitar_area(area_tutor, 'planejar');
  perform app.transitar_area(area_tutor, 'concluir');
  perform app.transitar_area(area_recusa, 'planejar');
  perform app.transitar_area(area_recusa, 'concluir');
  perform app.definir_perfil('conferente');
  perform app.definir_usuario('66666666-6666-4666-8666-66666666666a');
  perform app.transitar_area(area_tutor, 'conferir');
  perform app.transitar_area(area_recusa, 'conferir');

  perform app.definir_perfil('tutor_relatorio');
  perform app.definir_usuario('66666666-6666-4666-8666-666666666672');
  perform app.transitar_area(area_tutor, 'chancelar');
  select a.fase into fase from areas_melhoria a where a.id = area_tutor;
  if fase <> 'concluida' then
    raise exception 'o tutor não concluiu a área (%)', fase;
  end if;
  select count(*) into auditoria_antes from auditoria where tipo = 'areas_melhoria' and acao = 'update' and objeto = 'areas_melhoria';
  if auditoria_antes < 1 then
    raise exception 'a chancela da área não entrou na auditoria';
  end if;

  perform app.definir_perfil('autorizador');
  perform app.definir_usuario('66666666-6666-4666-8666-666666666667');
  begin
    perform app.transitar_area(area_recusa, 'chancelar');
    raise exception 'autorizador_passou';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'autorizador_passou' then
        raise exception 'o autorizador chancelou a área';
      end if;
      raise;
  end;
  select a.fase into fase from areas_melhoria a where a.id = area_recusa;
  if fase <> 'aguardando_chancela' then
    raise exception 'a recusa do autorizador alterou a fase (%)', fase;
  end if;
  select count(*) into auditoria_depois from auditoria where tipo = 'areas_melhoria' and acao = 'update' and objeto = 'areas_melhoria';
  if auditoria_depois <> auditoria_antes then
    raise exception 'a chancela recusada entrou na auditoria';
  end if;
end $$;

do $$
declare
  projeto uuid;
  padrao uuid;
  faltam integer;
  emails integer;
  fluxo text;
begin
  select id into projeto from projetos where codigo = '2026/091';
  perform app.definir_perfil('responsavel_projeto');
  perform app.definir_usuario('66666666-6666-4666-8666-666666666663');
  for padrao in
    select p.id
    from padroes p
    join projetos pr on pr.manual_id = p.manual_id and pr.id = projeto
    where p.obrigatorio
      and not p.nao_se_aplica_manual
      and not exists (
        select 1 from padroes_nao_aplicaveis n
        where n.projeto_id = projeto and n.padrao_id = p.id
      )
  loop
    perform app.salvar_resposta(projeto, padrao, 'inicial', true, 'sim');
    update respostas_padrao set cumpre = true
     where projeto_id = projeto and padrao_id = padrao and ciclo = 'inicial';
  end loop;
  perform app.definir_perfil('backoffice_ibes');
  perform app.definir_usuario('66666666-6666-4666-8666-666666666662');
  begin
    perform app.avancar_etapa(projeto);
    raise exception 'cumpre_sem_evidencia_passou';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'cumpre_sem_evidencia_passou' then
        raise exception 'Cumpre sem evidência chancelada liberou a saída';
      end if;
      raise;
  end;

  insert into evidencias (projeto_id, padrao_id, descricao, etapa)
  select projeto, p.id, 'Fato fictício chancelado.', 'chancelada'
  from padroes p
  join projetos pr on pr.manual_id = p.manual_id and pr.id = projeto
  where p.obrigatorio
    and not p.nao_se_aplica_manual
    and not exists (
      select 1 from padroes_nao_aplicaveis n
      where n.projeto_id = projeto and n.padrao_id = p.id
    );
  perform app.avancar_etapa(projeto);
  select etapa_fluxo into fluxo from projetos where id = projeto;
  if fluxo <> 'avaliacao' then
    raise exception 'a saída com Cumpre e evidência chancelada não avançou (%)', fluxo;
  end if;
  select count(*) into emails from emails_enviados where projeto_id = projeto and enviado_em is null;
  if emails < 1 then
    raise exception 'o avanço não registrou e-mail com enviado_em nulo';
  end if;
  select count(*) into faltam from auditoria where tipo = 'emails_enviados' and acao = 'insert' and objeto = 'emails_enviados';
  if faltam < 1 then
    raise exception 'o e-mail do avanço não entrou na auditoria';
  end if;
end $$;

do $$
declare
  origem uuid;
  novo uuid;
  codigo text;
  ligado uuid;
begin
  origem := app.criar_projeto('2026/092', 'Hospital Fictício Certificado', 'Unidade', 'Hospital geral', null, '11111111-1111-4111-8111-111111111111', date '2026-01-15', 'zero');
  update projetos set estado = 'certificado', etapa_fluxo = 'certificacao' where id = origem;
  perform app.definir_perfil('admin_ibes');
  perform app.definir_usuario('66666666-6666-4666-8666-666666666674');
  novo := app.abrir_complementar(origem);
  select p.codigo, p.projeto_origem_id into codigo, ligado from projetos p where p.id = novo;
  if codigo <> '2026/092-C' or ligado <> origem then
    raise exception 'o complementar não guardou a origem (% / %)', codigo, ligado;
  end if;
  if (select count(*) from auditoria where tipo = 'projetos' and acao = 'insert' and objeto = 'projetos') < 1 then
    raise exception 'o complementar não entrou na auditoria';
  end if;
end $$;

reset role;
select app.definir_perfil('gestor_instituicao');
select app.definir_usuario('66666666-6666-4666-8666-666666666663');
set role app_sessao;

do $$
declare
  visto integer;
begin
  select count(*) into visto
  from padroes_nao_aplicaveis n
  join projetos p on p.id = n.projeto_id
  where p.codigo = '2026/091';
  if visto <> 0 then
    raise exception 'a instituição viu o não se aplica do diagnóstico (%)', visto;
  end if;
end $$;

reset role;
