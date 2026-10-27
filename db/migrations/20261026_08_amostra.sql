-- Amostra para exercitar a regra. Não é o catálogo oficial do ME 5 1_07.
-- Doze padrões bastam para mostrar total, mínimo e Grupo III fora da manutenção.
-- A contagem oficial entra quando o catálogo do manual for carregado no lugar desta amostra.

select set_config('app.perfil', 'admin_ibes', false);
select set_config('app.motivo_estado', 'Abertura do projeto', false);

insert into manuais (
  id, codigo, titulo, catalogo_oficial,
  limiar_i_avancado, limiar_i_superior,
  limiar_ii_otimo, limiar_ii_excelente, limiar_iii_excelente
) values (
  '11111111-1111-4111-8111-111111111111',
  'ME 5 1_07',
  'Unidades de Gestão Clínica — amostra de demonstração, não o catálogo oficial',
  false,
  70, 100, 40, 100, 70
);

insert into organizacoes (id, nome)
values ('77777777-7777-4777-8777-777777777777', 'Hospital Serra Verde');

insert into usuarios (id, organizacao_id, nome, perfil) values
  ('66666666-6666-4666-8666-666666666661', null, 'Helena Prado', 'avaliador_ibes'),
  ('66666666-6666-4666-8666-666666666662', null, 'Miguel Alves', 'responsavel_ibes'),
  (
    '66666666-6666-4666-8666-666666666663',
    '77777777-7777-4777-8777-777777777777',
    'Lúcia Benites',
    'gestor_instituicao'
  );

insert into padroes (id, manual_id, codigo, titulo, grupo, obrigatorio, imprescindivel) values
  ('55555555-5555-4555-8555-555555555501', '11111111-1111-4111-8111-111111111111', '5.01.01', 'A pessoa recebe informação para consentir o cuidado', 'I', true, false),
  ('55555555-5555-4555-8555-555555555502', '11111111-1111-4111-8111-111111111111', '5.01.02', 'A identificação é conferida antes da dispensação', 'I', true, false),
  ('55555555-5555-4555-8555-555555555503', '11111111-1111-4111-8111-111111111111', '5.02.01', 'O atendimento preserva a privacidade', 'I', true, false),
  ('55555555-5555-4555-8555-555555555504', '11111111-1111-4111-8111-111111111111', '5.05.01', 'Medicamentos de alta vigilância têm barreira e dupla checagem', 'I', true, false),
  ('55555555-5555-4555-8555-555555555505', '11111111-1111-4111-8111-111111111111', '5.01.03', 'A orientação de alta chega por escrito', 'I', false, false),
  ('55555555-5555-4555-8555-555555555506', '11111111-1111-4111-8111-111111111111', '5.03.01', 'O horário de entrega cobre a continuidade do tratamento', 'I', false, false),
  ('55555555-5555-4555-8555-555555555507', '11111111-1111-4111-8111-111111111111', '5.04.01', 'O sistema registra prescrição, dispensação e devolução', 'II', false, true),
  ('55555555-5555-4555-8555-555555555508', '11111111-1111-4111-8111-111111111111', '5.06.01', 'O lote dispensado é rastreável até o paciente', 'II', false, false),
  ('55555555-5555-4555-8555-555555555509', '11111111-1111-4111-8111-111111111111', '5.06.02', 'A sala de manipulação estéril tem fluxo separado', 'II', false, false),
  ('55555555-5555-4555-8555-555555555510', '11111111-1111-4111-8111-111111111111', '5.11.01', 'Resultados assistenciais são publicados para a rede', 'III', false, false),
  ('55555555-5555-4555-8555-555555555511', '11111111-1111-4111-8111-111111111111', '5.11.02', 'Há projeto de ensino com resultado compartilhado', 'III', false, false),
  ('55555555-5555-4555-8555-555555555512', '11111111-1111-4111-8111-111111111111', '5.11.03', 'Há ação de uso racional aberta à comunidade', 'III', false, false);

insert into projetos (id, organizacao_id, manual_id, nome, estado)
values (
  '22222222-2222-4222-8222-222222222222',
  '77777777-7777-4777-8777-777777777777',
  '11111111-1111-4111-8111-111111111111',
  'UGC Farmácia',
  'rascunho'
);

select set_config('app.motivo_estado', 'Relatório de diagnóstico anexado', false);
update projetos set estado = 'diagnostico' where id = '22222222-2222-4222-8222-222222222222';

select set_config('app.perfil', 'responsavel_ibes', false);
select set_config('app.motivo_estado', 'Instituição iniciou o registro de evidências', false);
update projetos set estado = 'autoavaliacao' where id = '22222222-2222-4222-8222-222222222222';

select set_config('app.motivo_estado', 'Visita da rodada 2', false);
update projetos set estado = 'avaliacao' where id = '22222222-2222-4222-8222-222222222222';

insert into diagnosticos (id, projeto_id, avaliador_id, realizado_em, anexo_nome, anexo_caminho)
values (
  '33333333-3333-4333-8333-333333333333',
  '22222222-2222-4222-8222-222222222222',
  '66666666-6666-4666-8666-666666666661',
  '2026-08-12',
  'relatorio-diagnostico-serra-verde.pdf',
  'diagnosticos/serra-verde/relatorio-diagnostico-serra-verde.pdf'
);

insert into padroes_nao_aplicaveis (
  projeto_id, padrao_id, diagnostico_id, origem, registrado_por
) values (
  '22222222-2222-4222-8222-222222222222',
  '55555555-5555-4555-8555-555555555509',
  '33333333-3333-4333-8333-333333333333',
  'diagnostico',
  '66666666-6666-4666-8666-666666666661'
);

insert into avaliacoes (id, projeto_id, rodada, tipo) values
  ('44444444-4444-4444-8444-444444444441', '22222222-2222-4222-8222-222222222222', 1, 'certificacao'),
  ('44444444-4444-4444-8444-444444444442', '22222222-2222-4222-8222-222222222222', 2, 'certificacao');

insert into conformidades (avaliacao_id, padrao_id, cumprido)
select '44444444-4444-4444-8444-444444444442', id, codigo in (
  '5.01.01', '5.01.02', '5.02.01', '5.05.01', '5.01.03', '5.03.01', '5.04.01', '5.11.01'
)
from padroes
where codigo <> '5.06.02';

insert into evidencias (projeto_id, padrao_id, avaliacao_id, descricao, criada_em) values
  (
    '22222222-2222-4222-8222-222222222222',
    '55555555-5555-4555-8555-555555555502',
    '44444444-4444-4444-8444-444444444441',
    'POP de dispensação revisado em março, com checklist de identificação.',
    '2026-09-02 11:20:00-03'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '55555555-5555-4555-8555-555555555502',
    '44444444-4444-4444-8444-444444444442',
    'Observação de 8 dispensações em 02/10. A identificação foi conferida em todas.',
    '2026-10-03 16:40:00-03'
  );
