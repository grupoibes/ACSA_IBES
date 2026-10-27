(() => {
'use strict';
if (window.__acsasV03) return;
window.__acsasV03 = true;
const HOJE = '2026-10-27';
document.documentElement.lang = 'pt-BR';
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY = 'acsas-ibes-modern-v5';
const LOGO_KEY = 'acsas-ibes-logo';
const LOGO_OFICIAL = '/brand/ibes-emblema.png';
const LOGO = LOGO_OFICIAL;
try { localStorage.removeItem(LOGO_KEY); } catch (e) {}
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const br = iso => iso ? iso.slice(8,10) + '/' + iso.slice(5,7) + '/' + iso.slice(0,4) : '—';
const brdt = s => s ? br(s.slice(0,10)) + ' ' + s.slice(11,16) : '—';
const addMeses = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0,10); };
const addDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const difDias = (a, b) => Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / 864e5);
const agora = () => HOJE + ' ' + new Date().toTimeString().slice(0,5);
const pct = (a, b) => { if (!b) return '—'; const v = a * 100 / b; return (Number.isInteger(Math.round(v * 10) / 10) ? String(Math.round(v)) : v.toFixed(1).replace('.', ',')) + '%'; };
const ic = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  chev:'<path d="m9 6 6 6-6 6"/>', left:'<path d="m15 6-6 6 6 6"/>', check:'<path d="m5 12 5 5L20 7"/>', menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', clip:'<path d="m21 11-8.6 8.6a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15.5 7"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>', list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', chart:'<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
  pin:'<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', clip2:'<path d="M9 5h6M9 3h6v4H9zM6 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1M8 13l3 3 5-6"/>',
  steps:'<path d="M4 6h4v4H4zM10 8h10M4 14h4v4H4zM10 16h10"/>', folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  log:'<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/>', gauge:'<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4-6"/>', grid:'<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>', scope:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>', test:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>'
};

/* ---------- manual de demonstração (conteúdo fictício) ---------- */
const BLOCOS = [
  ['01','A pessoa como sujeito ativo',1,['Acolhimento e identificação na chegada','Informação sobre direitos do usuário','Participação do paciente no plano de cuidado','Consentimento antes de procedimentos de risco','Privacidade e confidencialidade no atendimento','Canal de sugestões e reclamações','Respeito a crenças e preferências','Apoio a acompanhantes e familiares','Comunicação acessível a pessoas com deficiência','Pesquisa de experiência do paciente','Devolutiva das reclamações recebidas']],
  ['02','Acessibilidade e continuidade assistencial',1,['Tempo de espera monitorado','Agendamento com critérios definidos','Continuidade do cuidado entre turnos','Transferência segura entre unidades','Plano de alta compartilhado','Contato pós-alta para pacientes de alto risco','Acesso para pessoas com mobilidade reduzida','Sinalização interna clara','Atendimento de urgência organizado','Integração com a rede de saúde']],
  ['03','Informação clínica',1,['Prontuário único por paciente','Registro multiprofissional integrado','Guarda e acesso controlado ao prontuário','Auditoria da qualidade dos registros','Relatório de alta entregue ao paciente']],
  ['04','Gestão por processos assistenciais',2,['Mapa de processos assistenciais','Protocolos clínicos atualizados','Indicadores por processo','Revisão periódica dos protocolos','Gestão de riscos por processo']],
  ['05','Promoção da saúde e qualidade de vida',2,['Ações de promoção da saúde','Orientação sobre hábitos de vida','Prevenção de infecções','Vacinação dos profissionais','Educação em saúde para pacientes','Parcerias com a comunidade']],
  ['06','Direção e planejamento estratégico',2,['Missão, visão e valores divulgados','Plano estratégico com metas','Acordo de gestão com a direção','Reuniões de análise crítica','Orçamento vinculado às metas','Comunicação interna estruturada','Gestão de documentos','Comitês institucionais ativos','Gestão de contratos de serviços','Sustentabilidade ambiental','Responsabilidade social']],
  ['07','Profissionais',3,['Dimensionamento de equipes','Integração de novos profissionais','Plano de desenvolvimento de competências','Avaliação de desempenho','Educação permanente','Saúde do trabalhador','Clima organizacional medido','Reconhecimento de boas práticas','Pesquisa e inovação','Gestão de escalas']],
  ['08','Estrutura, equipamentos e fornecedores',4,['Manutenção preventiva de equipamentos','Calibração de instrumentos','Inventário de equipamentos críticos','Gestão de fornecedores','Controle de estoque de medicamentos','Rastreabilidade de materiais','Plano de contingência de energia','Segurança predial','Gestão de resíduos','Limpeza e higienização','Controle de acesso físico','Qualidade da água']],
  ['09','Sistemas e tecnologias de informação e comunicação',4,['Sistema de informação integrado','Segurança da informação','Cópias de segurança testadas','Política de privacidade de dados','Suporte técnico com prazos','Telessaúde regulamentada','Indicadores extraídos do sistema']],
  ['10','Ferramentas da qualidade e segurança',5,['Núcleo de segurança do paciente','Notificação de incidentes','Análise de causa de eventos','Identificação segura do paciente','Cirurgia segura','Prevenção de quedas','Prevenção de lesão por pressão','Uso seguro de medicamentos','Higiene das mãos','Auditorias internas da qualidade']],
  ['11','Resultados da unidade de gestão clínica',5,['Painel de indicadores assistenciais','Metas definidas por indicador','Análise de tendências','Resultados de satisfação','Resultados de segurança','Resultados de efetividade clínica','Resultados de eficiência','Comparação com referências externas','Planos de ação para desvios','Divulgação de resultados às equipes','Resultados de pessoas','Resultados de sustentabilidade']]
];
const QUEDAS = 'ES 5 10.06_01';
const DETALHE = {
  'ES 5 10.04_02': {def:'A unidade identifica cada paciente com dois identificadores em todos os pontos de cuidado.', prop:'Evitar erros de paciente em medicação, exames, transfusão e procedimentos.', el:['Pulseira com dois identificadores em todos os internados','Conferência verbal antes de medicação, exames e transfusão','Auditoria mensal de conformidade com devolutiva às equipes']},
  'ES 5 10.06_01': {def:'A unidade avalia o risco de queda e aplica medidas preventivas registradas.', prop:'Reduzir quedas e os danos associados a elas.', el:['Escala de risco aplicada na admissão e a cada 24 horas','Medidas preventivas sinalizadas no leito','Notificação e análise de todas as quedas']},
  'ES 5 01.04_02': {def:'A unidade registra o consentimento do paciente antes de procedimentos de risco.', prop:'Garantir que o paciente decida com informação clara e suficiente.', el:['Termo específico por tipo de procedimento','Registro de quem informou e quando','Versão acessível para pacientes com baixa escolaridade']}
};
const PAD = [];
BLOCOS.forEach(([n, nome, eixo, titulos]) => titulos.forEach((t, k) => {
  const kk = String(k + 1).padStart(2, '0'), v = (k % 3 === 2) ? '01' : '02', id = `ES 5 ${n}.${kk}_${v}`;
  const d = DETALHE[id];
  PAD.push({id, bloco:n, eixo, t, def: d ? d.def : `A unidade comprova: ${t.toLowerCase()}.`,
    prop: d ? d.prop : 'Texto fictício de demonstração. No sistema, o propósito vem do manual importado pelo IBES.',
    el: d ? d.el : ['Elemento avaliável 1 (texto do manual importado)','Elemento avaliável 2 (texto do manual importado)'], det: !!d});
}));
(() => {
  let s = 11; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const ord = PAD.map((_, i) => i); for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
  const fix = Object.keys(DETALHE).map(id => PAD.findIndex(p => p.id === id)).filter(i => i >= 0);
  const seq = [...fix, ...ord.filter(i => !fix.includes(i))];
  seq.forEach((i, k) => { PAD[i].g = k < 65 ? 'I' : k < 88 ? 'II' : 'III'; PAD[i].ob = k < 41; });
})();
const PMAP = Object.fromEntries(PAD.map(p => [p.id, p]));
const BMAP = Object.fromEntries(BLOCOS.map(b => [b[0], b]));
const CLASSES = ['Procedimento','Ata','Registro de treinamento','Relatório de auditoria','Indicador','Política','Contrato'];
const PAPEIS = {
  resp:{n:'Paula Ribeiro', l:'Responsável do projeto', cli:true}, upload:{n:'Carlos Menezes', l:'Responsável pelo upload', cli:true},
  conf:{n:'Luana Prado', l:'Conferente', cli:true}, chan:{n:'Fernando Lopes', l:'Autorizador (chancela)', cli:true},
  back:{n:'Backoffice IBES', l:'Backoffice IBES'}, aval:{n:'Avaliador B', l:'Avaliador'}, lider:{n:'Avaliadora A', l:'Avaliador líder'}, comite:{n:'Membro F', l:'Membro do Comitê de Certificação'}, comite2:{n:'Membro G', l:'Membro do Comitê de Certificação'}, admin:{n:'Administração IBES', l:'Administrador IBES'}
};
const ROM = ['','I','II','III','IV','V'];
const ETAPAS_BASE = ['Diagnóstico','Solicitação','Autoavaliação','Avaliação','Certificação'];
const E = {DIAG:0, SOL:1, AUTO:2, AVAL:3, CERT:4};
const ESTADOS = ['Em curso','Acreditado','Recusado','Abandonado','Vencido','Cancelado','Pendente','Suspensão','Retirado','Denegado'];
const RES = {em_curso:'Em curso', positiva:'Positiva', negativa:'Negativa'};
const QUORUM = 2;
const PRAZO0 = {'Diagnóstico':'2025-09-12','Solicitação':'2025-10-14','Autoavaliação':'2026-12-15','Avaliação':'2027-02-26','Certificação':'2027-03-31'};
const CHK = ['ES 5 10.04_02', QUEDAS, 'ES 5 01.04_02', 'ES 5 03.01_02', 'ES 5 08.01_02', 'ES 5 11.01_02'];

function inicial() {
  const docs = [
    ['Procedimento de identificação do paciente','Procedimento'],['Ata da reunião mensal da qualidade','Ata'],['Lista de presença: treinamento de segurança','Registro de treinamento'],
    ['Auditoria de prontuários, 3º trimestre','Relatório de auditoria'],['Painel de indicadores assistenciais','Indicador'],['Política de segurança do paciente','Política'],
    ['Contrato de manutenção de equipamentos','Contrato'],['Procedimento de prevenção de quedas','Procedimento'],['Escala de risco de queda: modelo','Procedimento'],
    ['Plano estratégico 2026','Política'],['Lista de presença: integração de novos profissionais','Registro de treinamento'],['Relatório de satisfação do paciente','Indicador']
  ].map(([n, c], i) => ({id:'D' + (i + 1), n, c, v:[{n:1, d:addDias('2026-03-02', i * 9) + ' 10:' + String(10 + i).padStart(2, '0'), u:'Carlos Menezes'}].concat(i % 4 === 0 ? [{n:2, d:addDias('2026-08-03', i) + ' 15:20', u:'Marta Souza'}] : [])}));
  const st = {}, resp = {}, evid = {};
  PAD.forEach(p => st[p.id] = 'PTE');
  const gi = PAD.filter(p => p.g === 'I');
  const cumpridos = [...gi.filter(p => p.ob && p.id !== QUEDAS), ...gi.filter(p => !p.ob).slice(0, 7)];
  let k = 0;
  const ev = (t, ds, etapa, dia, extra) => ({id:'E' + (++k), t, docs:ds, autor:'Carlos Menezes', d:dia + ' 09:' + String(10 + (k % 40)).padStart(2, '0'), etapa,
    conf: etapa !== 'Enviada' ? {u:'Luana Prado', d:addDias(dia, 2) + ' 14:05'} : null, chan: etapa === 'Chancelada' ? {u:'Fernando Lopes', d:addDias(dia, 4) + ' 11:30'} : null, ...(extra || {})});
  cumpridos.forEach((p, i) => {
    st[p.id] = 'C'; resp[p.id] = {bin:'sim', qual:'Atende aos elementos avaliáveis. Ver evidências vinculadas.'};
    evid[p.id] = [ev('Documentos vinculados respondem aos elementos avaliáveis deste padrão.', [docs[i % 12].id], 'Chancelada', addDias('2026-05-04', i % 60))];
  });
  evid['ES 5 10.04_02'] = [ev('Elementos 1 e 2: pulseira com dois identificadores e conferência verbal no checklist de medicação.', ['D1','D3'], 'Chancelada', '2026-09-21'), ev('Elemento 3: auditoria mensal apresentada na reunião da qualidade.', ['D2','D4'], 'Chancelada', '2026-10-02')];
  resp[QUEDAS] = {bin:'sim', qual:'Escala aplicada na admissão. Reaplicação diária no plantão noturno em implantação.'};
  evid[QUEDAS] = [ev('Procedimento revisado e modelo da escala de risco em uso em todas as unidades.', ['D8','D9','D3'], 'Enviada', '2026-10-20')];
  const g2 = PAD.filter(p => p.g === 'II');
  resp[g2[0].id] = {bin:'sim', qual:'Revisão anual aprovada pelo comitê.'}; evid[g2[0].id] = [ev('Ata de aprovação da revisão anual.', ['D2'], 'Conferida', '2026-10-14')];
  resp[g2[1].id] = {bin:'nao', qual:'Processo ainda não implantado.'};
  resp[g2[2].id] = {bin:'sim', qual:''}; evid[g2[2].id] = [ev('Relatório sem data e sem assinatura.', ['D12'], 'Devolvida', '2026-10-08', {dev:{u:'Luana Prado', d:'2026-10-09 10:40', motivo:'Documento sem data e sem assinatura do responsável.'}})];
  const g3 = PAD.filter(p => p.g === 'III' && !CHK.includes(p.id));
  const na = {}; [g3[0], g3[1]].forEach(p => { st[p.id] = 'NA'; na[p.id] = {u:'Avaliadora A', d:'2025-09-12 16:00', o:'Diagnóstico'}; });
  const perm = {u1:{}};
  BLOCOS.forEach(([n], i) => { perm.u1[n] = i < 4 || i >= 9 ? 'redacao' : i < 7 ? 'leitura' : 'sem'; });
  return {
    view:'auto', papel:'resp', std:QUEDAS, f:{I:true, II:true, III:true, ob:false}, busca:'', aberto:{'10':true}, nivelTab:'Avançado', bibF:'', bibQ:'', logF:'',
    st, resp, evid, docs, perm, sug:{}, achados:{}, rel:false, verHist:{},
    etapa:E.AUTO, ciclos:1, prazos:{}, feitas:{'Diagnóstico':'2025-09-12','Solicitação':'2025-10-14'}, logado:false, testes:{}, diagF:'01',
    diag:{aval:'Avaliadora A', data:'2025-09-12', doc:'Relatório de diagnóstico 2025-009.pdf', u:'Backoffice IBES', reg:'2025-09-15 10:00'},
    aval:{rodada:1, res:'em_curso', hist:[]}, pareceres:[], cert:null,
    histEstado:[{d:'2025-10-14 15:20', u:'Backoffice IBES', de:'—', para:'Em curso', mot:'Candidatura validada e projeto aberto'}],
    estado:'Em curso', na, nivelFinal:null, resols:[], pontosOk:false,
    cands:[{cod:'2026/015', cli:'Clínica Exemplo Leste', d:'2026-10-20', st:'Aguardando validação', mot:''}, {cod:'2026/016', cli:'Hospital Fictício do Vale', d:'2026-10-23', st:'Aguardando validação', mot:''}],
    pontos:[{tipo:'forte', t:'Auditoria mensal de identificação do paciente com devolutiva às equipes.', u:'Avaliadora A'},
      {tipo:'forte', t:'Biblioteca de documentos organizada e versionada.', u:'Avaliador B'},
      {tipo:'fraco', t:'Escala de risco de queda sem reaplicação no plantão noturno.', u:'Avaliador B'}],
    visitas:[{id:'V1', tipo:'Certificação', data:'2027-02-22', equipe:['Avaliadora A','Avaliador B'], lider:'Avaliadora A', rodada:1}],
    usuarios:[['Paula Ribeiro','resp',1],['Carlos Menezes','upload',1],['Luana Prado','conf',1],['Fernando Lopes','chan',1],['Marta Souza','upload',1],['Jorge Lima','upload',1],['Bianca Rocha','conf',1],['Otávio Reis','upload',0]].map(([n, p, a]) => ({n, p, a:!!a})),
    equipe:[['Avaliadora A','Avaliador líder'],['Avaliador B','Avaliador'],['Avaliador C','Avaliador'],['Educadora D','Educador'],['Tutor E','Tutor de relatório'],['Membro F','Comitê de Certificação'],['Membro G','Comitê de Certificação'],['Backoffice IBES','Backoffice']].map(([n, f]) => ({n, f})),
    areas:[
      {id:'A1', std:QUEDAS, t:'Escala de risco de queda não é reaplicada no plantão noturno.', fase:'Planejada', resp:'Carlos Menezes', ini:'2026-10-01', fim:'2026-10-20', concl:null},
      {id:'A2', std:'ES 5 03.02_02', t:'Evolução da fisioterapia registrada fora do prontuário eletrônico.', fase:'Detectada', resp:'', ini:null, fim:null, concl:null},
      {id:'A3', std:'ES 5 08.01_02', t:'Cronograma de manutenção preventiva sem os ventiladores novos.', fase:'Planejada', resp:'Jorge Lima', ini:'2026-10-10', fim:'2026-11-14', concl:null},
      {id:'A4', std:'ES 5 06.04_02', t:'Atas de análise crítica sem plano de ação registrado.', fase:'Concluída', resp:'Paula Ribeiro', ini:'2026-09-01', fim:'2026-09-30', concl:'2026-09-26'}],
    log:[
      ['2026-10-20 09:12','Carlos Menezes','Responsável pelo upload','Evidência','Evidência enviada para conferência',QUEDAS],
      ['2026-10-14 16:40','Luana Prado','Conferente','Evidência','Evidência conferida',PAD.filter(p => p.g === 'II')[0].id],
      ['2026-10-09 10:40','Luana Prado','Conferente','Evidência','Evidência devolvida: documento sem data e sem assinatura',PAD.filter(p => p.g === 'II')[2].id],
      ['2026-10-09 10:41','Sistema','—','E-mail','E-mail de devolução enviado ao Responsável pelo upload',''],
      ['2026-10-02 11:30','Fernando Lopes','Autorizador (chancela)','Evidência','Evidência chancelada','ES 5 10.04_02'],
      ['2026-04-09 08:00','Backoffice IBES','Backoffice IBES','Etapa','Etapa alterada: Solicitação → Autoavaliação','Projeto 2025/009'],
      ['2026-04-09 08:01','Sistema','—','E-mail','E-mail de início da autoavaliação enviado ao Responsável do projeto',''],
      ['2025-09-15 10:00','Backoffice IBES','Backoffice IBES','Diagnóstico','Diagnóstico registrado: 2 padrões não se aplicam','Projeto 2025/009'],
      ['2025-10-14 15:20','Backoffice IBES','Backoffice IBES','Candidatura','Candidatura validada','Projeto 2025/009'],
      ['2025-10-14 15:22','Backoffice IBES','Backoffice IBES','Usuário','Usuários do cliente cadastrados (8)','Projeto 2025/009']
    ].map(([d, u, p, t, a, o]) => ({d, u, p, t, a, o}))
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || inicial(); } catch (e) { S = inicial(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const eu = () => PAPEIS[S.papel];
function log(t, a, o) { S.log.unshift({d:agora(), u:eu().n, p:eu().l, t, a, o:o || ''}); }
function email(a) { S.log.unshift({d:agora(), u:'Sistema', p:'—', t:'E-mail', a, o:''}); }

/* ---------- regras ---------- */
const REGRAS = {'Avançado':{I:.7, II:0, III:0}, 'Ótimo':{I:1, II:.4, III:0}, 'Excelente':{I:1, II:1, III:.4}};
const respondido = id => !!(S.resp[id] && S.resp[id].bin);
const chancelada = id => (S.evid[id] || []).some(e => e.etapa === 'Chancelada');
const preenchido = id => respondido(id) && chancelada(id);
function calc() {
  const ok = a => a.filter(p => S.st[p.id] === 'C').length, rp = a => a.filter(p => respondido(p.id)).length;
  const ap = a => a.filter(p => S.st[p.id] !== 'NA'), AP = ap(PAD);
  const gi = ap(PAD.filter(p => p.g === 'I')), ob = gi.filter(p => p.ob), nob = gi.filter(p => !p.ob), g2 = ap(PAD.filter(p => p.g === 'II')), g3 = ap(PAD.filter(p => p.g === 'III'));
  const atinge = n => { const r = REGRAS[n]; return ok(gi) >= Math.ceil(gi.length * r.I) && ok(ob) === ob.length && ok(g2) >= Math.ceil(g2.length * r.II) && ok(g3) >= Math.ceil(g3.length * r.III); };
  const nivel = atinge('Excelente') ? 'Excelente' : atinge('Ótimo') ? 'Ótimo' : atinge('Avançado') ? 'Avançado' : null;
  const linhas = n => { const r = REGRAS[n], mGI = Math.ceil(gi.length * r.I); return [
    {l:'Grupo I', a:gi, min:mGI, minp:Math.round(r.I * 100) + '%'},
    {l:'Obrigatório', a:ob, min:ob.length, minp:'100%', sub:true},
    {l:'Não obrigatório', a:nob, min:Math.max(0, mGI - ob.length), minp:'', sub:true},
    {l:'Grupo II', a:g2, min:r.II ? Math.ceil(g2.length * r.II) : null, minp:r.II ? Math.round(r.II * 100) + '%' : ''},
    {l:'Grupo III', a:g3, min:r.III ? Math.ceil(g3.length * r.III) : null, minp:r.III ? Math.round(r.III * 100) + '%' : ''},
    {l:'Total aplicável', a:AP, min:null, minp:'', tot:true}].map(x => ({...x, min:x.a.length ? x.min : null, n:x.a.length, ok:ok(x.a), rp:rp(x.a)})); };
  return {nivel, linhas, gi, ob, g2, g3, ok, rp, okN:ok(AP), AP, aplic:AP.length, naN:PAD.length - AP.length};
}
const temBase = id => respondido(id) && S.resp[id].bin === 'sim' && (chancelada(id) || S.areas.some(a => a.std === id && a.fase === 'Concluída'));
const vencida = a => a.fase === 'Planejada' && a.fim && a.fim < HOJE;
const janela = v => [addDias(v.data, -35), addDias(v.data, 35)];
const restricao = () => S.visitas.find(v => { const [a, b] = janela(v); return HOJE >= a && HOJE <= b; });
const cliente = () => !!eu().cli;
const travado = () => cliente() && !!restricao();
function permBloco(id) { if (S.papel !== 'upload') return 'redacao'; return S.perm.u1[PMAP[id].bloco]; }
const podeResponder = id => !travado() && (S.papel === 'resp' || (S.papel === 'upload' && permBloco(id) === 'redacao'));
const podeVer = id => !(S.papel === 'upload' && permBloco(id) === 'sem');
const podeConferir = () => !travado() && S.papel === 'conf';
const podeChancelar = () => !travado() && S.papel === 'chan';
const ibesEtapa = () => S.papel === 'back' || S.papel === 'admin';
const podeNA = () => ['back','admin'].includes(S.papel);
const vePadrao = id => !(cliente() && S.st[id] === 'NA');
const membroComite = () => S.papel === 'comite' || S.papel === 'comite2';
const manutAtual = () => { const v = S.visitas[0]; return !!v && v.tipo.startsWith('Manutenção'); };
const chkv = () => CHK.filter(id => S.st[id] !== 'NA' && (!manutAtual() || PMAP[id].g !== 'III'));
const resolRodada = () => S.resols.find(r => r.rodada === S.aval.rodada);
function prazo(n) {
  if (S.prazos[n]) return S.prazos[n];
  if (PRAZO0[n]) return PRAZO0[n];
  const base = S.cert ? S.cert.emissao : PRAZO0['Certificação'];
  if (n === 'Recertificação') return addMeses(base, 60);
  const k = +n.replace(/\D/g, '');
  return addMeses(base, Math.round(60 * k / (S.ciclos + 1)));
}
const etapas = () => [...ETAPAS_BASE, ...Array.from({length:S.ciclos}, (_, i) => 'Manutenção ' + (i + 1)), 'Recertificação'];
function bloqueios() {
  if (S.etapa === E.DIAG) return S.diag ? [] : [['Diagnóstico', 'não registrado']];
  if (S.etapa === E.AUTO) return PAD.filter(p => p.ob && S.st[p.id] !== 'NA' && !preenchido(p.id)).map(p => [p.id, !respondido(p.id) ? 'sem resposta' : 'sem evidência chancelada']);
  if (S.etapa === E.AVAL) {
    const b = chkv().filter(id => !(S.achados[id] && S.achados[id].r)).map(id => [id, 'sem resultado no relatório do avaliador']);
    if (S.aval.res !== 'positiva') b.push(['Resultado da avaliação', S.aval.res === 'negativa' ? 'negativo: abrir nova rodada' : 'ainda em curso']);
    const r = resolRodada(); if (!(r && r.dec === 'conceder')) b.push(['Comitê de Certificação', 'resolução de concessão pendente']);
    return b;
  }
  return [];
}

const dots = n => { const k = n === 'Excelente' ? 3 : n === 'Ótimo' ? 2 : n === 'Avançado' ? 1 : 0; return `<span class="dots" aria-hidden="true">${[0,1,2].map(i => `<i class="${i < k ? 'on' : ''}"></i>`).join('')}</span>`; };
const nivelHtml = n => `<span class="lvl">${dots(n)}<span>${n || 'Abaixo de Avançado'}</span></span>`;
const chip = s => `<span class="chip code c-${s}" title="${s === 'NA' ? 'Não se aplica' : s === 'C' ? 'Cumpre' : 'Pendente'}">${s}</span>`;
const evChip = e => `<span class="chip ${e === 'Chancelada' ? 'c-C' : e === 'Conferida' ? 'c-info' : e === 'Devolvida' ? 'c-bad' : 'c-warn'}">${e}</span>`;
const sec = (titulo, corpo, extra = '', flush = false) => `<section class="sec"><div class="sec-h"><h2>${titulo}</h2>${extra}</div><div class="sec-b${flush ? ' flush' : ''}">${corpo}</div></section>`;
const kv = items => `<dl class="kv">${items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const stdLink = id => id && PMAP[id] ? `<button type="button" class="btn link mono" data-act="padrao" data-v="${id}">${id}</button>` : esc(id);
const avisoRestricao = () => { const v = restricao(); if (!v) return ''; const [a, b] = janela(v); return `<div class="note n-warn">Período de restrição da avaliação de ${br(v.data)}: de ${br(a)} a ${br(b)} o cliente só consulta a plataforma. ${cliente() ? 'Envios, respostas e aprovações estão bloqueados.' : ''}</div>`; };

/* ---------- logotipo e entrada ---------- */
const logoHtml = () => LOGO ? `<img class="logo-img" src="${LOGO}" alt="GRUPO IBES · Gerando valor para a saúde desde 2012">`
  : `<span class="logo-ph" role="img" aria-label="Espaço reservado para o logotipo oficial do GRUPO IBES"><span><b>LOGOTIPO OFICIAL</b><br>GRUPO IBES · arquivo pendente</span></span>`;
function vEntrada() {
  const op = cli => Object.entries(PAPEIS).filter(([, p]) => !!p.cli === cli).map(([k, p]) => `<option value="${k}" ${S.papel === k ? 'selected' : ''}>${p.l}${k.startsWith('comite') ? ' · ' + p.n.slice(-1) : ''}</option>`).join('');
  return `<div class="ent"><div class="ent-card">
    <div class="logo-big">${logoHtml()}</div>
    <div><h1>ACSAS IBES MODERN</h1><p class="muted" style="margin-top:6px">Plataforma de acreditação do IBES</p><div style="margin-top:10px"><span class="envchip" style="margin:0">Beta v0.3 · Tester</span><span class="envchip hom">Homologação</span></div></div>
    <form class="ent-form" id="f-ent" novalidate>
      <div class="field"><label for="ent-papel">Entrar como (perfil de teste)</label><select id="ent-papel"><optgroup label="Cliente">${op(true)}</optgroup><optgroup label="IBES">${op(false)}</optgroup></select></div>
      <button type="submit" class="btn pri">Entrar no ambiente de teste</button>
      <p class="muted" style="font-size:12px">No sistema final o acesso é por login e senha. Aqui você escolhe o perfil para testar as permissões. Manual, clientes e pessoas são fictícios.</p>
    </form>
  </div></div>`;
}

/* ---------- moldura ---------- */
const VIEWS = {testes:'Roteiro de testes v0.3', diagnostico:'Diagnóstico e escopo', projetos:'Índice de projetos', ficha:'Ficha do projeto', workflow:'Workflow e prazos', usuarios:'Usuários', indicadores:'Indicadores', log:'Painel de log',
  auto:'Autoavaliação', padrao:'Ficha de autoavaliação', biblioteca:'Biblioteca de documentos', autoav:'Atribuição por critério', melhoria:'Planos de ação', relatorios:'Relatórios e listas', avaliacao:'Agendamento e relatório', comite:'Comitê de Certificação'};
function frame() {
  const nav = [['projetos','Início'],['avaliacao','Avaliações'],['workflow','Manutenção'],['testes','Testes v0.3']];
  $('#logo-top').innerHTML = logoHtml();
  $('#mainnav').innerHTML = nav.map(([k, l]) => `<button type="button" data-act="go" data-v="${k}" ${k === S.view ? 'aria-current="page"' : ''}>${l}</button>`).join('');
  $('#papel').value = S.papel;
  const dentro = !['projetos','testes'].includes(S.view);
  const crumbs = dentro ? [['projetos','Projetos'], ['ficha','Projeto 2025/009']] : [[null, VIEWS[S.view]]];
  if (['padrao','autoav','relatorios','biblioteca'].includes(S.view)) crumbs.push(['auto','Autoavaliação']);
  if (dentro && S.view !== 'ficha') crumbs.push([null, VIEWS[S.view]]); else if (dentro) crumbs.push([null, 'Ficha do projeto']);
  $('#ctx').innerHTML = `<div class="crumb">${dentro ? `<button type="button" class="btn sm menu-btn" data-act="menu">${ic(I.menu)}Menu do projeto</button>` : ''}${crumbs.map(([v, l], i) => (i ? '<span class="sep" aria-hidden="true">/</span>' : '') + (v ? `<button type="button" data-act="go" data-v="${v}">${l}</button>` : `<span>${l}</span>`)).join('')}</div>
    ${dentro ? `<div class="ctx-r"><span class="mono">2025/009</span><span>Hospital Modelo de Demonstração</span><span class="chip c-info">${etapas()[S.etapa]}</span>${S.etapa === E.AVAL ? `<span class="chip c-neu">Rodada ${S.aval.rodada}</span>` : ''}</div>` : ''}`;
  const pm = $('#pmenu');
  if (!dentro) { pm.innerHTML = ''; pm.style.display = 'none'; return; }
  pm.style.display = '';
  S.naN = PAD.filter(p => S.st[p.id] === 'NA').length;
  const pend = PAD.filter(p => S.st[p.id] === 'PTE').length, venc = S.areas.filter(vencida).length;
  const fila = Object.values(S.evid).flat().filter(e => e.etapa === (S.papel === 'chan' ? 'Conferida' : 'Enviada')).length;
  const it = (v, l, icon, badge) => `<button type="button" data-act="go" data-v="${v}" ${S.view === v ? 'aria-current="page"' : ''}>${ic(icon)}<span>${l}</span>${badge ? `<span class="badge chip c-neu num">${badge}</span>` : ''}</button>`;
  pm.innerHTML = `<h3>Projeto</h3>${it('ficha','Ficha do projeto',I.file)}${cliente() ? '' : it('diagnostico','Diagnóstico e escopo',I.scope, S.naN || '')}${it('workflow','Workflow e prazos',I.steps, bloqueios().length ? 'bloq.' : '')}${it('usuarios','Usuários',I.users)}${it('indicadores','Indicadores',I.gauge)}${it('log','Painel de log',I.log)}
    <h3>Autoavaliação</h3>${it('auto','Painel da autoavaliação',I.list, pend)}${it('padrao','Ficha de autoavaliação',I.clip2, ['conf','chan'].includes(S.papel) && fila ? fila + ' na fila' : '')}${it('biblioteca','Biblioteca de documentos',I.folder, S.docs.length)}${it('autoav','Atribuição por critério',I.grid)}${it('melhoria','Planos de ação',I.flag, venc ? venc + ' venc.' : '')}${it('relatorios','Relatórios e listas',I.chart)}
    <h3>Avaliação</h3>${it('avaliacao','Agendamento e relatório',I.pin)}${it('comite','Comitê de Certificação',I.check, membroComite() && S.aval.res === 'positiva' && !resolRodada() ? 'pendente' : '')}`;
}

/* ---------- índice de projetos ---------- */
function vProjetos() {
  const proj = [['2025/009','Hospital Modelo de Demonstração', etapas()[S.etapa], prazo(etapas()[S.etapa]), S.cert ? S.cert.validade : null, true],
    ['2025/006','Clínica Exemplo Norte','Manutenção 1','2027-05-30','2027-06-15'],
    ['2024/011','Centro de Diagnóstico Fictício','Manutenção 2','2026-12-10','2026-11-30'],
    ['2024/003','Hospital Regional de Teste','Avaliação','2026-11-05',null],
    ['2023/014','Policlínica Exemplo Sul','Recertificação','2026-10-15','2026-10-31']];
  const sit = (prazo, venc) => { const d = difDias(HOJE, venc || prazo); return d < 0 ? '<span class="chip c-bad">Vencido</span>' : d <= 60 ? `<span class="chip c-warn">Vence em ${d} dias</span>` : '<span class="chip c-C">No prazo</span>'; };
  const vencs = proj.filter(p => p[4]).sort((a, b) => a[4] < b[4] ? -1 : 1);
  return `<div class="phead"><div><h1>Índice de projetos</h1><p>Etapa atual, prazo da etapa e vencimento da certificação de cada cliente. Só o projeto 2025/009 tem dados nesta demonstração.</p></div></div>
  ${sec('Projetos', `<div class="tbl"><table><thead><tr><th>Código</th><th>Cliente</th><th>Etapa atual</th><th>Prazo da etapa</th><th>Vencimento da certificação</th><th>Situação</th><th><span class="sr">Ação</span></th></tr></thead><tbody>
    ${proj.map(p => `<tr><td class="mono">${p[0]}</td><td>${p[1]}</td><td><span class="chip c-info">${p[2]}</span></td><td class="num">${br(p[3])}</td><td class="num">${p[4] ? br(p[4]) : '<span class="muted">Não certificado</span>'}</td><td>${sit(p[3], p[4])}</td>
    <td class="n">${p[5] ? '<button type="button" class="btn sm pri" data-act="go" data-v="ficha">Abrir projeto</button>' : '<button type="button" class="btn sm" disabled>Sem dados</button>'}</td></tr>`).join('')}</tbody></table></div>`, `<span class="chip c-neu num">${proj.length}</span>`, true)}
  ${sec('Candidaturas aguardando validação', `<div class="tbl"><table><thead><tr><th>Código</th><th>Instituição</th><th>Recebida em</th><th>Situação</th><th>Motivo da devolução</th><th><span class="sr">Ações</span></th></tr></thead><tbody>
    ${S.cands.map((k, i) => { const ab = k.st === 'Aguardando validação', pode = ibesEtapa() && ab; return `<tr><td class="mono">${k.cod}</td><td>${esc(k.cli)}</td><td class="num">${br(k.d)}</td><td><span class="chip ${ab ? 'c-warn' : k.st === 'Validada' ? 'c-C' : 'c-warn'}">${k.st}</span></td>
      <td>${ab ? `<label class="sr" for="cm-${i}">Motivo da devolução ${k.cod}</label><input class="obs" id="cm-${i}" placeholder="Obrigatório para devolver" ${pode ? '' : 'disabled'}>` : esc(k.mot) || '<span class="muted">—</span>'}</td>
      <td class="n" style="white-space:nowrap">${ab ? `<button type="button" class="btn sm pri" data-act="cand-ok" data-v="${i}" ${pode ? '' : 'disabled'}>Validar</button> <button type="button" class="btn sm" data-act="cand-rec" data-v="${i}" ${pode ? '' : 'disabled'}>Devolver</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="muted" style="font-size:12px;padding:8px 16px 12px">Candidatura devolvida volta ao solicitante para correção. ${ibesEtapa() ? '' : 'Só Backoffice e Administrador IBES validam. '}Recusa e abandono por contrato não são devolução: são estados do projeto, alterados só pelo IBES na Ficha do projeto.</p>`, `<span class="chip c-neu num">${S.cands.filter(k => k.st === 'Aguardando validação').length}</span>`, true)}
  ${sec('Vencimentos de certificação e recertificação', `<div class="tbl"><table><thead><tr><th>Código</th><th>Cliente</th><th>Vence em</th><th class="n">Dias</th></tr></thead><tbody>${vencs.map(p => `<tr><td class="mono">${p[0]}</td><td>${p[1]}</td><td class="num">${br(p[4])}</td><td class="n">${difDias(HOJE, p[4])}</td></tr>`).join('')}</tbody></table></div>`, '<span class="muted" style="font-size:12px">Alerta automático por e-mail 90, 60 e 30 dias antes</span>', true)}`;
}

/* ---------- linha do tempo e workflow ---------- */
function timeline() {
  const et = etapas();
  return `<div class="tl" role="list" style="grid-template-columns:repeat(${et.length},minmax(0,1fr))">${et.map((n, i) => { const done = i < S.etapa, cur = i === S.etapa;
    return `<div class="tl-s ${done ? 'done' : cur ? 'cur' : ''}" role="listitem"><span class="tl-dot">${done ? ic(I.check) : ''}</span><span class="tl-n">${n}</span><span class="tl-d">${done ? 'Realizada ' + br(S.feitas[n]) : 'Prazo ' + br(prazo(n))}</span><span class="sr">${done ? 'realizada' : cur ? 'atual' : 'futura'}</span></div>`; }).join('')}</div>`;
}
function vFicha(c) {
  return `<div class="phead"><div><h1>Ficha do projeto</h1><p>Dados do pedido, etapa atual e responsáveis.</p></div>
    ${ibesEtapa() ? '<button type="button" class="btn pri" data-act="go" data-v="workflow">Configurações do projeto</button>' : ''}</div>
  ${avisoRestricao()}
  ${sec('Projeto', kv([['Código','<span class="mono">2025/009</span>'],['Cliente','Hospital Modelo de Demonstração'],['Tipo','Acreditação'],['Manual e escopo','<span class="mono">ME 5 1_07</span> · Unidades de Gestão Clínica Hospitalares'],
      ['Estado', `<span class="chip c-info">${S.estado}</span>`],['Padrões aplicáveis', cliente() ? `<span class="num">${c.aplic}</span>` : `<span class="num">${c.aplic} de ${PAD.length}</span> <span class="muted">· ${c.naN} não se aplicam (Diagnóstico)</span>`],['Diagnóstico', S.diag ? `<span class="num">${br(S.diag.data)}</span> · ${esc(S.diag.aval)}` : '<span class="chip c-warn">Pendente</span>'],['Rodada de avaliação', `<span class="num">${S.aval.rodada}</span> · ${RES[S.aval.res]}`],['Certificado', S.cert ? `Emitido em <span class="num">${br(S.cert.emissao)}</span> · válido até <span class="num">${br(S.cert.validade)}</span>` : '<span class="muted">Não emitido · validade de 5 anos</span>'],['Nível calculado', nivelHtml(c.nivel)],['Nível final (Comitê do IBES)', S.nivelFinal ? nivelHtml(S.nivelFinal) : '<span class="muted">Aguarda resolução do Comitê</span>']]) + timeline() +
      '<p class="muted" style="font-size:12px">Etapas realizadas em verde, futuras em cinza. O avanço de etapa é feito pelo IBES.</p>')}
  <div class="grid2">
    ${sec('Entidade', kv([['Nome do centro','Hospital Modelo de Demonstração'],['Unidade de saúde','Unidade de Internação Adulto'],['Tipo de unidade','Hospital geral'],['Grupo','Rede Exemplo de Saúde']]))}
    ${sec('Responsáveis', kv([['Responsável do projeto','Paula Ribeiro'],['Autorizador (chancela)','Fernando Lopes'],['IBES · Backoffice','Backoffice IBES'],['Avaliador líder','Avaliadora A']]))}
  </div>
  ${sec('Estado do projeto', kv([['Estado atual', `<span class="chip c-info">${S.estado}</span>`]]) +
    (ibesEtapa() ? `<form class="form" id="f-est" novalidate style="margin:16px -16px 0"><div class="frow"><div class="field"><label for="est-sel">Novo estado</label><select id="est-sel">${ESTADOS.map(o => `<option ${S.estado === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
      <div class="field" style="grid-column:span 2"><label for="est-mot">Motivo *</label><input id="est-mot" type="text" autocomplete="off" placeholder="Ex.: cliente desistiu conforme cláusula do contrato"></div></div>
      <p class="err" id="est-err" hidden></p><div class="fact"><button type="submit" class="btn pri">Alterar estado</button></div></form>`
    : '<div class="note n-info" style="margin-top:12px">Somente o IBES altera o estado do projeto. Recusado e abandonado seguem o contrato.</div>') +
    `<div class="tbl" style="margin:16px -16px -16px"><table><thead><tr><th>Data e hora</th><th>De</th><th>Para</th><th>Motivo</th><th>Usuário</th></tr></thead><tbody>${S.histEstado.map(h => `<tr><td class="num" style="white-space:nowrap">${brdt(h.d)}</td><td>${esc(h.de)}</td><td><b style="font-weight:500">${esc(h.para)}</b></td><td>${esc(h.mot)}</td><td class="muted">${esc(h.u)}</td></tr>`).join('')}</tbody></table></div>`,
    `<span class="chip c-neu num">${S.histEstado.length}</span>`)}`;
}
function vWorkflow(c) {
  const pode = ibesEtapa(), et = etapas(), bl = bloqueios(), ult = S.etapa >= et.length - 1;
  return `<div class="phead"><div><h1>Workflow e prazos</h1><p>Etapa atual: <b>${et[S.etapa]}</b>. O IBES avança as etapas manualmente; o sistema bloqueia o avanço enquanto houver pendência obrigatória.</p></div>
    <button type="button" class="btn pri" data-act="avancar" ${pode && !ult ? '' : 'disabled'}>Avançar para ${ult ? '—' : et[S.etapa + 1]}</button></div>
  ${pode ? '' : '<div class="note n-info">Somente Backoffice IBES e Administrador IBES avançam etapas e alteram prazos. Troque o perfil no topo para testar.</div>'}
  ${bl.length ? `<div class="note n-warn"><div>Avanço bloqueado: ${bl.length} item(ns) obrigatório(s) pendente(s). ${bl.slice(0, 6).map(([id, m]) => `${stdLink(id)} ${m}`).join(' · ')}${bl.length > 6 ? ' · …' : ''}<br><span style="font-size:12px">Regra provisória (pendência 12): obrigatório preenchido = resposta registrada e evidência chancelada.</span></div></div>` : `<div class="note n-ok">Sem bloqueios para avançar desta etapa.</div>`}
  ${sec('Etapas', `<div class="wf">${et.map((n, i) => { const done = i < S.etapa, cur = i === S.etapa;
    return `<div class="wf-r ${done ? 'done' : cur ? 'cur' : ''}"><span class="wf-n">${done ? ic(I.check).replace('class="i"', 'class="i" style="width:14px;height:14px;stroke-width:2.5"') : i + 1}</span><span><b>${n}</b><br><span class="muted" style="font-size:12px">${done ? (n === 'Diagnóstico' ? 'Diagnóstico registrado em ' : n === 'Solicitação' ? 'Candidatura validada pelo IBES em ' : 'Realizada em ') + br(S.feitas[n]) : cur ? 'Etapa atual' : 'Futura'}</span></span>
      <span style="display:flex;gap:8px;align-items:center"><label class="muted" for="pz-${i}" style="font-size:12px">Prazo</label><input type="date" id="pz-${i}" data-prazo="${esc(n)}" value="${prazo(n)}" ${pode && !done ? '' : 'disabled'}></span></div>`; }).join('')}</div>`, `<span class="chip c-neu num">${S.etapa + 1}/${et.length}</span>`, true)}
  <div class="grid2">
    ${sec('Configurações do projeto', `<div class="field"><label for="cfg-ciclos">Ciclos de manutenção da certificação</label><select id="cfg-ciclos" ${S.papel === 'admin' ? '' : 'disabled'}>${[1,2,3].map(n => `<option value="${n}" ${S.ciclos === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <p class="muted" style="font-size:12px;margin-top:8px">O IBES confirmou 1 manutenção aos 30 meses e recertificação aos 60 meses. A lista de 22/10 fala em 1 a 3 manutenções: o seletor fica até a confirmação.</p><p class="muted" style="font-size:12px;margin-top:8px">O estado do projeto é alterado na Ficha do projeto, com motivo e histórico.</p>
      <div style="margin-top:16px">${kv([['Nível calculado', nivelHtml(c.nivel)],['Nível final', S.nivelFinal ? nivelHtml(S.nivelFinal) : '<span class="muted">Aguarda o Comitê</span>']])}</div><p class="muted" style="font-size:12px;margin-top:8px">O sistema calcula o nível. O nível final sai da resolução do Comitê de Certificação do IBES, com justificativa quando for diferente do calculado.</p>`)}
    ${sec('E-mails automáticos', `<div class="tbl"><table><thead><tr><th>Quando</th><th>Para</th></tr></thead><tbody>
      ${[['Mudança de etapa','Responsável do projeto'],['Agendamento da avaliação','Cliente e equipe avaliadora'],['Evidência devolvida','Responsável pelo upload'],['Evidência conferida','Autorizador (chancela)'],['Prazo da etapa em 15 dias','Responsável do projeto'],['Vencimento da certificação','Responsável do projeto e Backoffice'],['Candidatura validada ou recusada','Solicitante'],['Nova rodada de avaliação','Responsável do projeto e equipe avaliadora'],['Resolução do Comitê do IBES','Responsável do projeto e Backoffice'],['Certificado disponível','Responsável do projeto']].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:12px;padding:8px 16px 12px">Lista provisória: os gatilhos definitivos dependem da pendência 11.</p>`, '', true)}
  </div>`;
}

/* ---------- usuários ---------- */
function vUsuarios() {
  const pode = S.papel === 'resp' || ibesEtapa(), ativos = S.usuarios.filter(u => u.a).length;
  const perfis = {resp:'Responsável do projeto', upload:'Responsável pelo upload', conf:'Conferente', chan:'Autorizador (chancela)'};
  return `<div class="phead"><div><h1>Usuários</h1><p>Usuários do cliente (até 40 por cliente) e equipe do IBES ligada ao projeto.</p></div></div>
  ${sec('Usuários do cliente', `<div class="tbl"><table><thead><tr><th>Nome</th><th>Perfil</th><th>Situação</th><th><span class="sr">Ação</span></th></tr></thead><tbody>
    ${S.usuarios.map((u, i) => `<tr><td>${esc(u.n)}</td><td>${perfis[u.p]}</td><td>${u.a ? '<span class="chip c-C">Ativo</span>' : '<span class="chip c-neu">Inativo</span>'}</td><td class="n"><button type="button" class="btn sm" data-act="cred" data-v="${i}" ${pode && u.a ? '' : 'disabled'}>Enviar credenciais</button></td></tr>`).join('')}</tbody></table></div>
    ${pode ? `<form class="form" id="f-user" novalidate><div class="frow"><div class="field"><label for="u-nome">Nome *</label><input id="u-nome" type="text" autocomplete="off"></div>
      <div class="field"><label for="u-mail">E-mail *</label><input id="u-mail" type="email" autocomplete="off"></div>
      <div class="field"><label for="u-perfil">Perfil</label><select id="u-perfil">${Object.entries(perfis).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div></div>
      <p class="err" id="u-err" hidden></p><div class="fact"><button type="submit" class="btn pri" ${ativos >= 40 ? 'disabled' : ''}>Cadastrar usuário</button></div></form>` : ''}`, `<span class="chip ${ativos >= 40 ? 'c-bad' : 'c-neu'} num">${ativos}/40 ativos</span>`, true)}
  ${sec('Equipe IBES', `<div class="tbl"><table><thead><tr><th>Nome</th><th>Função</th></tr></thead><tbody>${S.equipe.map(e => `<tr><td>${esc(e.n)}</td><td>${e.f}</td></tr>`).join('')}</tbody></table></div>`, '<span class="muted" style="font-size:12px">Educadores, avaliadores, tutores de relatório, comitê e backoffice</span>', true)}`;
}

/* ---------- indicadores ---------- */
function vIndicadores(c) {
  const evs = Object.values(S.evid).flat(), ach = chkv().map(id => S.achados[id] && S.achados[id].r).filter(Boolean);
  const reuso = S.docs.filter(d => usos(d.id).length > 1).length, ativos = S.usuarios.filter(u => u.a).length, dPrazo = difDias(HOJE, prazo(etapas()[S.etapa]));
  const ab = S.areas.filter(a => a.fase !== 'Concluída').length;
  const L = [
    ['Autoavaliação','Padrões cumpridos (C)', pct(c.okN, c.aplic), `${c.okN} de ${c.aplic} aplicáveis`, null],
    ['Autoavaliação','Padrões que não se aplicam', c.naN, 'Saem do total e do mínimo', null],
    ['Autoavaliação','Obrigatórios cumpridos', pct(c.ok(c.ob), c.ob.length), 'Meta: 100%', c.ok(c.ob) === c.ob.length],
    ['Autoavaliação','Padrões respondidos', pct(c.rp(c.AP), c.aplic), `${c.rp(c.AP)} de ${c.aplic}`, null],
    ['Autoavaliação','Projeção de nível', c.nivel || 'Abaixo de Avançado', 'Meta: Avançado ou acima', !!c.nivel],
    ['Evidências','Aguardando conferência', evs.filter(e => e.etapa === 'Enviada').length, 'Meta: 0 em 5 dias', evs.filter(e => e.etapa === 'Enviada').length === 0],
    ['Evidências','Aguardando chancela', evs.filter(e => e.etapa === 'Conferida').length, 'Meta: 0 em 5 dias', evs.filter(e => e.etapa === 'Conferida').length === 0],
    ['Evidências','Devolvidas', evs.filter(e => e.etapa === 'Devolvida').length, 'Reenviar com correção', evs.filter(e => e.etapa === 'Devolvida').length === 0],
    ['Planos de ação','Em aberto', ab, `${S.areas.length} registrados`, null],
    ['Planos de ação','Vencidos', S.areas.filter(vencida).length, 'Meta: 0', S.areas.filter(vencida).length === 0],
    ['Planos de ação','Concluídos', pct(S.areas.length - ab, S.areas.length), `${S.areas.length - ab} de ${S.areas.length}`, null],
    ['Avaliação','% conforme na visita', ach.length ? pct(ach.filter(r => r === 'c' || r === 'm').length, ach.length) : '—', `${ach.length} de ${chkv().length} verificados`, null],
    ['Avaliação','Rodada atual', S.aval.rodada, S.aval.hist.length ? `${S.aval.hist.length} rodada(s) anterior(es)` : 'Primeira rodada', null],
    ['Documentos','Documentos reutilizados em mais de um critério', reuso, `${S.docs.length} na biblioteca`, null],
    ['Projeto','Dias até o prazo da etapa', dPrazo, br(prazo(etapas()[S.etapa])), dPrazo >= 15],
    ['Projeto','Usuários ativos do cliente', `${ativos}/40`, 'Limite por cliente', ativos <= 40],
    ['Projeto','Bloqueios para avançar de etapa', bloqueios().length, 'Meta: 0', bloqueios().length === 0]];
  return `<div class="phead"><div><h1>Indicadores</h1><p>Acompanhamento do projeto de implantação, calculado em tempo real. Lista inicial: os indicadores definitivos dependem da pendência 16.</p></div></div>
  ${sec('Indicadores do projeto', `<div class="tbl"><table><thead><tr><th>Grupo</th><th>Indicador</th><th class="n">Valor</th><th>Referência</th><th>Situação</th></tr></thead><tbody>
    ${L.map(r => `<tr><td class="muted">${r[0]}</td><td>${r[1]}</td><td class="n"><b>${r[2]}</b></td><td class="muted">${r[3]}</td><td>${r[4] == null ? '<span class="chip c-neu">Informativo</span>' : r[4] ? '<span class="chip c-C">Dentro da meta</span>' : '<span class="chip c-warn">Atenção</span>'}</td></tr>`).join('')}</tbody></table></div>`, `<span class="chip c-neu num">${L.length}</span>`, true)}`;
}

/* ---------- log ---------- */
function vLog() {
  const tipos = ['Diagnóstico','Candidatura','Evidência','Resposta','Etapa','Estado','E-mail','Usuário','Documento','Avaliação','Comitê'];
  const L = S.log.filter(x => !S.logF || x.t === S.logF);
  return `<div class="phead"><div><h1>Painel de log</h1><p>Quem fez o quê, quando. Registro permanente: nenhuma linha é apagada.</p></div>
    <div class="field" style="min-width:200px"><label for="log-f">Tipo</label><select id="log-f"><option value="">Todos</option>${tipos.map(t => `<option ${S.logF === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
  ${sec('Registros', L.length ? `<div class="tbl"><table><thead><tr><th>Data e hora</th><th>Usuário</th><th>Perfil</th><th>Tipo</th><th>Ação</th><th>Objeto</th></tr></thead><tbody>
    ${L.map(x => `<tr><td class="num" style="white-space:nowrap">${brdt(x.d)}</td><td>${esc(x.u)}</td><td class="muted">${esc(x.p)}</td><td><span class="chip c-neu">${x.t}</span></td><td>${esc(x.a)}</td><td>${stdLink(x.o)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nenhum registro deste tipo.</div>', `<span class="chip c-neu num">${L.length}</span>`, true)}`;
}

/* ---------- autoavaliação ---------- */
function listaPadroes() {
  const q = S.busca.trim().toLowerCase();
  let eixoAnt = 0;
  return BLOCOS.map(([n, nome, eixo]) => {
    const todos = PAD.filter(p => p.bloco === n), apl = todos.filter(p => S.st[p.id] !== 'NA');
    const vis = todos.filter(p => vePadrao(p.id) && S.f[p.g] && (!S.f.ob || p.ob) && (!q || (p.id + ' ' + p.t).toLowerCase().includes(q)));
    if (!vis.length) return '';
    const ok = apl.filter(p => S.st[p.id] === 'C').length, aberto = !!S.aberto[n] || !!q;
    const bh = eixo !== eixoAnt ? `<div class="bh"><span class="sq e${eixo}" aria-hidden="true"></span>Bloco ${ROM[eixo]}</div>` : ''; eixoAnt = eixo;
    return `${bh}<div class="blk"><button type="button" class="blk-h" data-act="bloco" data-v="${n}" aria-expanded="${aberto}"><span class="chev">${ic(I.chev)}</span><span class="t"><span class="muted" style="font-size:12px">Critério</span> ${n} · ${nome}</span><span class="chip ${apl.length && ok === apl.length ? 'c-C' : 'c-neu'} num">${ok}/${apl.length}</span></button>
      ${aberto ? vis.map(p => { const fila = (S.evid[p.id] || []).find(e => e.etapa === 'Enviada' || e.etapa === 'Conferida' || e.etapa === 'Devolvida');
        return `<button type="button" class="std" data-act="padrao" data-v="${p.id}" aria-current="${p.id === S.std}"><span class="m"><span class="mono">${p.id}</span><small>Grupo ${p.g}${p.ob ? ' · Obrigatório' : ''}${S.st[p.id] === 'NA' ? ' · Não se aplica' : respondido(p.id) ? ' · Respondido' : ''}${fila ? ' · evidência ' + fila.etapa.toLowerCase() : ''}</small><span class="tt">${p.t}</span></span>${chip(S.st[p.id])}</button>`; }).join('') : ''}</div>`;
  }).join('') || '<div class="empty">Nenhum padrão atende aos filtros. Marque outro grupo ou limpe a busca.</div>';
}
function resumoTabela(c, n) {
  return `<div class="tbl"><table><thead><tr><th>ME 5 1_07</th><th class="n">Total</th><th class="n">Mínimo para ${n}</th><th class="n">Cumpridos</th><th class="n">% cumprido</th><th class="n">% respondido</th></tr></thead><tbody>
    ${c.linhas(n).map(r => `<tr class="${r.sub ? 'sub' : ''} ${r.tot ? 'tot' : ''}"><td>${r.l}</td><td class="n">${r.n}</td><td class="n">${r.min == null ? '—' : r.min + (r.minp ? ` (${r.minp})` : '')}</td><td class="n">${r.ok}</td><td class="n">${pct(r.ok, r.n)}</td><td class="n">${pct(r.rp, r.n)}</td></tr>`).join('')}
  </tbody></table></div>`;
}
const naoAlocados = () => PAD.filter(p => S.perm.u1[p.bloco] !== 'redacao').length;
function vAuto(c) {
  const crit = `<div class="tbl"><table><thead><tr><th>ME 5 1_07</th><th>${dots('Avançado')} Avançado</th><th>${dots('Ótimo')} Ótimo</th><th>${dots('Excelente')} Excelente</th></tr></thead><tbody>
    <tr><td>Grupo I</td><td>70% e 100% dos obrigatórios</td><td>100%</td><td>100%</td></tr><tr><td>Grupo II</td><td>—</td><td>40%</td><td>100%</td></tr><tr><td>Grupo III</td><td>—</td><td>—</td><td>40%</td></tr></tbody></table></div>`;
  return `<div class="phead"><div><h1>Autoavaliação</h1><p>Projeção atual: ${nivelHtml(c.nivel)} · ${c.okN} de ${c.aplic} padrões aplicáveis cumpridos · ${c.rp(c.AP)} respondidos${cliente() ? '' : ` · ${c.naN} não se aplicam (Diagnóstico)`}.</p></div>
    <div class="fact"><button type="button" class="btn" data-act="go" data-v="relatorios">${ic(I.chart)}Relatórios e listas</button></div></div>
  ${avisoRestricao()}
  <div class="row">
    <div class="col-l">${sec(`Padrões <span class="chip c-neu num" style="margin-left:6px">${cliente() ? c.aplic : PAD.length}</span>`, `
      <div class="filt">${['I','II','III'].map(g => `<label class="chk" for="f-${g}"><input type="checkbox" id="f-${g}" data-f="${g}" ${S.f[g] ? 'checked' : ''}>Grupo ${g}</label>`).join('')}<label class="chk" for="f-ob"><input type="checkbox" id="f-ob" data-f="ob" ${S.f.ob ? 'checked' : ''}>Só obrigatórios</label>
        <label class="search" for="busca">${ic(I.search)}<input id="busca" type="search" placeholder="Localizar por código ou título" value="${esc(S.busca)}"></label></div>
      <div id="plist">${listaPadroes()}</div>`, '', true)}</div>
    <div class="col-r stack">
      ${sec('Resumo dos 3 grupos', `<div style="padding:16px 16px 12px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><span class="muted" style="font-size:13px">Mínimos para atingir o nível sobre os padrões aplicáveis. Não se aplica sai do total e do mínimo.</span>
        <div class="tabs" role="group" aria-label="Nível">${Object.keys(REGRAS).map(n => `<button type="button" data-act="tab" data-v="${n}" aria-pressed="${S.nivelTab === n}">${dots(n)}${n}</button>`).join('')}</div></div>${resumoTabela(c, S.nivelTab)}`, '', true)}
      ${sec('Critérios mínimos de conformidade para certificação', crit + '<p class="muted" style="font-size:12px;padding:8px 16px 12px">Grupo sem padrão aplicável aparece como "—" e não impede o nível (regra provisória, a confirmar).</p>', '', true)}
      <div class="grid2">
        ${sec('Prazos', kv([['Início da autoavaliação','<span class="num">09/04/2026</span>'],['Prazo da etapa', `<span class="num">${br(prazo('Autoavaliação'))}</span>`],['Avaliação agendada', S.visitas.length ? `<span class="num">${br(S.visitas[0].data)}</span>` : '<span class="chip c-warn">Pendente</span>']]).replace('class="kv"', 'class="kv" style="grid-template-columns:1fr"'))}
        ${sec('Participantes', kv([['Usuários do cliente', `<span class="num">${S.usuarios.filter(u => u.a).length}/40</span>`],['Padrões sem redação atribuída', `<span class="num">${naoAlocados()}</span>`]]) + `<div style="margin-top:16px"><button type="button" class="btn" data-act="go" data-v="usuarios">${ic(I.users)}Ver usuários</button></div>`)}
      </div>
    </div>
  </div>`;
}

/* ---------- ficha do padrão ---------- */
const usos = docId => PAD.filter(p => (S.evid[p.id] || []).some(e => e.docs.includes(docId) && e.etapa !== 'Devolvida')).map(p => p.id);
const docNome = id => { const d = S.docs.find(x => x.id === id); return d ? `${esc(d.n)} <span class="muted">· v${d.v.length}</span>` : id; };
function evidHtml(e) {
  const acoes = [];
  if (e.etapa === 'Enviada' && podeConferir()) acoes.push(`<button type="button" class="btn sm pri" data-act="conferir" data-v="${e.id}">Conferir</button><button type="button" class="btn sm" data-act="devolver" data-v="${e.id}">Devolver</button>`);
  if (e.etapa === 'Conferida' && podeChancelar()) acoes.push(`<button type="button" class="btn sm pri" data-act="chancelar" data-v="${e.id}">Chancelar</button><button type="button" class="btn sm" data-act="devolver" data-v="${e.id}">Devolver</button>`);
  return `<div class="evi"><div class="d num">${brdt(e.d)}<br>${esc(e.autor)}</div><div class="x">
    <div class="chain">${evChip(e.etapa)}<span>Enviada ${brdt(e.d)}</span>${e.conf ? `<span class="ar">→</span><span>Conferida por ${esc(e.conf.u)} ${brdt(e.conf.d)}</span>` : ''}${e.chan ? `<span class="ar">→</span><span>Chancelada por ${esc(e.chan.u)} ${brdt(e.chan.d)}</span>` : ''}${e.dev ? `<span class="ar">→</span><span>Devolvida por ${esc(e.dev.u)} ${brdt(e.dev.d)}</span>` : ''}</div>
    <p class="prose">${esc(e.t)}</p>${e.dev ? `<div class="note n-warn" style="font-size:13px">Motivo da devolução: ${esc(e.dev.motivo)}</div>` : ''}
    <div class="anx">${e.docs.map(d => `<span>${ic(I.clip)}${docNome(d)}</span>`).join('')}</div>
    ${acoes.length ? `<div class="fact" style="justify-content:flex-start">${acoes.join('')}</div>` : ''}</div></div>`;
}
function vPadrao(c) {
  const p = PMAP[S.std], b = BMAP[p.bloco], ve = podeVer(p.id), pode = podeResponder(p.id);
  if (!vePadrao(p.id)) return `<div class="phead"><div><h1>Ficha de autoavaliação</h1></div></div><div class="note n-info">Este padrão está fora do escopo do projeto, definido no Diagnóstico. Escolha um padrão no Painel da autoavaliação.</div><div><button type="button" class="btn pri" data-act="go" data-v="auto">Abrir painel da autoavaliação</button></div>`;
  const LV = PAD.filter(x => vePadrao(x.id)), i = LV.indexOf(p), ant = LV[i - 1], prox = LV[i + 1];
  const ev = S.evid[p.id] || [], ar = S.areas.filter(a => a.std === p.id), st = S.st[p.id], r = S.resp[p.id] || {bin:null, qual:''};
  const podeCumpre = !travado() && (S.papel === 'chan' || S.papel === 'resp'), base = temBase(p.id);
  const docsF = S.docs.filter(d => !S.bibF || d.c === S.bibF);
  return `<div class="phead"><div><div class="crumb" style="margin-bottom:6px"><span class="sq e${b[2]}" aria-hidden="true"></span><span>ME 5 1_07</span><span class="sep" aria-hidden="true">›</span><span>Bloco ${ROM[b[2]]}</span><span class="sep" aria-hidden="true">›</span><span>Critério ${b[0]} · ${b[1]}</span><span class="sep" aria-hidden="true">›</span><span>Padrão</span></div>
      <h1><span class="mono" style="font-size:24px">${p.id}</span></h1><p>${p.t} · Grupo ${p.g}${p.ob ? ' · Obrigatório' : ''} · ${chip(st)}</p></div>
    <div class="navstd"><button type="button" class="btn" data-act="padrao" data-v="${ant ? ant.id : ''}" ${ant ? '' : 'disabled'}>${ic(I.left)}<span class="mono">${ant ? ant.id : 'Início'}</span></button><button type="button" class="btn" data-act="padrao" data-v="${prox ? prox.id : ''}" ${prox ? '' : 'disabled'}><span class="mono">${prox ? prox.id : 'Fim'}</span>${ic(I.chev)}</button></div></div>
  ${avisoRestricao()}
  ${!p.det ? '<div class="note n-info">Padrão de demonstração: definição e elementos vêm do manual importado pelo IBES. ES 5 01.04_02, ES 5 10.04_02 e ES 5 10.06_01 têm conteúdo completo de exemplo.</div>' : ''}
  ${sec('Padrão', `<div class="grid2" style="gap:16px 32px"><div><div class="muted" style="font-size:12px;font-weight:500">Definição</div><p class="prose" style="margin-top:4px">${p.def}</p></div><div><div class="muted" style="font-size:12px;font-weight:500">Propósito</div><p class="prose" style="margin-top:4px">${p.prop}</p></div></div>
    <div style="margin-top:16px"><div class="muted" style="font-size:12px;font-weight:500;margin-bottom:6px">Elementos avaliáveis · ${p.el.length}</div><ol class="elist">${p.el.map(e => `<li>${e}</li>`).join('')}</ol></div>`)}
  ${!ve ? '<div class="note n-warn">Seu perfil está sem permissão neste critério: você vê o padrão, mas não as respostas e evidências.</div>' : `
  ${sec('Resposta', `<form id="f-resp" novalidate><fieldset style="border:0;margin:0;padding:0"><legend class="muted" style="font-size:12px;font-weight:500;padding:0;margin-bottom:6px">A unidade atende ao padrão?</legend>
      <div class="radios">${[['sim','Sim'],['nao','Não']].map(([k, l]) => `<label for="rb-${k}"><input type="radio" name="rb" id="rb-${k}" value="${k}" ${r.bin === k ? 'checked' : ''} ${pode ? '' : 'disabled'}>${l}</label>`).join('')}</div></fieldset>
    <div class="field" style="margin-top:12px"><label for="rq">Resposta qualitativa</label><textarea id="rq" style="min-height:64px" ${pode ? '' : 'disabled'}>${esc(r.qual)}</textarea></div>
    ${pode ? '<div class="fact" style="margin-top:12px"><button type="submit" class="btn">Salvar resposta</button></div>' : ''}</form>`, respondido(p.id) ? '<span class="chip c-C">Respondido</span>' : '<span class="chip c-neu">Sem resposta</span>')}
  ${sec('Evidência', (ev.length ? ev.map(evidHtml).join('') : '<div class="empty">Nenhuma evidência registrada. Descreva os fatos e vincule documentos da biblioteca ou envie um novo.</div>') + (pode ? `
    <form class="form" id="f-evid" novalidate><span class="req">* obrigatório</span>
      <div class="field"><label for="ev-txt">Descrição dos fatos objetivos *</label><textarea id="ev-txt" placeholder="Indique a qual elemento avaliável a evidência responde"></textarea></div>
      <div class="frow" style="align-items:end"><div class="field"><label for="ev-cls">Documentos da biblioteca · filtrar por classificação</label><select id="ev-cls"><option value="">Todas</option>${CLASSES.map(x => `<option ${S.bibF === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
      <div class="docpick" role="group" aria-label="Documentos da biblioteca">${docsF.map(d => `<label for="pk-${d.id}"><input type="checkbox" id="pk-${d.id}" data-doc="${d.id}"><span style="flex:1">${esc(d.n)}</span><span class="muted">${d.c} · v${d.v.length} · ${usos(d.id).length} critério(s)</span></label>`).join('') || '<div class="empty">Nenhum documento nesta classificação.</div>'}</div>
      <div class="frow"><div class="field"><label for="ev-file">Ou envie um documento novo</label><input id="ev-file" type="file" style="padding-top:6px"></div>
        <div class="field"><label for="ev-fcls">Classificação do documento novo</label><select id="ev-fcls">${CLASSES.map(x => `<option>${x}</option>`).join('')}</select></div></div>
      <p class="err" id="ev-err" hidden></p>
      <div class="fact"><span class="muted" style="font-size:12px">A evidência segue para conferência e chancela, fica ligada ao projeto e ao padrão e acompanha os ciclos de manutenção.</span><button type="submit" class="btn pri">Enviar evidência</button></div></form>` : '') +
    `<div style="border-top:1px solid var(--line)"><div class="cbar" style="padding:12px 16px"><span style="font-size:13px"><span class="chip c-info">Sugestão</span> <span class="muted">Documentos que costumam responder aos elementos deste padrão</span></span><button type="button" class="btn sm" data-act="sugerir">${S.sug[p.id] ? 'Atualizar sugestão' : 'Sugerir evidências'}</button></div><div id="sug-box">${S.sug[p.id] ? sugHtml(p) : ''}</div></div>`,
    `<span class="chip c-neu num">${ev.length}</span>`, true)}
  ${sec('Áreas de melhoria', (ar.length ? `<div class="tbl"><table><thead><tr><th>Área de melhoria</th><th>Fase</th><th>Responsável</th><th>Prazo</th><th><span class="sr">Ação</span></th></tr></thead><tbody>${ar.map(a => areaLinha(a, pode)).join('')}</tbody></table></div>` : '<div class="empty">Não há áreas de melhoria neste padrão.</div>') + (pode ? `
    <form class="form" id="f-area" novalidate><div class="field"><label for="ar-txt">Oportunidade de melhoria detectada *</label><textarea id="ar-txt" style="min-height:60px"></textarea></div>
      <div class="frow"><div class="field"><label for="ar-resp">Responsável</label><select id="ar-resp"><option value="">A definir</option>${S.usuarios.filter(u => u.a).map(u => `<option>${esc(u.n)}</option>`).join('')}</select></div>
      <div class="field"><label for="ar-ini">Início planejado</label><input id="ar-ini" type="date"></div><div class="field"><label for="ar-fim">Fim planejado</label><input id="ar-fim" type="date"></div></div>
      <p class="err" id="ar-err" hidden>Descreva a área de melhoria antes de registrar.</p><div class="fact"><button type="submit" class="btn">Registrar área de melhoria</button></div></form>` : ''), `<span class="chip c-neu num">${ar.length}</span>`, true)}
  <section class="sec"><div class="cbar">
    <p class="prose" style="font-size:14px">${st === 'NA' ? 'Padrão não aplicável, definido no Diagnóstico: sai do total e do mínimo do cálculo de nível e não aparece para a unidade.' : st === 'C' ? 'Padrão marcado como cumprido.' : base ? 'Resposta "Sim" e evidência chancelada: o padrão pode ser marcado como cumprido.' : 'Para marcar Cumpre: resposta "Sim" e ao menos uma evidência chancelada (ou área de melhoria concluída).'}</p>
    <div class="fact">${st === 'NA' ? `<button type="button" class="btn" data-act="go" data-v="diagnostico" ${podeNA() ? '' : 'disabled'}>Ver no Diagnóstico</button>` : st === 'C' ? `<button type="button" class="btn" data-act="desmarcar" ${podeCumpre ? '' : 'disabled'}>Desmarcar cumprimento</button>` : `<button type="button" class="btn cumpre" data-act="cumpre" ${podeCumpre && base ? '' : 'disabled'}>${ic(I.check)}Cumpre</button>`}</div>
  </div>${st !== 'NA' && !podeCumpre ? '<div class="note n-info" style="margin:0 16px 16px">Quem marca Cumpre é o Autorizador (chancela) ou o Responsável do projeto.</div>' : ''}
  ${st === 'NA' && S.na[p.id] ? `<p class="muted" style="font-size:12px;padding:0 16px 16px">Definido no ${esc(S.na[p.id].o || 'Diagnóstico')} por ${esc(S.na[p.id].u)} em ${brdt(S.na[p.id].d)}.</p>` : ''}
  <p class="muted" style="font-size:12px;padding:0 16px 16px">Não se aplica sai do Diagnóstico feito pelo avaliador e é registrado pelo IBES. A unidade não vê esses padrões (confirmado pelo IBES em 26/10).</p></section>`}`;
}
const sugHtml = p => [...p.el.map(e => 'Documento que comprove: ' + e.replace(/\s*\(texto do manual importado\)/, '').toLowerCase()), 'Registro de treinamento da equipe envolvida']
  .map(s => `<div class="sug"><span>${esc(s)}</span><span class="chip c-info">Sugestão</span></div>`).join('') + '<p class="muted" style="font-size:12px;padding:8px 16px 12px">A sugestão usa só o código, o propósito e os elementos do padrão. Os anexos nunca são enviados à IA. Permanência da IA no escopo: pendência 19.</p>';
function areaLinha(a, pode, comPadrao) {
  const v = vencida(a);
  const fase = `<span class="chip ${a.fase === 'Concluída' ? 'c-C' : v ? 'c-bad' : a.fase === 'Planejada' ? 'c-info' : 'c-neu'}">${v ? 'Vencida' : a.fase}</span>`;
  const acao = !pode ? '' : a.fase === 'Detectada' ? `<button type="button" class="btn sm" data-act="planejar" data-v="${a.id}">Planejar</button>` : a.fase === 'Planejada' ? `<button type="button" class="btn sm" data-act="concluir" data-v="${a.id}">Concluir</button>` : '';
  return `<tr>${comPadrao ? `<td>${stdLink(a.std)}</td>` : ''}<td style="min-width:220px">${esc(a.t)}</td><td>${fase}</td><td>${a.resp ? esc(a.resp) : '<span class="muted">A definir</span>'}</td><td class="num">${a.fase === 'Concluída' ? 'Concluída em ' + br(a.concl) : a.fim ? br(a.ini) + ' a ' + br(a.fim) : '—'}</td><td class="n">${acao}</td></tr>`;
}

/* ---------- biblioteca ---------- */
function vBiblioteca() {
  const pode = !travado() && (S.papel === 'resp' || S.papel === 'upload'), q = S.bibQ.trim().toLowerCase();
  const L = S.docs.filter(d => (!S.bibF || d.c === S.bibF) && (!q || d.n.toLowerCase().includes(q)));
  return `<div class="phead"><div><h1>Biblioteca de documentos</h1><p>Cada documento é enviado uma vez, classificado e vinculado a quantos critérios precisar. Versões anteriores ficam guardadas para sempre.</p></div></div>
  ${avisoRestricao()}
  ${sec('Documentos', `<div class="filt"><div class="field" style="min-width:200px"><label for="bib-f">Classificação</label><select id="bib-f"><option value="">Todas</option>${CLASSES.map(x => `<option ${S.bibF === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="field" style="flex:1;min-width:200px"><label for="bib-q">Buscar</label><label class="search" for="bib-q" style="margin:0">${ic(I.search)}<input id="bib-q" type="search" value="${esc(S.bibQ)}" placeholder="Nome do documento"></label></div></div>
    ${L.length ? `<div class="tbl"><table><thead><tr><th>Documento</th><th>Classificação</th><th>Versão atual</th><th>Critérios vinculados</th><th><span class="sr">Ações</span></th></tr></thead><tbody>
    ${L.map(d => { const u = usos(d.id), at = d.v[d.v.length - 1]; return `<tr><td><b style="font-weight:500">${esc(d.n)}</b>${S.verHist[d.id] ? `<ol class="hist">${[...d.v].reverse().map(v => `<li>v${v.n} · ${brdt(v.d)} · ${esc(v.u)}</li>`).join('')}</ol>` : ''}</td><td>${d.c}</td><td class="num">v${at.n} · ${br(at.d.slice(0,10))}</td>
      <td>${u.length ? `<span class="chip ${u.length > 1 ? 'c-info' : 'c-neu'} num">${u.length}</span> <span class="muted" style="font-size:12px">${u.slice(0, 2).join(', ')}${u.length > 2 ? '…' : ''}</span>` : '<span class="muted">Nenhum</span>'}</td>
      <td class="n" style="white-space:nowrap"><button type="button" class="btn sm" data-act="hist" data-v="${d.id}">${S.verHist[d.id] ? 'Ocultar histórico' : 'Histórico'}</button> <button type="button" class="btn sm" data-act="versao" data-v="${d.id}" ${pode ? '' : 'disabled'}>Nova versão</button></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Nenhum documento encontrado. Mude a classificação ou envie o primeiro documento.</div>'}
    ${pode ? `<form class="form" id="f-doc" novalidate><div class="frow"><div class="field"><label for="doc-file">Arquivo *</label><input id="doc-file" type="file" style="padding-top:6px"></div>
      <div class="field"><label for="doc-cls">Classificação *</label><select id="doc-cls">${CLASSES.map(x => `<option>${x}</option>`).join('')}</select></div></div>
      <p class="err" id="doc-err" hidden>Escolha um arquivo para enviar.</p><div class="fact"><button type="submit" class="btn pri">Enviar para a biblioteca</button></div></form>` : ''}`, `<span class="chip c-neu num">${S.docs.length}</span>`, true)}`;
}

/* ---------- atribuição, planos, relatórios ---------- */
function vAutoav() {
  const pode = S.papel === 'resp' && !travado(), lbl = {redacao:'Redação', leitura:'Leitura', sem:'Sem permissão'};
  return `<div class="phead"><div><h1>Atribuição por critério</h1><p>Permissão do Responsável pelo upload em cada critério do manual. ${naoAlocados()} padrões estão sem redação atribuída.</p></div></div>
  <div class="note n-info">Redação: responde e envia evidências. Leitura: vê sem alterar. Sem permissão: vê só a lista de padrões.</div>
  ${sec('Carlos Menezes · Responsável pelo upload', `<div class="tbl"><table><thead><tr><th>Bloco</th><th>Critério</th><th class="n">Padrões</th><th>Permissão</th></tr></thead><tbody>
    ${BLOCOS.map(([n, nome, eixo]) => `<tr><td><span style="display:inline-flex;gap:8px;align-items:center"><span class="sq e${eixo}" aria-hidden="true"></span>${ROM[eixo]}</span></td><td>${n} · ${nome}</td><td class="n">${PAD.filter(p => p.bloco === n).length}</td>
      <td><label class="sr" for="pm-${n}">Permissão no critério ${n}</label><select class="sel" id="pm-${n}" data-perm="${n}" ${pode ? '' : 'disabled'}>${Object.entries(lbl).map(([k, l]) => `<option value="${k}" ${S.perm.u1[n] === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`, '', true)}
  ${pode ? '' : '<p class="muted">Somente o Responsável do projeto altera as permissões.</p>'}`;
}
function vMelhoria() {
  const pode = !travado() && (S.papel === 'resp' || S.papel === 'upload'), fases = ['Detectada','Planejada','Concluída'];
  const cont = fases.map(f => S.areas.filter(a => a.fase === f).length);
  return `<div class="phead"><div><h1>Planos de ação</h1><p>${S.areas.length} áreas de melhoria: ${cont[0]} detectadas, ${cont[1]} planejadas, ${cont[2]} concluídas e ${S.areas.filter(vencida).length} vencidas.</p></div></div>
  ${sec('Áreas de melhoria registradas', `<div class="tbl"><table><thead><tr><th>Padrão</th><th>Área de melhoria</th><th>Fase</th><th>Responsável</th><th>Prazo</th><th><span class="sr">Ação</span></th></tr></thead><tbody>${[...S.areas].sort((a, b) => (vencida(b) - vencida(a)) || fases.indexOf(a.fase) - fases.indexOf(b.fase)).map(a => areaLinha(a, pode, true)).join('')}</tbody></table></div>`, '', true)}
  <p class="muted" style="font-size:12px">Vencida: área planejada cujo fim previsto passou sem conclusão. Para registrar uma nova área, abra o padrão.</p>`;
}
function vRelatorios(c) {
  const linhasG = [['Grupo I · obrigatórios', c.ok(c.ob), c.ob.length, 100], ['Grupo I', c.ok(c.gi), c.gi.length, 70], ['Grupo II', c.ok(c.g2), c.g2.length, null], ['Grupo III', c.ok(c.g3), c.g3.length, null]];
  const bar = (label, ok, tot, marca, pre = '') => `<div class="bar-r"><span class="bar-l">${pre}<span>${label}</span></span><span class="bar-t" role="img" aria-label="${label}: ${pct(ok, tot)}"><span class="bar-f" style="width:${tot ? ok * 100 / tot : 0}%"></span>${marca != null ? `<span class="bar-m" style="left:calc(${marca}% - 1px)"></span>` : ''}</span><span class="bar-v">${ok}/${tot} · ${pct(ok, tot)}</span></div>`;
  return `<div class="phead"><div><h1>Relatórios e listas</h1><p>Situação da autoavaliação em ${br(HOJE)}. Todos exportam em PDF no sistema final.</p></div></div>
  ${sec('Gráfico por grupos', `<div class="bars">${linhasG.map(r => bar(r[0], r[1], r[2], r[3])).join('')}</div><div class="legend" style="margin-top:12px"><span><i></i>Mínimo para o nível Avançado</span></div>`)}
  ${sec('Gráfico de conclusão por critério', `<div class="bars">${BLOCOS.map(([n, nome, eixo]) => { const t = PAD.filter(p => p.bloco === n && S.st[p.id] !== 'NA'); return bar(`${n} · ${nome}`, t.filter(p => S.st[p.id] === 'C').length, t.length, null, `<span class="sq e${eixo}" aria-hidden="true"></span>`); }).join('')}</div>`)}
  ${sec('Resumo de conformidade', resumoTabela(c, 'Avançado'), nivelHtml(c.nivel), true)}`;
}

/* ---------- avaliação ---------- */
function vAvaliacao(c) {
  const K = chkv(), v = S.visitas[0], manut = manutAtual(), avaliador = S.papel === 'aval' || S.papel === 'lider', agenda = ibesEtapa();
  const conf = K.filter(i => S.achados[i] && (S.achados[i].r === 'c' || S.achados[i].r === 'm')).length, nao = K.filter(i => S.achados[i] && (S.achados[i].r === 'n' || S.achados[i].r === 'nm')).length, pend = K.length - conf - nao;
  const ops = manut ? [['m','Mantém cumprido'],['nm','Não mantém']] : [['c','Cumpre'],['n','Não cumpre']];
  const naoOb = K.filter(i => S.achados[i] && (S.achados[i].r === 'n' || S.achados[i].r === 'nm') && PMAP[i].ob);
  const rec = pend ? `concluir a verificação de ${pend} critério(s) antes de fechar o relatório.` : naoOb.length ? `não ${manut ? 'manter' : 'conceder'} a certificação até a correção dos obrigatórios ${naoOb.join(', ')}.` : c.nivel ? `marcar resultado Positiva e encaminhar ao Comitê de Certificação do IBES com proposta de nível ${c.nivel}.` : 'abrir plano de ação e agendar nova visita.';
  const tipos = ['Certificação', ...etapas().filter(n => n.startsWith('Manutenção')), 'Recertificação'];
  return `<div class="phead"><div><h1>Agendamento e relatório</h1><p>Agenda da avaliação, equipe avaliadora, janela de restrição e relatório do avaliador.</p></div>
    <button type="button" class="btn pri" data-act="relatorio" ${S.papel === 'lider' ? '' : 'disabled'}>Gerar relatório preliminar</button></div>
  ${avisoRestricao()}
  ${S.rel ? sec('Relatório preliminar · rascunho', `<p class="prose">Rodada ${S.aval.rodada}. Avaliação de ${v ? v.tipo.toLowerCase() : '—'} em ${v ? br(v.data) : '—'}. Foram verificados ${conf + nao} de ${K.length} critérios: ${conf} ${manut ? 'mantêm cumprimento' : 'cumprem'} e ${nao} não. A autoavaliação projeta o nível ${c.nivel || 'abaixo de Avançado'}.</p><p class="prose" style="margin-top:8px">Pontos fortes: ${S.pontos.filter(x => x.tipo === 'forte').length} · pontos fracos: ${S.pontos.filter(x => x.tipo === 'fraco').length}${S.pontosOk ? ' (consolidados)' : ' (ainda não consolidados)'}.</p><p class="prose" style="margin-top:8px;font-weight:600">Recomendação: ${rec}</p>`, '<span class="muted" style="font-size:12px">Emitido pelo IBES · gerado dos registros · revisão do tutor de relatório</span>') : ''}
  <div class="row">
    <div class="col-l stack">
      ${sec(`Resultado da avaliação · rodada ${S.aval.rodada}`, `<div class="field"><label for="av-res">Resultado</label><select id="av-res" ${S.papel === 'lider' ? '' : 'disabled'}>${Object.entries(RES).map(([k, l]) => `<option value="${k}" ${S.aval.res === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <p class="muted" style="font-size:12px;margin-top:8px">${S.papel === 'lider' ? '' : 'Só o Avaliador líder registra o resultado. '}Positiva segue para o Comitê de Certificação do IBES. Negativa mantém o projeto e o número: a unidade trata as não conformidades, atualiza evidências e o IBES abre nova rodada.</p>
        ${S.aval.res === 'negativa' ? `<div class="fact" style="margin-top:12px;justify-content:flex-start"><button type="button" class="btn pri" data-act="rodada" ${ibesEtapa() ? '' : 'disabled'}>Abrir rodada ${S.aval.rodada + 1}</button>${ibesEtapa() ? '' : '<span class="muted" style="font-size:12px">Só Backoffice e Administrador IBES abrem nova rodada.</span>'}</div>` : ''}
        ${S.aval.hist.length ? `<div class="tbl" style="margin:16px -16px -16px"><table><thead><tr><th>Rodada</th><th>Encerrada em</th><th>Resultado</th><th class="n">Não cumpridos</th></tr></thead><tbody>${S.aval.hist.map(h => `<tr><td class="num">${h.r}</td><td class="num">${br(h.d)}</td><td>${RES[h.res]}</td><td class="n">${h.nao}</td></tr>`).join('')}</tbody></table></div>` : ''}`,
        `<span class="chip ${S.aval.res === 'positiva' ? 'c-C' : S.aval.res === 'negativa' ? 'c-bad' : 'c-warn'}">${RES[S.aval.res]}</span>`)}
      ${sec('Agendamento', `${v ? kv([['Tipo', v.tipo],['Data', `<span class="num">${br(v.data)}</span>`],['Rodada', `<span class="num">${S.aval.rodada}</span>`],['Equipe', v.equipe.map(n => esc(n) + (n === v.lider ? ' (líder)' : '')).join(', ')],['Restrição do cliente', `<span class="num">${br(janela(v)[0])} a ${br(janela(v)[1])}</span>`]]).replace('class="kv"', 'class="kv" style="grid-template-columns:1fr"') : '<div class="empty">Nenhuma avaliação agendada.</div>'}
        ${agenda ? `<form class="form" id="f-agenda" novalidate style="margin:16px -16px -16px"><div class="field"><label for="ag-tipo">Tipo</label><select id="ag-tipo">${tipos.map(t => `<option ${v && v.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          <div class="field"><label for="ag-data">Data da visita *</label><input id="ag-data" type="date" value="${v ? v.data : ''}"></div>
          <fieldset style="border:0;margin:0;padding:0"><legend class="muted" style="font-size:12px;font-weight:500;padding:0;margin-bottom:4px">Equipe avaliadora</legend>${S.equipe.filter(e => e.f.startsWith('Avaliador')).map((e, i) => `<label class="chk" for="ag-e${i}" style="display:flex"><input type="checkbox" id="ag-e${i}" data-eq="${esc(e.n)}" ${v && v.equipe.includes(e.n) ? 'checked' : ''}>${esc(e.n)} · ${e.f}</label>`).join('')}</fieldset>
          <p class="err" id="ag-err" hidden></p><div class="fact"><button type="submit" class="btn pri">Agendar e enviar e-mails</button></div></form>` : ''}`)}
      ${sec('Pontos fortes e pontos fracos', ['forte','fraco'].map(tp => { const L = S.pontos.filter(x => x.tipo === tp); return `<div class="bh">${tp === 'forte' ? 'Pontos fortes' : 'Pontos fracos'} · ${L.length}</div>` + (L.length ? `<ul class="pts">${L.map(x => `<li><span>${esc(x.t)}</span><span class="who2">${esc(x.u)}</span></li>`).join('')}</ul>` : '<div class="empty">Nenhum registro.</div>'); }).join('') +
        (avaliador && !S.pontosOk ? `<form class="form" id="f-ponto" novalidate><div class="field"><label for="pt-tipo">Tipo</label><select id="pt-tipo"><option value="forte">Ponto forte</option><option value="fraco">Ponto fraco</option></select></div>
          <div class="field"><label for="pt-txt">Descrição *</label><textarea id="pt-txt" style="min-height:60px"></textarea></div><p class="err" id="pt-err" hidden>Descreva o ponto antes de registrar.</p>
          <div class="fact">${S.papel === 'lider' ? '<button type="button" class="btn" data-act="consolidar">Consolidar pontos</button>' : ''}<button type="submit" class="btn pri">Registrar ponto</button></div></form>` : '') +
        `<p class="muted" style="font-size:12px;padding:8px 16px 12px">${S.pontosOk ? 'Pontos consolidados pelo avaliador líder. Seguem para o relatório.' : 'Texto livre de cada avaliador. O avaliador líder consolida antes do relatório.'}</p>`, `<span class="chip ${S.pontosOk ? 'c-C' : 'c-neu'}">${S.pontosOk ? 'Consolidados' : 'Em registro'}</span>`, true)}
    </div>
    <div class="col-r">${sec(`Relatório do avaliador · ${manut ? 'manutenção' : 'certificação'}`, `${avaliador ? '' : '<div class="note n-info" style="margin:12px 16px 0">Somente Avaliador e Avaliador líder registram resultados.</div>'}<div class="tbl"><table><thead><tr><th>Critério</th><th>Autoavaliação</th><th>Resultado</th><th>Observação</th></tr></thead><tbody>
      ${K.map(id => { const a = S.achados[id] || {}; return `<tr><td><span class="mono">${id}</span><br><span class="muted" style="font-size:13px">${PMAP[id].t}${PMAP[id].ob ? ' · Obrigatório' : ''}</span></td><td>${chip(S.st[id])}</td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap">${ops.map(([k, l]) => `<button type="button" class="btn sm" data-act="achado" data-id="${id}" data-v="${k}" aria-pressed="${a.r === k}" ${avaliador ? '' : 'disabled'} style="${a.r === k ? (k === 'c' || k === 'm' ? 'background:var(--ok-soft);color:var(--ok);border-color:var(--ok)' : 'background:var(--bad-soft);color:var(--bad);border-color:var(--bad)') : ''}">${l}</button>`).join('')}</div></td>
        <td><label class="sr" for="ob-${id}">Observação ${id}</label><input class="obs" id="ob-${id}" data-obs="${id}" value="${esc(a.obs || '')}" ${avaliador ? '' : 'disabled'}></td></tr>`; }).join('')}</tbody></table></div><p class="muted" style="font-size:12px;padding:8px 16px 12px">Certificação: Cumpre ou Não cumpre. Manutenção: Mantém ou Não mantém. Na manutenção entram só os padrões aplicáveis dos Grupos I e II (confirmado pelo IBES em 26/10). O resultado final é decidido pelo Comitê de Certificação do IBES.</p>`, `<span class="chip c-neu num">${conf + nao}/${K.length}</span>`, true)}</div>
  </div>`;
}

/* ---------- resolução do Comitê ---------- */
function vComite(c) {
  const membro = membroComite(), K = chkv(), NIV = ['Avançado','Ótimo','Excelente'], liberado = S.aval.res === 'positiva';
  const ver = K.filter(id => S.achados[id] && S.achados[id].r), conf = ver.filter(id => ['c','m'].includes(S.achados[id].r)).length;
  const dec = {conceder:'Conceder a certificação', negar:'Não conceder', resposta:'Pedir resposta do requerente'};
  const par = S.pareceres.filter(p => p.rodada === S.aval.rodada), meu = par.find(p => p.u === eu().n), resol = resolRodada();
  const votos = Object.keys(dec).map(k => [k, par.filter(p => p.voto === k).length]).sort((a, b) => b[1] - a[1]);
  const maioria = par.length && votos[0][1] > par.length / 2 ? votos[0][0] : null;
  const pont = ver.length ? pct(conf, ver.length) : '—';
  const podeParecer = membro && liberado && !meu && !resol, podeResolver = membro && liberado && !resol && par.length >= QUORUM;
  const sit = id => { const a = S.achados[id] || {}, n = (S.evid[id] || []).filter(e => e.etapa === 'Chancelada').length;
    if (!a.r) return '<span class="chip c-neu">Sem resultado</span>';
    if (a.r === 'n' || a.r === 'nm') return '<span class="chip c-bad">Não cumpre</span>';
    return n ? '<span class="chip c-C">Confere</span>' : '<span class="chip c-warn">Sem evidência chancelada</span>'; };
  const rotRes = {c:'Cumpre', n:'Não cumpre', m:'Mantém', nm:'Não mantém'};
  return `<div class="phead"><div><h1>Comitê de Certificação do IBES</h1><p>Segunda análise depois do relatório do avaliador. Os membros conferem relatório e evidências, registram parecer e votam; a resolução define o resultado e o nível. Rodada ${S.aval.rodada}.</p></div></div>
  ${liberado ? '' : `<div class="note n-warn">O Comitê só analisa avaliação com resultado Positiva. Resultado atual da rodada ${S.aval.rodada}: ${RES[S.aval.res]}. O Avaliador líder registra o resultado em Agendamento e relatório.</div>`}
  ${membro ? '' : '<div class="note n-info">Somente membros do Comitê registram parecer e resolução. Troque o perfil no topo para Membro do Comitê · F ou · G.</div>'}
  ${sec('Relatório × evidências', `<div class="tbl"><table><thead><tr><th>Padrão</th><th>Resultado do avaliador</th><th>Observação</th><th class="n">Evidências chanceladas</th><th>Conferência</th></tr></thead><tbody>
    ${K.map(id => { const a = S.achados[id] || {}; return `<tr><td>${stdLink(id)}<br><span class="muted" style="font-size:12px">${PMAP[id].t}</span></td><td>${a.r ? rotRes[a.r] : '<span class="muted">—</span>'}</td><td>${a.obs ? esc(a.obs) : '<span class="muted">—</span>'}</td><td class="n">${(S.evid[id] || []).filter(e => e.etapa === 'Chancelada').length}</td><td>${sit(id)}</td></tr>`; }).join('')}</tbody></table></div>`,
    `<span class="chip c-neu num">${ver.length}/${K.length} verificados</span>`, true)}
  <div class="grid2">
    ${sec(`Pareceres · rodada ${S.aval.rodada}`, (par.length ? `<ul class="pts">${par.map(p => `<li><span><b style="font-weight:600">${dec[p.voto]}</b>${p.voto === 'conceder' ? ' · nível ' + p.niv : ''}<br><span class="muted" style="font-size:13px">${esc(p.txt)}</span><br><span class="muted" style="font-size:12px">Sem conflito de interesse declarado · ${brdt(p.d)}</span></span><span class="who2">${esc(p.u)}</span></li>`).join('')}</ul>` : '<div class="empty">Nenhum parecer registrado nesta rodada.</div>') +
      (podeParecer ? `<form class="form" id="f-par" novalidate><span class="req">* obrigatório</span>
        <fieldset style="border:0;margin:0;padding:0"><legend class="muted" style="font-size:12px;font-weight:500;padding:0;margin-bottom:4px">Voto *</legend><div class="radios" style="flex-direction:column;gap:2px">${Object.entries(dec).map(([k, l]) => `<label for="pv-${k}"><input type="radio" name="pv" id="pv-${k}" value="${k}" ${k === 'conceder' ? 'checked' : ''}>${l}</label>`).join('')}</div></fieldset>
        <div class="field"><label for="pv-niv">Nível proposto</label><select id="pv-niv">${NIV.map(n => `<option ${n === (c.nivel || 'Avançado') ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="field"><label for="pv-txt">Parecer *</label><textarea id="pv-txt" style="min-height:60px" placeholder="O relatório corresponde às evidências? Pontos que pesaram no voto."></textarea></div>
        <label class="chk" for="pv-ci"><input type="checkbox" id="pv-ci">Declaro não ter conflito de interesse com a instituição avaliada *</label>
        <p class="err" id="pv-err" hidden></p><div class="fact"><button type="submit" class="btn pri">Registrar parecer</button></div></form>`
      : membro && meu && !resol ? '<p class="muted" style="font-size:12px;padding:8px 16px 12px">Seu parecer desta rodada já está registrado.</p>' : ''),
      `<span class="chip ${par.length >= QUORUM ? 'c-C' : 'c-neu'} num">${par.length}/${QUORUM}</span>`, true)}
    ${sec('Resolução', kv([['Nível calculado', nivelHtml(c.nivel)],['Pontuação (% conforme na avaliação)', `<span class="num">${pont}</span>`],['Maioria dos pareceres', maioria ? dec[maioria] : '<span class="muted">Sem maioria ainda</span>']]).replace('class="kv"', 'class="kv" style="grid-template-columns:1fr"') +
      (resol ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line)">${kv([['Resolução', `<span class="mono">${esc(resol.num)}</span> · ${brdt(resol.d)}`],['Decisão', dec[resol.dec]],['Nível final', resol.dec === 'conceder' ? nivelHtml(resol.niv) : '—'],['Certificado', resol.dec === 'conceder' && S.cert ? `válido até <span class="num">${br(S.cert.validade)}</span>` : '—'],['Justificativa', resol.just ? esc(resol.just) : '<span class="muted">Sem justificativa (igual à maioria e ao nível calculado)</span>']]).replace('class="kv"', 'class="kv" style="grid-template-columns:1fr"')}</div>` : '') +
      (podeResolver ? `<form class="form" id="f-res" novalidate style="margin:16px -16px -16px"><span class="req">* obrigatório</span>
        <fieldset style="border:0;margin:0;padding:0"><legend class="muted" style="font-size:12px;font-weight:500;padding:0;margin-bottom:4px">Decisão *</legend><div class="radios" style="flex-direction:column;gap:2px">${Object.entries(dec).map(([k, l]) => `<label for="rs-${k}"><input type="radio" name="rs" id="rs-${k}" value="${k}" ${k === (maioria || 'conceder') ? 'checked' : ''}>${l}</label>`).join('')}</div></fieldset>
        <div class="frow"><div class="field"><label for="rs-niv">Nível final</label><select id="rs-niv">${NIV.map(n => `<option ${n === (c.nivel || 'Avançado') ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field"><label for="rs-num">Número da resolução *</label><input id="rs-num" type="text" placeholder="Ex.: IBES 2026/041" autocomplete="off"></div></div>
        <div class="field"><label for="rs-just">Justificativa</label><textarea id="rs-just" style="min-height:60px" placeholder="Obrigatória quando a decisão diverge da maioria ou o nível difere do calculado"></textarea></div>
        <p class="err" id="rs-err" hidden></p><div class="fact"><button type="submit" class="btn pri">Registrar resolução</button></div></form>`
      : !resol && membro && liberado ? `<div class="note n-info" style="margin-top:12px">Resolução liberada com ${QUORUM} pareceres. Faltam ${Math.max(0, QUORUM - par.length)}.</div>` : ''),
      resol ? '<span class="chip c-C">Registrada</span>' : '')}
  </div>
  <div class="note n-info">Regra provisória até a pendência 33: resolução liberada com pareceres de ${QUORUM} membros, decisão pela maioria e declaração de conflito de interesse em cada parecer. "Pontuação" = % conforme na avaliação até o IBES definir (pendência 23). Pedido de resposta devolve o registro ao Avaliador líder.</div>
  ${S.resols.length ? sec('Histórico de resoluções', `<div class="tbl"><table><thead><tr><th>Resolução</th><th>Rodada</th><th>Data</th><th>Decisão</th><th>Nível final</th></tr></thead><tbody>${S.resols.map(r => `<tr><td class="mono">${esc(r.num)}</td><td class="num">${r.rodada || 1}</td><td class="num">${brdt(r.d)}</td><td>${dec[r.dec]}</td><td>${r.dec === 'conceder' ? r.niv : '—'}</td></tr>`).join('')}</tbody></table></div>`, '', true) : ''}`;
}

/* ---------- diagnóstico ---------- */
function vDiagnostico(c) {
  if (cliente()) return `<div class="phead"><div><h1>Diagnóstico e escopo</h1></div></div><div class="note n-warn">Área restrita ao IBES.</div>`;
  const pode = podeNA(), d = S.diag, nas = PAD.filter(p => S.st[p.id] === 'NA'), lista = PAD.filter(p => p.bloco === S.diagF);
  const avs = S.equipe.filter(e => e.f.startsWith('Avaliador'));
  return `<div class="phead"><div><h1>Diagnóstico e escopo</h1><p>O avaliador levanta o perfil e os serviços da instituição antes da abertura do projeto. O IBES registra aqui os padrões que não se aplicam: eles saem do cálculo e não aparecem para a unidade.</p></div></div>
  ${pode ? '' : '<div class="note n-info">Somente Backoffice IBES e Administrador IBES registram o diagnóstico e os padrões não aplicáveis.</div>'}
  <div class="grid2">
    ${sec('Diagnóstico', (d ? kv([['Avaliador', esc(d.aval)],['Data', `<span class="num">${br(d.data)}</span>`],['Relatório anexo', `<span style="display:inline-flex;gap:6px;align-items:center">${ic(I.clip)}${esc(d.doc)}</span>`],['Registrado por', `${esc(d.u)} · ${brdt(d.reg)}`]]).replace('class="kv"', 'class="kv" style="grid-template-columns:1fr"') : '<div class="empty" style="padding:0">Diagnóstico não registrado.</div>') +
      (pode ? `<form class="form" id="f-diag" novalidate style="margin:16px -16px -16px"><div class="frow"><div class="field"><label for="dg-aval">Avaliador *</label><select id="dg-aval">${avs.map(e => `<option ${d && d.aval === e.n ? 'selected' : ''}>${esc(e.n)}</option>`).join('')}</select></div>
        <div class="field"><label for="dg-data">Data *</label><input id="dg-data" type="date" value="${d ? d.data : ''}"></div></div>
        <div class="field"><label for="dg-file">Relatório do diagnóstico</label><input id="dg-file" type="file" style="padding-top:6px"></div>
        <p class="err" id="dg-err" hidden></p><div class="fact"><button type="submit" class="btn pri">Salvar diagnóstico</button></div></form>` : ''))}
    ${sec('Escopo do projeto', kv([['Padrões no manual', `<span class="num">${PAD.length}</span>`],['Aplicáveis', `<span class="num">${c.aplic}</span>`],['Não se aplicam', `<span class="num">${c.naN}</span>`]]) +
      (nas.length ? `<ul class="pts" style="margin:16px -16px -16px;border-top:1px solid var(--line)">${nas.map(p => `<li><span>${stdLink(p.id)} ${esc(p.t)}</span><span class="who2">${S.na[p.id] ? esc(S.na[p.id].u) + ' · ' + br(S.na[p.id].d.slice(0, 10)) : ''}</span></li>`).join('')}</ul>` : ''))}
  </div>
  ${sec('Padrões por critério', `<div class="filt"><div class="field" style="min-width:260px"><label for="dg-crit">Critério</label><select id="dg-crit">${BLOCOS.map(([n, nome]) => `<option value="${n}" ${S.diagF === n ? 'selected' : ''}>${n} · ${nome}</option>`).join('')}</select></div></div>
    <div class="tbl"><table><thead><tr><th>Código</th><th>Padrão</th><th>Grupo</th><th>Não se aplica</th></tr></thead><tbody>
    ${lista.map(p => `<tr><td class="mono">${p.id}</td><td>${p.t}</td><td>${p.g}${p.ob ? ' · Obrig.' : ''}</td><td><label class="chk" for="na-${p.id.replace(/\W/g, '')}"><input type="checkbox" id="na-${p.id.replace(/\W/g, '')}" data-nachk="${p.id}" ${S.st[p.id] === 'NA' ? 'checked' : ''} ${pode ? '' : 'disabled'}><span class="sr">Não se aplica ${p.id}</span></label></td></tr>`).join('')}</tbody></table></div>
    <p class="muted" style="font-size:12px;padding:8px 16px 12px">Digitalizar o questionário completo do diagnóstico fica para a v2. Nesta versão: registro, relatório anexo e lista de não aplicáveis.</p>`, '', true)}`;
}

/* ---------- roteiro de testes ---------- */
const TESTES = [
  ['T1','Entrada e logotipo','Clique em Sair, confira a tela de entrada e entre no sistema.','Logotipo grande na entrada e em tamanho normal no canto superior esquerdo das páginas internas, sem distorção.'],
  ['T2','Diagnóstico define Não se aplica','Perfil Backoffice IBES › Diagnóstico e escopo › marque um padrão do critério 01.','O total aplicável cai 1, o padrão sai do mínimo e o registro aparece no Painel de log.'],
  ['T3','Unidade não vê padrões N/A','Troque para Responsável do projeto › Painel da autoavaliação.','Padrões não aplicáveis somem da lista e da navegação; não existe botão Não se aplica.'],
  ['T4','Fluxo da evidência','Responsável pelo upload envia › Conferente confere › Autorizador chancela.','Cada passo grava usuário, data e hora. Cumpre só libera com resposta Sim e evidência chancelada.'],
  ['T5','Avaliação negativa abre nova rodada','Avaliador líder › Agendamento e relatório › Resultado Negativa. Backoffice › Abrir rodada 2.','Mesmo projeto e código; resultados do avaliador zerados; evidências mantidas; histórico de rodadas.'],
  ['T6','Comitê do IBES','Avaliador líder marca Positiva. Membro F e Membro G registram parecer. Um deles registra a resolução.','Resolução só libera com 2 pareceres; justificativa exigida quando diverge; certificado válido por 5 anos.'],
  ['T7','Manutenção só Grupos I e II','Backoffice › agende avaliação do tipo Manutenção 1.','O relatório do avaliador lista só padrões aplicáveis dos Grupos I e II.'],
  ['T8','Estado manual do projeto','Administrador IBES › Ficha do projeto › estado Recusado ou Abandonado com motivo. Repita com um perfil do cliente.','Só o IBES altera; motivo obrigatório; histórico com usuário, data e hora.'],
  ['T9','Workflow e bloqueios','Backoffice › Workflow e prazos › Avançar.','Diagnóstico e Recertificação aparecem; realizadas em verde, futuras em cinza; avanço bloqueado com pendência.'],
  ['T10','Celular','Abra no celular e percorra Autoavaliação, Ficha de autoavaliação e Comitê.','Sem rolagem lateral da página; menu do projeto abre e fecha; tabelas rolam dentro do quadro.']
];
const NOVIDADES = [
  ['Identidade visual do GRUPO IBES: rosa e branco, logotipo oficial','Decisão 27/10'],
  ['Etapa Diagnóstico: o IBES define os padrões não aplicáveis, ocultos para a unidade','IBES 26/10'],
  ['Avaliação negativa abre nova rodada no mesmo projeto','IBES 26/10'],
  ['Recusado e abandonado como estados manuais do IBES, com motivo e histórico','IBES 26/10'],
  ['Comitê de Certificação do IBES: parecer, voto e resolução no sistema','Decisão 27/10'],
  ['Validade de 5 anos: manutenção aos 30 meses e recertificação aos 60','IBES 26/10'],
  ['Manutenção avalia só os padrões aplicáveis dos Grupos I e II','IBES 26/10'],
  ['Candidatura: "Recusar" passou a "Devolver para correção"','Ajuste de nomenclatura']
];
const ABERTAS = [['21','Prazo e limite de rodadas após avaliação negativa'],['23','Campos da resolução e o que é a "pontuação"'],['25','Recertificação no mesmo projeto ou em projeto novo'],['27','O nível pode subir na manutenção?'],['29','Data do fim do contrato com a ACSA'],['30','Uso do manual ME 5 1_07 após o contrato'],['33','Composição, quórum e conflito de interesse do Comitê']];
const rotT = {ok:'Passou', falha:'Falhou'};
const textoTestes = () => `ACSAS IBES MODERN · Beta v0.3 Tester · ${br(HOJE)}\n` + TESTES.map(([id, t]) => { const r = S.testes[id] || {}; return `${id} ${t}: ${r.r ? rotT[r.r] : 'Não testado'}${r.o ? ' · ' + r.o : ''}`; }).join('\n');
function vTestes() {
  const ok = TESTES.filter(t => (S.testes[t[0]] || {}).r === 'ok').length, fa = TESTES.filter(t => (S.testes[t[0]] || {}).r === 'falha').length;
  return `<div class="phead"><div><h1>Roteiro de testes · Beta v0.3</h1><p>O que mudou com as respostas do IBES de 26/10 e a decisão de 27/10, e como testar. Resultados ficam salvos só neste navegador.</p></div>
    <div class="fact"><button type="button" class="btn" data-act="copiar">Copiar resultados</button></div></div>
  <div class="grid2">
    ${sec('Novidades da v0.3', `<ul class="news">${NOVIDADES.map(([a, b]) => `<li><span>${a}</span><span>${b}</span></li>`).join('')}</ul>`, `<span class="chip c-neu num">${NOVIDADES.length}</span>`, true)}
    <div class="stack">
      ${sec('Pendências que o teste não fecha', `<ul class="news">${ABERTAS.map(([n, t]) => `<li><span>${t}</span><span class="mono">nº ${n}</span></li>`).join('')}</ul>`, '', true)}
    </div>
  </div>
  ${sec('Casos de teste', `<div>${TESTES.map(([id, t, como, esp]) => { const r = S.testes[id] || {}; return `<div class="tst-r"><span class="tst-id">${id}</span><div style="display:flex;flex-direction:column;gap:6px;min-width:0"><b style="font-weight:600">${t}</b><p><b>Como:</b> ${como}</p><p><b>Esperado:</b> ${esp}</p>
      <label class="sr" for="to-${id}">Observação ${id}</label><input class="obs" id="to-${id}" data-tobs="${id}" value="${esc(r.o || '')}" placeholder="Observação (opcional)"></div>
      <div class="tst-a"><button type="button" class="btn sm ok" data-act="teste" data-id="${id}" data-v="ok" aria-pressed="${r.r === 'ok'}">Passou</button><button type="button" class="btn sm bad" data-act="teste" data-id="${id}" data-v="falha" aria-pressed="${r.r === 'falha'}">Falhou</button></div></div>`; }).join('')}</div>
    <div id="tst-out-box" hidden style="padding:0 16px 16px"><label class="muted" for="tst-out" style="font-size:12px">Copie o texto abaixo</label><textarea id="tst-out" class="obs" readonly style="height:160px;padding:8px"></textarea></div>`,
    `<span class="chip c-neu num">${ok} passou · ${fa} falhou · ${TESTES.length - ok - fa} pendentes</span>`, true)}`;
}

/* ---------- render ---------- */
const V = {testes:vTestes, diagnostico:vDiagnostico, projetos:vProjetos, ficha:vFicha, workflow:vWorkflow, usuarios:vUsuarios, indicadores:vIndicadores, log:vLog, auto:vAuto, padrao:vPadrao, biblioteca:vBiblioteca, autoav:vAutoav, melhoria:vMelhoria, relatorios:vRelatorios, avaliacao:vAvaliacao, comite:vComite};
let ultima = null;
function render(skel) {
  if (!V[S.view]) S.view = 'auto';
  document.body.classList.toggle('pre', !S.logado);
  document.documentElement.classList.toggle('pre', !S.logado);
  $('#entrada').innerHTML = S.logado ? '' : vEntrada();
  if (!S.logado) { save(); return; }
  const c = calc(); frame();
  const view = $('#view');
  if (skel && !RM && ultima !== S.view) {
    view.innerHTML = '<div class="sk" style="height:32px;width:280px"></div><div class="sk" style="height:120px"></div><div class="sk" style="height:240px"></div>';
    setTimeout(() => { view.innerHTML = V[S.view](calc()); ultima = S.view; }, 180);
  } else { view.innerHTML = V[S.view](c); ultima = S.view; }
  save();
}
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3400); }
function fecharMenu() { $('#pmenu').classList.remove('open'); $('#scrim-root').innerHTML = ''; }
function ir(v) { S.view = v; fecharMenu(); render(true); window.scrollTo({top:0}); }
const acharEv = id => { for (const k in S.evid) { const e = S.evid[k].find(x => x.id === id); if (e) return [k, e]; } return [null, null]; };
const novoId = p => p + Date.now().toString(36) + Math.floor(Math.random() * 1e3);

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  if (a === 'go') ir(v);
  else if (a === 'menu') { $('#pmenu').classList.add('open'); $('#scrim-root').innerHTML = '<div class="scrim" data-act="fechar"></div>'; }
  else if (a === 'fechar') fecharMenu();
  else if (a === 'padrao') { if (!v) return; S.std = v; S.aberto[PMAP[v].bloco] = true; if (S.view !== 'padrao') ir('padrao'); else { render(); window.scrollTo({top:0}); } }
  else if (a === 'bloco') { S.aberto[v] = !S.aberto[v]; $('#plist').innerHTML = listaPadroes(); save(); }
  else if (a === 'tab') { S.nivelTab = v; render(); }
  else if (a === 'cumpre') { if (!temBase(S.std)) { toast('Registre resposta "Sim" e uma evidência chancelada para marcar Cumpre'); return; } const antes = calc().nivel; S.st[S.std] = 'C'; log('Resposta', 'Padrão marcado como cumprido', S.std); const depois = calc().nivel; render(); toast(antes !== depois ? `Padrão cumprido. Projeção de nível: ${depois || 'abaixo de Avançado'}` : 'Padrão marcado como cumprido'); }
  else if (a === 'desmarcar') { S.st[S.std] = 'PTE'; log('Resposta', 'Cumprimento removido', S.std); render(); toast('Cumprimento removido'); }
  else if (a === 'conferir' || a === 'chancelar') { const [k, ev] = acharEv(v); if (!ev) return;
    if (a === 'conferir') { ev.etapa = 'Conferida'; ev.conf = {u:eu().n, d:agora()}; log('Evidência', 'Evidência conferida', k); email('E-mail ao Autorizador: evidência aguardando chancela'); toast('Evidência conferida e enviada para chancela'); }
    else { ev.etapa = 'Chancelada'; ev.chan = {u:eu().n, d:agora()}; log('Evidência', 'Evidência chancelada', k); toast('Evidência chancelada'); }
    render(); }
  else if (a === 'devolver') { const [k, ev] = acharEv(v); if (!ev) return; ev.etapa = 'Devolvida'; ev.dev = {u:eu().n, d:agora(), motivo:'Documento não responde a todos os elementos avaliáveis.'}; log('Evidência', 'Evidência devolvida', k); email('E-mail ao Responsável pelo upload: evidência devolvida'); render(); toast('Evidência devolvida ao Responsável pelo upload'); }
  else if (a === 'sugerir') { const box = $('#sug-box'); box.innerHTML = '<div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px"><div class="sk" style="height:18px;width:70%"></div><div class="sk" style="height:18px;width:55%"></div></div>'; setTimeout(() => { S.sug[S.std] = true; save(); box.innerHTML = sugHtml(PMAP[S.std]); b.textContent = 'Atualizar sugestão'; }, RM ? 0 : 700); }
  else if (a === 'planejar') { const x = S.areas.find(r => r.id === v); x.fase = 'Planejada'; x.ini = x.ini || HOJE; x.fim = x.fim || addDias(HOJE, 30); x.resp = x.resp || eu().n; log('Evidência', 'Área de melhoria planejada', x.std); render(); toast('Área de melhoria planejada para ' + br(x.fim)); }
  else if (a === 'concluir') { const x = S.areas.find(r => r.id === v); x.fase = 'Concluída'; x.concl = HOJE; log('Evidência', 'Área de melhoria concluída', x.std); render(); toast('Área de melhoria concluída'); }
  else if (a === 'achado') { const id = b.dataset.id; S.achados[id] = S.achados[id] || {}; S.achados[id].r = S.achados[id].r === v ? null : v; S.rel = false; log('Avaliação', 'Resultado registrado no relatório do avaliador', id); render(); }
  else if (a === 'relatorio') { S.rel = true; log('Avaliação', 'Relatório preliminar gerado', 'Projeto 2025/009'); render(); toast('Relatório preliminar gerado'); }
  else if (a === 'avancar') { const bl = bloqueios(); if (bl.length) { toast(`Avanço bloqueado: ${bl.length} pendência(s) obrigatória(s)`); render(); return; }
    const et = etapas(), de = et[S.etapa]; S.feitas[de] = HOJE; S.etapa++; log('Etapa', `Etapa alterada: ${de} → ${et[S.etapa]}`, 'Projeto 2025/009'); email(`E-mail ao Responsável do projeto: início da etapa ${et[S.etapa]}`); render(); toast(`Projeto avançou para ${et[S.etapa]}. E-mail enviado ao cliente.`); }
  else if (a === 'hist') { S.verHist[v] = !S.verHist[v]; render(); }
  else if (a === 'versao') { const d = S.docs.find(x => x.id === v); d.v.push({n:d.v.length + 1, d:agora(), u:eu().n}); log('Documento', `Nova versão v${d.v.length}: ${d.n}`, ''); render(); toast(`Versão v${d.v.length} registrada. As anteriores continuam no histórico.`); }
  else if (a === 'cred') { const u = S.usuarios[+v]; log('Usuário', 'Credenciais enviadas a ' + u.n, ''); email('E-mail de credenciais enviado a ' + u.n); render(); toast('Credenciais enviadas para ' + u.n); }
  else if (a === 'na') { S.st[S.std] = 'NA'; S.na[S.std] = {u:eu().n, d:agora()}; log('Resposta', 'Padrão marcado como Não se aplica', S.std); render(); toast('Padrão marcado como Não se aplica. Saiu do total e do mínimo.'); }
  else if (a === 'aplica') { S.st[S.std] = 'PTE'; delete S.na[S.std]; log('Resposta', 'Padrão voltou a se aplicar', S.std); render(); toast('Padrão voltou ao cálculo como pendente'); }
  else if (a === 'cand-ok') { const k = S.cands[+v]; k.st = 'Validada'; log('Candidatura', 'Candidatura validada: ' + k.cli, k.cod); email('E-mail ao solicitante: candidatura validada'); render(); toast('Candidatura validada. Projeto pode ser aberto.'); }
  else if (a === 'cand-rec') { const k = S.cands[+v], m = ($('#cm-' + v) || {}).value || ''; if (!m.trim()) { toast('Informe o motivo da devolução'); $('#cm-' + v).focus(); return; }
    k.st = 'Devolvida para correção'; k.mot = m.trim(); log('Candidatura', 'Candidatura devolvida para correção: ' + k.cli, k.cod); email('E-mail ao solicitante: candidatura devolvida para correção'); render(); toast('Candidatura devolvida ao solicitante'); }
  else if (a === 'consolidar') { S.pontosOk = true; S.rel = false; log('Avaliação', `Pontos consolidados: ${S.pontos.length} registros`, 'Projeto 2025/009'); render(); toast('Pontos fortes e fracos consolidados'); }
  else if (a === 'reset') { S = inicial(); S.logado = true; render(true); toast('Dados de exemplo restaurados'); }
  else if (a === 'sair') { S.logado = false; fecharMenu(); render(); window.scrollTo({top:0}); }
  else if (a === 'logo-rm-desativado') { LOGO = LOGO_OFICIAL; try { localStorage.removeItem(LOGO_KEY); } catch (er) {} render(); toast('Logotipo oficial restaurado'); }
  else if (a === 'teste') { const id = b.dataset.id; S.testes[id] = S.testes[id] || {}; S.testes[id].r = S.testes[id].r === v ? '' : v; render(); }
  else if (a === 'copiar') { const t = textoTestes(), box = $('#tst-out-box'), out = $('#tst-out');
    const mostra = () => { out.value = t; box.hidden = false; out.focus(); out.select(); toast('Selecione e copie o texto do quadro'); };
    try { navigator.clipboard.writeText(t).then(() => toast('Resultados copiados'), mostra); } catch (er) { mostra(); } }
  else if (a === 'rodada') { const K = chkv(), nao = K.filter(id => S.achados[id] && ['n','nm'].includes(S.achados[id].r)).length;
    S.aval.hist.unshift({r:S.aval.rodada, d:HOJE, res:'negativa', nao}); S.aval.rodada++; S.aval.res = 'em_curso'; S.achados = {}; S.rel = false; S.pontosOk = false;
    if (S.visitas[0]) S.visitas[0].rodada = S.aval.rodada;
    log('Avaliação', `Rodada ${S.aval.rodada} aberta no mesmo projeto após avaliação negativa`, 'Projeto 2025/009');
    email('E-mail ao Responsável do projeto e à equipe avaliadora: nova rodada de avaliação; evidências anteriores mantidas');
    render(); toast(`Rodada ${S.aval.rodada} aberta. Agende a nova visita.`); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'papel') { S.papel = t.value; render(); toast('Perfil: ' + PAPEIS[t.value].l); }
  else if (t.dataset.f) { S.f[t.dataset.f] = t.checked; $('#plist').innerHTML = listaPadroes(); save(); }
  else if (t.dataset.perm) { S.perm.u1[t.dataset.perm] = t.value; log('Usuário', `Permissão do critério ${t.dataset.perm} alterada`, ''); render(); toast('Permissão atualizada'); }
  else if (t.dataset.prazo) { S.prazos[t.dataset.prazo] = t.value; log('Etapa', `Prazo de ${t.dataset.prazo} alterado para ${br(t.value)}`, 'Projeto 2025/009'); render(); toast('Prazo atualizado'); }
  else if (t.id === 'cfg-ciclos') { S.ciclos = +t.value; if (S.etapa > etapas().length - 1) S.etapa = etapas().length - 1; log('Etapa', `Ciclos de manutenção: ${t.value}`, 'Projeto 2025/009'); render(); }
  else if (t.id === 'cfg-estado') { log('Etapa', `Estado do projeto: ${S.estado} → ${t.value}`, 'Projeto 2025/009'); S.estado = t.value; render(); }
  else if (t.id === 'cfg-nivel') { log('Etapa', `Nível: ${S.nivel} → ${t.value}`, 'Projeto 2025/009'); S.nivel = t.value; render(); }
  else if (t.id === 'log-f') { S.logF = t.value; render(); }
  else if (t.id === 'dg-crit') { S.diagF = t.value; render(); }
  else if (t.dataset.nachk) { const id = t.dataset.nachk;
    if (t.checked) { S.st[id] = 'NA'; S.na[id] = {u:eu().n, d:agora(), o:'Diagnóstico'}; log('Diagnóstico', 'Padrão definido como Não se aplica', id); toast('Padrão fora do escopo. Saiu do cálculo e some para a unidade.'); }
    else { S.st[id] = 'PTE'; delete S.na[id]; log('Diagnóstico', 'Padrão voltou ao escopo do projeto', id); toast('Padrão voltou ao escopo como pendente'); }
    render(); }
  else if (t.id === 'av-res') { const de = S.aval.res; S.aval.res = t.value; log('Avaliação', `Resultado da rodada ${S.aval.rodada}: ${RES[de]} → ${RES[t.value]}`, 'Projeto 2025/009'); render(); toast(t.value === 'positiva' ? 'Resultado Positiva: segue para o Comitê do IBES' : t.value === 'negativa' ? 'Resultado Negativa: o IBES pode abrir nova rodada' : 'Resultado em curso'); }
  else if (t.dataset.tobs) { const id = t.dataset.tobs; S.testes[id] = S.testes[id] || {}; S.testes[id].o = t.value; save(); }
  else if (t.id === 'bib-f') { S.bibF = t.value; render(); }
  else if (t.id === 'ev-cls') { S.bibF = t.value; const txt = $('#ev-txt').value; render(); $('#ev-txt').value = txt; }
  else if (t.dataset.obs) { const id = t.dataset.obs; S.achados[id] = S.achados[id] || {}; S.achados[id].obs = t.value; save(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'busca') { S.busca = e.target.value; $('#plist').innerHTML = listaPadroes(); }
  else if (e.target.id === 'bib-q') { S.bibQ = e.target.value; const pos = e.target.selectionStart; render(); const q = $('#bib-q'); q.focus(); q.setSelectionRange(pos, pos); }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const id = e.target.id;
  if (id === 'f-ent') { S.papel = $('#ent-papel').value; S.logado = true; S.view = 'projetos'; log('Usuário', 'Entrada no ambiente de teste', ''); render(); window.scrollTo({top:0}); toast('Perfil: ' + eu().l); return; }
  if (id === 'f-est') { const novo = $('#est-sel').value, mot = $('#est-mot').value.trim(), err = $('#est-err');
    if (novo === S.estado) { err.textContent = 'Escolha um estado diferente do atual.'; err.hidden = false; return; }
    if (!mot) { err.textContent = 'Informe o motivo da mudança de estado.'; err.hidden = false; $('#est-mot').focus(); return; }
    S.histEstado.unshift({d:agora(), u:eu().n, de:S.estado, para:novo, mot}); log('Estado', `Estado do projeto: ${S.estado} → ${novo}`, 'Projeto 2025/009'); S.estado = novo;
    email('E-mail ao Responsável do projeto: estado do projeto alterado'); render(); toast('Estado alterado para ' + novo); return; }
  if (id === 'f-diag') { const dt = $('#dg-data').value, f = $('#dg-file').files[0], err = $('#dg-err');
    if (!dt) { err.textContent = 'Informe a data do diagnóstico.'; err.hidden = false; return; }
    S.diag = {aval:$('#dg-aval').value, data:dt, doc:f ? f.name : (S.diag ? S.diag.doc : 'Sem anexo'), u:eu().n, reg:agora()}; log('Diagnóstico', 'Diagnóstico registrado', 'Projeto 2025/009'); render(); toast('Diagnóstico salvo'); return; }
  if (id === 'f-par') { const voto = (document.querySelector('input[name=pv]:checked') || {}).value, txt = $('#pv-txt').value.trim(), err = $('#pv-err');
    if (!txt) { err.textContent = 'Escreva o parecer antes de registrar.'; err.hidden = false; $('#pv-txt').focus(); return; }
    if (!$('#pv-ci').checked) { err.textContent = 'Confirme a declaração de conflito de interesse. Se houver conflito, não registre parecer.'; err.hidden = false; return; }
    S.pareceres.push({u:eu().n, rodada:S.aval.rodada, voto, niv:$('#pv-niv').value, txt, d:agora()}); log('Comitê', 'Parecer registrado: ' + voto, 'Projeto 2025/009'); render(); toast('Parecer registrado'); return; }
  if (id === 'f-resp') { const bin = (document.querySelector('input[name=rb]:checked') || {}).value || null; S.resp[S.std] = {bin, qual:$('#rq').value.trim()}; if (bin === 'nao' && S.st[S.std] === 'C') S.st[S.std] = 'PTE'; log('Resposta', 'Resposta registrada: ' + (bin === 'sim' ? 'Sim' : bin === 'nao' ? 'Não' : 'sem resposta binária'), S.std); render(); toast('Resposta salva'); }
  else if (id === 'f-evid') {
    const txt = $('#ev-txt').value.trim(), sel = [...document.querySelectorAll('[data-doc]:checked')].map(x => x.dataset.doc), f = $('#ev-file').files[0], err = $('#ev-err');
    if (!txt) { err.textContent = 'Descreva a evidência antes de enviar.'; err.hidden = false; $('#ev-txt').focus(); return; }
    if (!sel.length && !f) { err.textContent = 'Vincule um documento da biblioteca ou envie um novo.'; err.hidden = false; return; }
    if (f) { const d = {id:novoId('D'), n:f.name.replace(/\.[^.]+$/, ''), c:$('#ev-fcls').value, v:[{n:1, d:agora(), u:eu().n}]}; S.docs.push(d); sel.push(d.id); log('Documento', 'Documento enviado à biblioteca: ' + d.n, ''); }
    (S.evid[S.std] = S.evid[S.std] || []).push({id:novoId('E'), t:txt, docs:sel, autor:eu().n, d:agora(), etapa:'Enviada', conf:null, chan:null});
    log('Evidência', 'Evidência enviada para conferência', S.std); email('E-mail ao Conferente: nova evidência para conferir'); render(); toast('Evidência enviada para conferência');
  }
  else if (id === 'f-area') { const txt = $('#ar-txt').value.trim(); if (!txt) { $('#ar-err').hidden = false; $('#ar-txt').focus(); return; }
    const ini = $('#ar-ini').value || null, fim = $('#ar-fim').value || null;
    S.areas.push({id:novoId('A'), std:S.std, t:txt, fase: ini && fim ? 'Planejada' : 'Detectada', resp:$('#ar-resp').value, ini, fim, concl:null}); log('Evidência', 'Área de melhoria registrada', S.std); render(); toast('Área de melhoria registrada'); }
  else if (id === 'f-doc') { const f = $('#doc-file').files[0]; if (!f) { $('#doc-err').hidden = false; return; }
    const d = {id:novoId('D'), n:f.name.replace(/\.[^.]+$/, ''), c:$('#doc-cls').value, v:[{n:1, d:agora(), u:eu().n}]}; S.docs.push(d); log('Documento', 'Documento enviado à biblioteca: ' + d.n, ''); render(); toast('Documento enviado e classificado'); }
  else if (id === 'f-user') { const n = $('#u-nome').value.trim(), m = $('#u-mail').value.trim(), err = $('#u-err');
    if (!n || !m || !m.includes('@')) { err.textContent = 'Informe nome e um e-mail válido.'; err.hidden = false; return; }
    if (S.usuarios.filter(u => u.a).length >= 40) { err.textContent = 'Limite de 40 usuários ativos por cliente atingido. Inative alguém antes.'; err.hidden = false; return; }
    S.usuarios.push({n, p:$('#u-perfil').value, a:true}); log('Usuário', 'Usuário cadastrado: ' + n, ''); email('E-mail de credenciais enviado a ' + n); render(); toast('Usuário cadastrado e credenciais enviadas'); }
  else if (id === 'f-ponto') { const t = $('#pt-txt').value.trim(); if (!t) { $('#pt-err').hidden = false; $('#pt-txt').focus(); return; }
    S.pontos.push({tipo:$('#pt-tipo').value, t, u:eu().n}); log('Avaliação', 'Ponto ' + ($('#pt-tipo').value === 'forte' ? 'forte' : 'fraco') + ' registrado', 'Projeto 2025/009'); render(); toast('Ponto registrado'); }
  else if (id === 'f-res') { const dec = (document.querySelector('input[name=rs]:checked') || {}).value, niv = $('#rs-niv').value, num = $('#rs-num').value.trim(), just = $('#rs-just').value.trim(), err = $('#rs-err'), c = calc();
    if (!num) { err.textContent = 'Informe o número da resolução.'; err.hidden = false; $('#rs-num').focus(); return; }
    const par = S.pareceres.filter(p => p.rodada === S.aval.rodada), cont = {}; par.forEach(p => cont[p.voto] = (cont[p.voto] || 0) + 1);
    const maioria = Object.keys(cont).find(k => cont[k] > par.length / 2);
    if (maioria && dec !== maioria && !just) { err.textContent = 'A decisão diverge da maioria dos pareceres. Escreva a justificativa.'; err.hidden = false; $('#rs-just').focus(); return; }
    if (dec === 'conceder' && niv !== c.nivel && !just) { err.textContent = `O nível final (${niv}) é diferente do calculado (${c.nivel || 'abaixo de Avançado'}). Escreva a justificativa.`; err.hidden = false; $('#rs-just').focus(); return; }
    S.resols.unshift({num, d:agora(), dec, niv, just, rodada:S.aval.rodada}); S.nivelFinal = dec === 'conceder' ? niv : null;
    if (dec === 'conceder') { S.cert = {emissao:HOJE, validade:addMeses(HOJE, 60), nivel:niv}; email('E-mail ao Responsável do projeto: certificado disponível, válido até ' + br(S.cert.validade)); }
    log('Comitê', `Resolução ${num}: ${dec === 'conceder' ? 'certificação concedida, nível ' + niv : dec === 'negar' ? 'certificação não concedida' : 'resposta do requerente solicitada'}`, 'Projeto 2025/009');
    if (dec === 'resposta') log('Comitê', 'Registro devolvido ao avaliador líder para a resposta do requerente', 'Projeto 2025/009');
    email('E-mail ao Responsável do projeto e ao Backoffice: resolução do Comitê de Certificação do IBES'); render(); toast('Resolução registrada'); }
  else if (id === 'f-agenda') { const data = $('#ag-data').value, eq = [...document.querySelectorAll('[data-eq]:checked')].map(x => x.dataset.eq), err = $('#ag-err');
    if (!data) { err.textContent = 'Escolha a data da visita.'; err.hidden = false; return; }
    if (!eq.length) { err.textContent = 'Selecione ao menos um avaliador.'; err.hidden = false; return; }
    const lider = eq.find(n => (S.equipe.find(x => x.n === n) || {}).f === 'Avaliador líder') || eq[0];
    S.visitas = [{id:'V1', tipo:$('#ag-tipo').value, data, equipe:eq, lider, rodada:S.aval.rodada}]; S.achados = {}; S.rel = false;
    log('Avaliação', `Avaliação agendada: ${$('#ag-tipo').value} em ${br(data)}`, 'Projeto 2025/009');
    email(`E-mail de agendamento enviado ao cliente e a ${eq.length} avaliador(es)`);
    render(); toast(restricao() ? 'Avaliação agendada. O cliente entrou no período de restrição.' : 'Avaliação agendada e e-mails enviados'); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenu(); });

const foot = document.createElement('p');
foot.className = 'muted'; foot.style.cssText = 'font-size:12px;padding:0 24px 24px;max-width:1320px';
foot.innerHTML = 'Protótipo em ambiente de homologação · Beta v0.3 Tester · atualizada em 27/10/2026 · identidade GRUPO IBES · manual, clientes e pessoas fictícios · dados salvos só neste navegador. <button type="button" class="btn link" data-act="reset" style="font-size:12px">Restaurar dados de exemplo</button>';
document.querySelector('.main').appendChild(foot);
render();
})();
