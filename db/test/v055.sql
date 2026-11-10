-- Restrição, usuários, requisitos, consenso e relatório consolidado.
reset role;
select app.definir_perfil('admin_ibes');
select app.definir_usuario('66666666-6666-4666-8666-666666666674');

do $$
declare
  inicio date;
  fim date;
begin
  select j.inicio, j.fim into inicio, fim from app.janela_visita('2026-11-09'::date) j;
  if inicio <> '2026-10-05' or fim <> '2026-11-09' then
    raise exception 'janela inesperada % %', inicio, fim;
  end if;
  if not app.cliente_na_restricao('2026-11-09', '2026-11-09', 'gestor_instituicao') then
    raise exception 'o dia da visita entra na restrição';
  end if;
  if app.cliente_na_restricao('2026-11-10', '2026-11-09', 'gestor_instituicao') then
    raise exception 'o dia seguinte não entra na restrição';
  end if;
  if app.cliente_na_restricao('2026-11-09', '2026-11-09', 'backoffice_ibes') then
    raise exception 'o IBES não fica restrito';
  end if;
end $$;

do $$
declare
  aviso text;
  i integer;
  ativos integer;
begin
  for i in 1..41 loop
    aviso := app.cadastrar_usuario(
      '77777777-7777-4777-8777-777777777777',
      'Usuário fictício ' || i,
      'usuario' || i || '@instituicao.ficticia',
      'profissional_instituicao'
    );
  end loop;
  select count(*) into ativos
  from usuarios
  where organizacao_id = '77777777-7777-4777-8777-777777777777'
    and perfil = 'profissional_instituicao';
  if ativos < 41 then
    raise exception 'o 41º usuário foi bloqueado (% gravados)', ativos;
  end if;
  if aviso is null or position('41' in aviso) = 0 and position('segue aberto' in aviso) = 0 then
    raise exception 'o backoffice não recebeu o aviso: %', aviso;
  end if;
end $$;

insert into provas (id, manual_id, codigo, nome) values
  ('f3000001-0001-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'DOC', 'Documentação'),
  ('f3000001-0001-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', 'VIS', 'Visita'),
  ('f3000001-0001-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111', 'ENT', 'Entrevista');

insert into requisitos_avaliacao (id, padrao_id, ordem, texto) values
  ('f3000001-0001-4000-8000-000000000001', '55555555-5555-4555-8555-555555555501', 2, 'Requisito fictício de demonstração, comprovado na visita.');

insert into requisitos_provas (requisito_id, prova_id) values
  ('f3000001-0001-4000-8000-000000000001', 'f3000001-0001-4000-8000-000000000011'),
  ('f3000001-0001-4000-8000-000000000001', 'f3000001-0001-4000-8000-000000000012');

set role app_sessao;
select app.definir_perfil('gestor_instituicao');
select app.definir_usuario('66666666-6666-4666-8666-666666666663');

do $$
declare
  n integer;
begin
  select count(*) into n from requisitos_avaliacao;
  if n <> 0 then
    raise exception 'o cliente viu % requisitos', n;
  end if;
end $$;

select app.definir_perfil('avaliador_ibes');
select app.definir_usuario('66666666-6666-4666-8666-666666666661');

do $$
declare
  n integer;
begin
  select count(*) into n from requisitos_avaliacao where texto like '%comprovado na visita%';
  if n <> 1 then
    raise exception 'o avaliador não viu o requisito (%)', n;
  end if;
end $$;

select app.definir_perfil('tutor_relatorio');
select app.definir_usuario('66666666-6666-4666-8666-666666666672');

do $$
declare
  n integer;
begin
  select count(*) into n from requisitos_avaliacao where texto like '%comprovado na visita%';
  if n <> 1 then
    raise exception 'o tutor não viu o requisito (%)', n;
  end if;
end $$;

reset role;
select app.definir_perfil('admin_ibes');
select app.definir_usuario('66666666-6666-4666-8666-666666666674');

insert into usuarios (id, nome, perfil) values
  ('66666666-6666-4666-8666-666666666664', 'Membro F', 'membro_comite')
on conflict (id) do nothing;

insert into avaliacoes (id, projeto_id, rodada, tipo, resultado, resultado_positivo_em)
values (
  'a1000009-0009-4000-8000-000000000055',
  '22222222-2222-4222-8222-222222222222',
  9,
  'certificacao',
  'positiva',
  current_date
);

insert into pontos_avaliacao (avaliacao_id, tipo, texto, consolidado) values
  ('a1000009-0009-4000-8000-000000000055', 'forte', 'Ponto fictício consolidado da visita.', true),
  ('a1000009-0009-4000-8000-000000000055', 'fraco', 'Ponto fictício ainda não consolidado.', false);

do $$
declare
  texto text := app.texto_relatorio('a1000009-0009-4000-8000-000000000055');
begin
  if position('Ponto fictício consolidado' in texto) = 0 then
    raise exception 'o consolidado saiu do relatório';
  end if;
  if position('não consolidado' in texto) > 0 then
    raise exception 'o ponto solto entrou no relatório';
  end if;
end $$;

select app.definir_perfil('membro_comite');
select app.definir_usuario('66666666-6666-4666-8666-666666666664');
select app.registrar_parecer(
  '22222222-2222-4222-8222-222222222222',
  'a1000009-0009-4000-8000-000000000055',
  'conceder', 'avancado', 'Parecer fictício F.', true
);
select app.definir_usuario('66666666-6666-4666-8666-666666666665');
select app.registrar_parecer(
  '22222222-2222-4222-8222-222222222222',
  'a1000009-0009-4000-8000-000000000055',
  'conceder', 'avancado', 'Parecer fictício G.', true
);
select app.definir_usuario('66666666-6666-4666-8666-666666666666');
select app.registrar_parecer(
  '22222222-2222-4222-8222-222222222222',
  'a1000009-0009-4000-8000-000000000055',
  'nao_conceder', 'avancado', 'Parecer fictício H.', true
);

do $$
begin
  begin
    perform app.registrar_resolucao(
      '22222222-2222-4222-8222-222222222222',
      'a1000009-0009-4000-8000-000000000055',
      'RES-FICTICIA',
      'avancado',
      'avancado',
      ''
    );
    raise exception 'resolucao_gravada';
  exception
    when check_violation then
      if position('Sem consenso' in sqlerrm) = 0 then
        raise exception 'bloqueio inesperado: %', sqlerrm;
      end if;
  end;
end $$;

update pareceres_comite
   set voto = 'conceder'
 where avaliacao_id = 'a1000009-0009-4000-8000-000000000055'
   and membro = '66666666-6666-4666-8666-666666666666';

do $$
begin
  begin
    perform app.registrar_resolucao(
      '22222222-2222-4222-8222-222222222222',
      'a1000009-0009-4000-8000-000000000055',
      'RES-FICTICIA',
      'otimo',
      'avancado',
      ''
    );
    raise exception 'resolucao_gravada';
  exception
    when check_violation then
      if position('justificativa' in sqlerrm) = 0 then
        raise exception 'justificativa não foi exigida: %', sqlerrm;
      end if;
  end;
end $$;

select app.registrar_resolucao(
  '22222222-2222-4222-8222-222222222222',
  'a1000009-0009-4000-8000-000000000055',
  'RES-FICTICIA',
  'avancado',
  'avancado',
  ''
);

insert into stg_projetos (idpry_acsa, codigo, manual_codigo, payload)
values (9001, 'MIG-9001', 'PF', '{"instituicao":"Hospital Fictício da Migração"}'::jsonb);
insert into stg_documentos (id_fichero_acsa, idpry_acsa, idaut_acsa, nome, tamanho_bytes)
values (90011, 9001, 1, 'documento-ficticio.pdf', 1200),
       (90012, 9001, 1, 'segundo-ficticio.pdf', 800);
insert into stg_doc_vinculos (id_fichero_acsa, cod_estandar, descricao_evidencia)
values (90011, 'PF I 01.01_00', 'Vínculo fictício.');

do $$
declare
  painel jsonb := app.ler_segunda('22222222-2222-4222-8222-222222222222', current_date);
  docs integer;
begin
  select (item->>'documentos')::integer into docs
  from jsonb_array_elements(painel->'migracao'->'staging') item
  where item->>'codigo' = 'MIG-9001';
  if docs <> 2 or (painel->'migracao'->>'inventario')::integer <> 72 then
    raise exception 'staging % inventario %', docs, painel->'migracao'->>'inventario';
  end if;
end $$;
