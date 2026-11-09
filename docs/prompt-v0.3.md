# ACSAS IBES MODERN · Prompt para o Cursor

> Cole este arquivo como primeira mensagem no Cursor (ou salve como `AGENTS.md` na raiz do repositório).
> Referências que acompanham este prompt:
> - `.cursor/rules/ibes-interface.mdc`: formato de interface (obrigatório em toda tela)
> - `referencia/prototipo-v0.3.html`: protótipo navegável Beta v0.3 Tester (fonte da verdade de telas, regras e fluxos)
> - `public/brand/ibes-emblema.png`: emblema oficial definitivo (fundo transparente)
> - `public/brand/ibes-fundo.jpg`: fundo oficial das páginas
>
> Versão: 27/10/2026 · Beta v0.3

---

## 1. Papel e objetivo

Você é o desenvolvedor sênior do **ACSAS IBES MODERN**, o sistema web de acreditação de unidades de saúde do **IBES** (Instituto Brasileiro para Excelência em Saúde). O IBES vai encerrar o contrato com a ACSA, e este sistema substitui a plataforma legada (ASP clássico), em domínio e identidade visual próprios do IBES.

Regra de ouro: reproduza o **processo e as regras** de acreditação. Nunca copie código, layout, ícones, identidade visual ou textos dos manuais da ACSA. Conteúdo de manual (definições, propósitos, elementos avaliáveis) entra no sistema por **importação feita pelo IBES**, nunca escrito no código ou em seeds.

Equipe: 2 desenvolvedores. Trabalhe em entregas pequenas, testáveis e com commit por funcionalidade.

## 2. Stack (não troque sem pedir)

- **Next.js** (App Router) + **TypeScript** estrito
- **Supabase**: Postgres, Auth (login e senha), Storage, **RLS em todas as tabelas**, região **São Paulo (sa-east-1)**
- **Vercel** para deploy, com dois ambientes desde a semana 1: **homologação** e **produção**
- **Tailwind CSS** + componentes **shadcn/ui** restilizados com os tokens do IBES (ver regra de interface)
- **API do Claude** só no servidor (route handlers / server actions), nunca no cliente
- Validação com **Zod**; datas em `America/Sao_Paulo`; formato `dd/mm/aaaa`
- Testes: **Vitest** para regras de negócio (motor de nível, bloqueios, permissões) e **Playwright** para os 10 casos do roteiro de teste

## 3. Perfis e permissões

**Cliente (instituição):** Responsável do projeto · Responsável pelo upload · Conferente · Autorizador (chancela). Limite: **40 usuários ativos por cliente**.

**IBES:** Administrador IBES · Backoffice IBES · Educador · Tutor de relatório · Avaliador · Avaliador líder · Membro do Comitê de Certificação.

| Ação | Quem pode |
|---|---|
| Registrar diagnóstico e padrões "não se aplica" | Backoffice, Administrador |
| Alterar estado do projeto (inclui Recusado e Abandonado) | Backoffice, Administrador, com motivo obrigatório |
| Avançar etapa e alterar prazos | Backoffice, Administrador |
| Validar ou devolver candidatura | Backoffice, Administrador |
| Responder padrão e enviar evidência | Responsável do projeto; Responsável pelo upload só nos critérios com permissão "redação" |
| Atribuir permissão por critério ao Responsável pelo upload | Responsável do projeto |
| Conferir evidência | Conferente |
| Chancelar evidência | Autorizador |
| Marcar "Cumpre" | Autorizador ou Responsável do projeto |
| Registrar resultado por padrão e pontos fortes/fracos | Avaliador, Avaliador líder |
| Consolidar pontos e definir resultado da rodada | Avaliador líder |
| Abrir nova rodada de avaliação | Backoffice, Administrador |
| Registrar parecer e resolução | Membro do Comitê |

Toda permissão é aplicada **no banco (RLS)** e repetida na interface. Botão sem permissão aparece desabilitado com a explicação de quem pode agir.

## 4. Fluxo da acreditação

Etapas do projeto (workflow com avanço **manual** pelo IBES e **bloqueio** quando houver pendência):

`Diagnóstico → Solicitação → Autoavaliação → Avaliação → Certificação → Manutenção 1..N → Recertificação`

- **Diagnóstico** (antes da abertura): o avaliador levanta perfil e serviços da instituição; o IBES registra avaliador, data, relatório anexo e a lista de padrões **não aplicáveis**. Os N/A **não aparecem para a unidade** (filtro por RLS e na tela) e saem do total e do mínimo do cálculo.
- **Autoavaliação:** cada padrão tem resposta binária (Sim/Não), resposta qualitativa e evidências. A evidência passa por **envio → conferência → chancela**, e cada passo grava usuário, data e hora. Devolução exige motivo.
- **Regra do Cumpre:** só libera com resposta "Sim" **e** ao menos uma evidência chancelada, ou uma área de melhoria concluída.
- **Bloqueio para sair da Autoavaliação:** todo padrão obrigatório aplicável precisa de Cumpre marcado e de evidência chancelada. Fechado em 28/10.
- **Avaliação:** agendamento (tipo, data, equipe, e-mail para cliente e equipe), relatório do avaliador por padrão (certificação: Cumpre/Não cumpre; manutenção: Mantém/Não mantém), pontos fortes e fracos em texto livre com consolidação pelo líder.
- **Resultado da rodada:** Em curso | Positiva | Negativa. **Negativa mantém o mesmo projeto e o mesmo código**: o IBES abre a rodada seguinte (`rodada` 2, 3…), os resultados do avaliador recomeçam e as evidências continuam.
- **Comitê de Certificação do IBES** (só com resultado Positiva): tela de conferência relatório × evidências; cada membro registra **parecer** (voto, nível proposto, texto, declaração de conflito de interesse); a **resolução** libera com 2 pareceres e segue a maioria (regra provisória, pendência 33). Justificativa obrigatória quando a decisão diverge da maioria ou o nível difere do calculado.
- **Certificado:** emitido na resolução de concessão, validade **60 meses**. Manutenção aos **30 meses**; recertificação aos **60 meses**. A quantidade de manutenções fica configurável (1 a 3) até o IBES confirmar.
- **Manutenção** avalia só os padrões aplicáveis dos **Grupos I e II**.
- **Restrição de uso:** o cliente só consulta a plataforma de 5 semanas antes a 5 semanas depois de cada avaliação (envios e aprovações bloqueados).
- **Estados do projeto (10):** Em curso, Acreditado, Recusado, Abandonado, Vencido, Cancelado, Pendente, Suspensão, Retirado, Denegado. Recusado e abandonado seguem o contrato e só o IBES altera.
- **Candidatura:** o IBES valida ou **devolve para correção** com motivo. Devolver não é o estado "Recusado".

## 5. Motor de nível (regras em configuração por manual)

| Nível | Grupo I | Grupo II | Grupo III |
|---|---|---|---|
| Avançado | ≥ 70% **e** 100% dos obrigatórios | — | — |
| Ótimo | 100% | ≥ 40% | — |
| Excelente | 100% | 100% | ≥ 40% |

- Base de cálculo = padrões **aplicáveis** do projeto (N/A fora do numerador e do denominador).
- Mínimo arredondado **para cima** (`Math.ceil`).
- Percentuais em tabela `regras_nivel` por manual, nunca fixos no código.
- O sistema calcula o nível; o **nível final** sai da resolução do Comitê.
- Escreva testes unitários com o caso real conhecido: 144 padrões, 2 N/A, 139 cumprem → 139/142 = 97,9%.

## 6. Modelo de dados (Supabase)

Hierarquia do manual: `manuais → blocos → criterios → padroes → elementos_avaliaveis`, mais `regras_nivel`.

Tabelas do projeto, todas com `created_at`, `created_by` e RLS:

```
instituicoes, projetos (codigo AAAA/NNN, estado, etapa_atual, manual_id, ciclos_manutencao)
diagnosticos (projeto_id, avaliador_id, data, arquivo_path)
projeto_padroes_na (projeto_id, padrao_id, origem='diagnostico', registrado_por, registrado_em)
etapas_projeto (projeto_id, etapa, prazo, realizada_em)
historico_estados (projeto_id, de, para, motivo, usuario_id, em)
perfis, projeto_membros (usuario_id, projeto_id, perfil), permissoes_criterio (usuario_id, criterio_id, nivel: redacao|leitura|sem)
respostas (projeto_id, padrao_id, binaria, qualitativa, status: C|PTE)
documentos (projeto_id, nome, classificacao), documento_versoes (documento_id, versao, arquivo_path, enviado_por, enviado_em)
evidencias (projeto_id, padrao_id, texto, etapa: enviada|conferida|chancelada|devolvida)
evidencia_documentos (evidencia_id, documento_id)   -- um documento serve a N padrões
aprovacoes_evidencia (evidencia_id, acao: envio|conferencia|chancela|devolucao, motivo, usuario_id, em)
areas_melhoria (projeto_id, padrao_id, texto, fase: detectada|planejada|concluida, responsavel_id, inicio, fim, concluida_em)
avaliacoes (projeto_id, tipo: certificacao|manutencao|recertificacao, rodada, resultado: em_curso|positiva|negativa, data_visita, lider_id)
avaliacao_equipe, resultados_padrao (avaliacao_id, padrao_id, resultado, observacao)
pontos_avaliacao (avaliacao_id, tipo: forte|fraco, texto, avaliador_id, consolidado)
pareceres_comite (avaliacao_id, membro_id, voto, nivel_proposto, texto, sem_conflito boolean, em)
resolucoes_comite (avaliacao_id, numero, decisao, nivel_final, pontuacao, justificativa, em)
certificados (projeto_id, nivel, emissao, validade)
emails_enviados (projeto_id, gatilho, destinatarios, enviado_em)
auditoria (usuario_id, perfil, tipo, acao, objeto, em)   -- só insert, nunca update/delete
```

Evidência pertence a **projeto + padrão**, não à fase: acumula entre rodadas e ciclos. Arquivos nunca são apagados; nova versão substitui a atual e as anteriores ficam no histórico.

## 7. LGPD (sem exceção)

- Nenhum dado real em código, seed, teste ou print: use nomes fictícios ("Hospital Modelo de Demonstração", "Avaliadora A").
- Evidências podem conter dado de saúde: bucket privado, URLs assinadas de curta duração, acesso só por RLS.
- Tabela `auditoria` só aceita insert. Todo envio, conferência, chancela, devolução, mudança de etapa ou estado, parecer e resolução gera linha.
- A IA (sugestão de evidências) recebe só código, propósito e elementos do padrão. **Nunca** anexos ou dados da instituição. Permanência no escopo: pendência 19.

## 8. Interface

Siga **integralmente** `.cursor/rules/ibes-interface.mdc`. Resumo: identidade GRUPO IBES (rosa e branco, fundo oficial `ibes-fundo.jpg`), emblema oficial sem alteração e sem tela de upload, cabeçalho com menu em linha própria abaixo de 1700 px, menu lateral do projeto, quadros brancos, estados com texto + cor, tudo funcionando no celular.

Rotas sugeridas (App Router):

```
/entrar
/projetos                         índice + candidaturas + vencimentos
/projetos/[id]                    ficha do projeto + estado + histórico
/projetos/[id]/workflow           etapas, prazos, bloqueios, ciclos, e-mails
/projetos/[id]/diagnostico        só IBES
/projetos/[id]/usuarios
/projetos/[id]/indicadores
/projetos/[id]/log
/projetos/[id]/autoavaliacao
/projetos/[id]/autoavaliacao/[padrao]
/projetos/[id]/biblioteca
/projetos/[id]/atribuicao
/projetos/[id]/planos-de-acao
/projetos/[id]/relatorios
/projetos/[id]/avaliacao
/projetos/[id]/comite
```

## 9. Ordem de entrega (Fase 1, 8 semanas)

1. Repositório, dois ambientes, Supabase SP, Auth, tabela de auditoria, layout base com tokens e logotipo.
2. Manual (importação por planilha), projetos, diagnóstico e N/A, workflow com etapas, prazos e bloqueio.
3. Autoavaliação: lista, ficha do padrão, respostas, biblioteca de documentos com versões, evidência com envio, conferência e chancela, regra do Cumpre.
4. Motor de nível com testes, resumo dos 3 grupos, relatórios e indicadores iniciais.
5. Usuários, permissões por critério, painel de log, restrição de 5 semanas.

Fase 2: avaliação, rodadas, comitê, certificado, manutenção, e-mails automáticos. Fase 3: indicadores completos, migração, desempenho para 210 clientes, entrega do código ao IBES.

## 10. Pendências: não invente resposta

Quando uma tarefa depender destes itens, implemente como **configuração** e marque `// PENDÊNCIA nº` no código:

- 12: fechada em 28/10. Sair da autoavaliação exige Cumpre e evidência chancelada em todo obrigatório aplicável.
- 19: IA continua no escopo?
- 21: prazo e limite de rodadas após avaliação negativa
- 23: campos da resolução e o que é a "pontuação"
- 25: recertificação no mesmo projeto ou em projeto novo
- 27: o nível pode subir na manutenção?
- 30: uso do manual ME 5 1_07 após o fim do contrato com a ACSA
- 33: composição, quórum e conflito de interesse do Comitê
- Quantidade de manutenções (1 informada pelo IBES × 1 a 3 na lista de 22/10)

## 11. Como trabalhar comigo

- Antes de cada funcionalidade, liste os arquivos que vai criar ou alterar e a migração SQL.
- Toda regra de negócio fica em `lib/regras/*.ts` com teste; componentes não calculam regra.
- Se algo contradizer este prompt ou o protótipo, **pare e pergunte**. Não escolha sozinho.
- Ao terminar cada passo: o que foi feito, como testar e o que ficou pendente.
