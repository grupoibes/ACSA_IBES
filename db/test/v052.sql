-- Seções 2 a 4 e o prazo do Comitê. Roda depois de v051.sql.
reset role;
select app.definir_perfil('admin_ibes');

do $$
declare
  projeto uuid;
  documentos integer;
  emails integer;
  auditoria_antes integer;
  auditoria_depois integer;
  enviado timestamptz;
  estado text;
  origem text;
begin
  select count(*) into auditoria_antes from auditoria where tipo = 'projetos' and acao = 'insert';
  projeto := app.criar_projeto(
    '2026/050',
    'Clínica Fictícia de Teste',
    'Ambulatório',
    'Clínica',
    null,
    '11111111-1111-4111-8111-111111111111',
    date '2026-04-09',
    'zero'
  );
  select p.estado, p.origem_criacao into estado, origem from projetos p where p.id = projeto;
  if estado <> 'diagnostico' or origem <> 'zero' then
    raise exception 'projeto não nasceu em diagnóstico (%)', estado;
  end if;
  select count(*) into documentos from documentos d where d.projeto_id = projeto;
  if documentos <> 0 then
    raise exception 'biblioteca não nasceu vazia';
  end if;
  select count(*), max(enviado_em) into emails, enviado
  from emails_enviados where projeto_id = projeto;
  if emails <> 1 or enviado is not null then
    raise exception 'e-mail deveria ficar registrado e não enviado';
  end if;
  select count(*) into auditoria_depois from auditoria where tipo = 'projetos' and acao = 'insert';
  if auditoria_depois <> auditoria_antes + 1 then
    raise exception 'a criação não entrou na auditoria';
  end if;

  begin
    perform app.criar_projeto(
      '2026/050', 'Outra', 'Outra unidade', null, null,
      '11111111-1111-4111-8111-111111111111', date '2026-04-09', 'zero'
    );
    raise exception 'duplicata_passou';
  exception
    when unique_violation then
      null;
    when raise_exception then
      if sqlerrm = 'duplicata_passou' then
        raise exception 'código repetido foi aceito';
      end if;
      raise;
  end;

  begin
    perform app.criar_projeto(
      '2026/2', 'Outra', 'Outra unidade', null, null,
      '11111111-1111-4111-8111-111111111111', date '2026-04-09', 'zero'
    );
    raise exception 'codigo_passou';
  exception
    when check_violation then
      if sqlerrm not like '%código de projeto inválido%' then
        raise;
      end if;
    when raise_exception then
      if sqlerrm = 'codigo_passou' then
        raise exception 'código inválido foi aceito';
      end if;
      raise;
  end;
end $$;

select app.definir_perfil('avaliador_ibes');
do $$
begin
  perform app.criar_projeto(
    '2026/003', 'Outra', 'Outra unidade', null, null,
    '11111111-1111-4111-8111-111111111111', date '2026-04-09', 'zero'
  );
  raise exception 'avaliador_passou';
exception
  when insufficient_privilege then
    null;
  when raise_exception then
    if sqlerrm = 'avaliador_passou' then
      raise exception 'avaliador criou projeto';
    end if;
    raise;
end $$;

select app.definir_perfil('responsavel_ibes');
select app.criar_projeto(
  '2026/051',
  'Hospital Fictício do Vale',
  'Unidade norte',
  null,
  'Grupo A',
  '11111111-1111-4111-8111-111111111111',
  date '2026-10-23',
  'candidatura'
);

reset role;
select app.definir_perfil('gestor_instituicao');
select app.definir_usuario('66666666-6666-4666-8666-666666666663');
set role app_sessao;
do $$
declare
  projetos integer;
  emails integer;
begin
  select count(*) into projetos from projetos where codigo in ('2026/050', '2026/051');
  select count(*) into emails from emails_enviados e
  join projetos p on p.id = e.projeto_id
  where p.codigo in ('2026/050', '2026/051');
  if projetos <> 0 or emails <> 0 then
    raise exception 'gestor viu projeto que não é dele (% / %)', projetos, emails;
  end if;
end $$;

reset role;
select app.definir_perfil('admin_ibes');
set role app_sessao;
do $$
declare
  projetos integer;
begin
  select count(*) into projetos from projetos where codigo in ('2026/050', '2026/051');
  if projetos <> 2 then
    raise exception 'administrador não viu os projetos novos (%)', projetos;
  end if;
end $$;

reset role;
select app.definir_perfil('admin_ibes');

do $$
declare
  projeto uuid;
  avaliacao uuid := '99999999-9999-4999-8999-999999999981';
  prazo timestamptz;
  marcado timestamptz;
begin
  select id into projeto from projetos where codigo = '2026/050';
  insert into avaliacoes (id, projeto_id, rodada, tipo)
  values (avaliacao, projeto, 1, 'certificacao');

  update avaliacoes
     set resultado = 'positiva',
         resultado_positivo_em = timestamptz '2026-01-01 12:00:00-03'
   where id = avaliacao;
  select resultado_positivo_em into marcado from avaliacoes where id = avaliacao;
  prazo := app.prazo_comite(avaliacao);
  if prazo <> marcado + interval '30 days' then
    raise exception 'prazo do comitê não somou 30 dias';
  end if;

  update projetos set estado = 'avaliacao' where id = projeto;
  if app.comite_vencido(projeto, timestamptz '2026-01-31 12:00:00-03') then
    raise exception 'o dia do prazo foi tratado como vencido';
  end if;
  if not app.comite_vencido(projeto, timestamptz '2026-02-01 12:00:00-03') then
    raise exception 'o dia seguinte não venceu o prazo';
  end if;

  update avaliacoes
     set resultado_positivo_em = now() - interval '31 days'
   where id = avaliacao;
  begin
    update projetos set estado = 'comite' where id = projeto;
    raise exception 'avanco_passou';
  exception
    when check_violation then
      if sqlerrm not like '%prazo do comitê vencido%' then
        raise;
      end if;
    when raise_exception then
      if sqlerrm = 'avanco_passou' then
        raise exception 'etapa avançou com o comitê vencido';
      end if;
      raise;
  end;

  update avaliacoes
     set resultado_positivo_em = now() - interval '1 day'
   where id = avaliacao;
  update projetos set estado = 'comite' where id = projeto;
  if (select estado from projetos where id = projeto) <> 'comite' then
    raise exception 'dentro do prazo a etapa continuou bloqueada';
  end if;
end $$;

do $$
begin
  begin
    insert into stg_documentos (id_fichero_acsa, idpry_acsa, idaut_acsa, nome, tamanho_bytes, status)
    values (900002, 62, 140, 'fora.pdf', 10, 'outro');
    raise exception 'status_passou';
  exception
    when check_violation then
      if sqlerrm not like '%status%' then
        raise;
      end if;
    when raise_exception then
      if sqlerrm = 'status_passou' then
        raise exception 'status de anexo inválido foi aceito';
      end if;
      raise;
  end;

  insert into stg_documentos (
    id_fichero_acsa, idpry_acsa, idaut_acsa, nome, tamanho_bytes,
    arquivo_local, sha256, mime_detectado, status
  ) values (
    900003, 62, 140, 'laudo.pdf', 10,
    '900003_laudo.pdf', repeat('a', 64), 'application/pdf', 'nome_alterado'
  );
  if not exists (
    select 1 from stg_documentos
    where id_fichero_acsa = 900003 and status = 'nome_alterado' and arquivo_local = '900003_laudo.pdf'
  ) then
    raise exception 'anexo casado não ficou no staging';
  end if;
end $$;
