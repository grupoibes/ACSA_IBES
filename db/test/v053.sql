-- Candidatura, documento e leitura por projeto. Roda depois de v052.sql.
reset role;
select app.definir_perfil('admin_ibes');

do $$
declare
  candidatura uuid;
  auditoria_antes integer;
  auditoria_depois integer;
  motivo text;
  situacao text;
begin
  insert into candidaturas (codigo, instituicao, situacao)
  values ('2026/081', 'Clínica da Devolução', 'recebida')
  returning id into candidatura;

  select count(*) into auditoria_antes
  from auditoria
  where tipo = 'candidaturas' and acao = 'update';

  begin
    perform app.devolver_candidatura(candidatura, '   ');
    raise exception 'motivo_passou';
  exception
    when check_violation then
      if sqlerrm not like '%motivo da devolução%' then
        raise;
      end if;
    when raise_exception then
      if sqlerrm = 'motivo_passou' then
        raise exception 'devolução sem motivo foi aceita';
      end if;
      raise;
  end;

  select count(*) into auditoria_depois
  from auditoria
  where tipo = 'candidaturas' and acao = 'update';
  if auditoria_depois <> auditoria_antes then
    raise exception 'devolução recusada entrou na auditoria';
  end if;

  perform app.devolver_candidatura(candidatura, ' Falta o contrato ');
  select c.situacao, c.motivo_devolucao into situacao, motivo
  from candidaturas c where c.id = candidatura;
  if situacao <> 'devolvida' or motivo <> 'Falta o contrato' then
    raise exception 'devolução não gravou o motivo (% / %)', situacao, motivo;
  end if;

  select count(*) into auditoria_depois
  from auditoria
  where tipo = 'candidaturas' and acao = 'update' and objeto = 'candidaturas';
  if auditoria_depois < 1 then
    raise exception 'a devolução não entrou na auditoria';
  end if;

  begin
    update candidaturas
       set situacao = 'devolvida', motivo_devolucao = null
     where id = candidatura;
    raise exception 'nulo_passou';
  exception
    when check_violation then
      null;
    when raise_exception then
      if sqlerrm = 'nulo_passou' then
        raise exception 'situação devolvida ficou sem motivo';
      end if;
      raise;
  end;
end $$;

do $$
declare
  candidatura uuid;
  projeto uuid;
  documento uuid;
  situacao text;
  projeto_ligado uuid;
  auditoria_doc integer;
  auditoria_reclass integer;
  visto integer;
  pode boolean;
begin
  insert into candidaturas (codigo, instituicao, situacao)
  values ('2026/082', 'Hospital da Conversão', 'recebida')
  returning id into candidatura;
  perform app.validar_candidatura(candidatura);

  projeto := app.criar_projeto(
    '2026/082',
    'Hospital da Conversão',
    'Unidade sul',
    'Hospital geral',
    null,
    '11111111-1111-4111-8111-111111111111',
    date '2026-11-09',
    'candidatura'
  );
  perform app.converter_candidatura(candidatura, projeto);
  select c.situacao, c.projeto_id into situacao, projeto_ligado
  from candidaturas c where c.id = candidatura;
  if situacao <> 'convertida' or projeto_ligado <> projeto then
    raise exception 'candidatura não apontou o projeto';
  end if;

  documento := gen_random_uuid();
  insert into documentos (id, projeto_id, nome, classificacao)
  values (documento, projeto, 'laudo', 'Procedimento');
  insert into documento_versoes (documento_id, versao, arquivo_path, sha256, tamanho_bytes, mime)
  values (documento, 1, 'projeto/' || projeto || '/documentos/' || documento || '/v1/laudo.pdf', repeat('a', 64), 12, 'application/pdf');

  select count(*) into auditoria_doc
  from auditoria
  where tipo = 'documentos' and acao = 'insert' and objeto = 'documentos';
  if auditoria_doc < 1 then
    raise exception 'o documento não entrou na auditoria';
  end if;

  update documentos set classificacao = 'Ata' where id = documento;
  if (select classificacao from documentos where id = documento) <> 'Ata' then
    raise exception 'reclassificação não gravou';
  end if;
  select count(*) into auditoria_reclass
  from auditoria
  where tipo = 'documentos' and acao = 'update' and objeto = 'documentos';
  if auditoria_reclass < 1 then
    raise exception 'a reclassificação não entrou na auditoria';
  end if;

  if not app.pode_ler_documento(projeto) then
    raise exception 'administrador não leu o documento do projeto';
  end if;
end $$;

reset role;
select app.definir_perfil('gestor_instituicao');
select app.definir_usuario('66666666-6666-4666-8666-666666666663');
set role app_sessao;

do $$
declare
  projeto uuid;
  visto integer;
  pode boolean;
begin
  select id into projeto from projetos where codigo = '2026/082';
  select count(*) into visto from documentos where projeto_id = projeto;
  if visto <> 0 then
    raise exception 'perfil de outro projeto leu o documento (% )', visto;
  end if;
  pode := app.pode_ler_documento(projeto);
  if pode then
    raise exception 'pode_ler_documento liberou outro projeto';
  end if;
end $$;

reset role;
select app.definir_perfil('avaliador_ibes');

do $$
declare
  candidatura uuid;
begin
  select id into candidatura from candidaturas where codigo = '2026/081';
  begin
    perform app.devolver_candidatura(candidatura, 'não deveria');
    raise exception 'avaliador_passou';
  exception
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm = 'avaliador_passou' then
        raise exception 'avaliador devolveu candidatura';
      end if;
      raise;
  end;
end $$;
