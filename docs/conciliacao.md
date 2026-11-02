# Conciliação

A tela em execução é o Beta v0.3 (`referencia/prototipo-v0.3.html`, regras em `src/lib/regras`). O prompt está em [prompt-v0.3.md](prompt-v0.3.md). Hospital, pessoas e textos de padrão dessa tela são fictícios. O motor SQL da amostra Serra Verde, descrito abaixo, continua com o limiar de 26/10.

Cada linha liga a resposta da [seção 5F](mapeamento-manual.md) ao banco, à função e à tela. A decisão de 27/10 está em [decisoes-2026-10-27.md](decisoes-2026-10-27.md). A amostra do Hospital Serra Verde, UGC Farmácia, é o caso usado nos testes: o padrão `5.06.02` está não aplicável por diagnóstico; o Grupo II aplicável fica 1 de 2, mínimo 1, e a rodada 2 de certificação calcula Ótima. Se esse padrão voltasse ao denominador sem estar cumprido, o mínimo do grupo passaria a 2 e o nível cairia para Avançada.

| Resposta | Onde ficou |
| --- | --- |
| Não aplicáveis por projeto, origem `diagnostico` | `padroes_nao_aplicaveis`. Check `origem = 'diagnostico'`. A linha aponta para o diagnóstico do mesmo projeto. |
| Ocultos para a instituição | Policy `padroes_nao_aplicaveis_ibes` (RLS forçada, sem policy para gestor e profissional). `app.padroes_do_projeto` tira o padrão da lista. A tela usa `padroesVisiveis`. |
| Saem do total e do mínimo | `app.calcular_nivel` e `calcularNivel`. O mínimo é `minimo_cumpridos(total_aplicavel, percentual)`, não o total do manual. A resposta da instituição não traz `excluidos_nao_aplicaveis` nem `total_manual`. |
| Sem `Ausente` | `conformidades.cumprido` é booleano. `conformidadePermitida` recusa a string `ausente`. Trigger impede conformidade de padrão não aplicável. |
| Diagnóstico v1 | `diagnosticos`: um por projeto, avaliador, data, anexo. Não há tabela de respostas padrão a padrão. |
| Rodada 1..n | `avaliacoes (projeto_id, rodada)` com `rodada >= 1`. |
| Evidências acumulam | `evidencias` não tem chave que substitua a anterior. Trigger de `DELETE` recusa a exclusão. A rodada nova nasce com conformidade vazia. |
| recusado / abandonado | Trigger `registrar_mudanca_estado`. Só `admin_ibes` e `responsavel_ibes`. Toda mudança de estado, inclusive essas, insere em `historico_estados` com perfil e motivo. |
| Resolução manual, revista em 27/10 | O Comitê de Certificação é do IBES. `resolucoes_comite` guarda `decisao`, `pontuacao`, `nivel_concedido`, `data` e `documento`. Não há coluna de órgão. `pareceres_comite` guarda `membro`, `parecer`, `voto` e `data`, com perfil `membro_comite`. Quem grava parecer é `membro_comite`. A resolução pode ser gravada por `admin_ibes`, `responsavel_ibes` ou `membro_comite`. A instituição lê a resolução e não lê o parecer. Telas na Fase 2. |
| Tipo do ciclo | `avaliacoes.tipo`: `certificacao`, `manutencao`, `recertificacao`. |
| Manutenção só Grupos I e II aplicáveis | Grupo III recebe `no_escopo = false` e não entra no nível. O cálculo não devolve Excelente. A tela tira esses padrões da lista da instituição. |
| Contagem ME 5 1_07 | `calcular_nivel` recusa outro código. `manuais` recusa ME 2 1_05. O 144 está só em `referencias_estrutura`. |

## Migrações

| Arquivo | Conteúdo |
| --- | --- |
| `db/migrations/20261026_01_catalogo_me5.sql` | Manual, limiares, padrões, referência de 144, mínimo inteiro, perfil da sessão. |
| `db/migrations/20261026_02_projeto_diagnostico.sql` | Projeto, diagnóstico e não aplicáveis. |
| `db/migrations/20261026_03_avaliacoes_rodada.sql` | Rodada, conformidade sem Ausente, evidência que não se apaga. |
| `db/migrations/20261026_04_historico_estados.sql` | Estados terminais e histórico. |
| `db/migrations/20261026_05_resolucao_comite.sql` | Resolução do comitê do IBES: decisão, pontuação, nível, data e documento. |
| `db/migrations/20261026_06_rls.sql` | Papel `app_sessao` e policies. |
| `db/migrations/20261026_07_calcular_nivel.sql` | Nível e lista visível por perfil. |
| `db/migrations/20261026_08_amostra.sql` | Doze padrões de demonstração e o projeto Serra Verde. Não é o catálogo oficial. |
| `db/migrations/20261027_01_comite_ibes.sql` | Perfil `membro_comite`, pareceres e alinhamento da resolução. |
| `db/migrations/20261027_02_importacao_arquivos.sql` | Lote de CSV ou JSON exportado, com anexos. Formato de entrada nulo, PENDENTE IBES. |
| `db/migrations/20261027_03_auditoria_regras_nivel.sql` | `auditoria` só com insert. `regras_nivel` com a tabela do v0.3 (Grupo III em 40%). PENDÊNCIA 30: `calcular_nivel` ainda não lê essa tabela. |

`db/test/decisoes.sql` percorre a amostra: nível Ótima, Grupo II com mínimo 1 em vez de 2, lista vazia de não aplicáveis para o gestor, recusa de estado terminal, evidência que não some, origem diferente de `diagnostico` rejeitada e Grupo III fora da manutenção.

A função TypeScript em `src/domain/calcularNivel.ts` segue a mesma conta. `npm test` cobre o domínio; `npm run test:sql` aplica as migrações num banco limpo e roda as asserções.

## Leitura que a implementação precisou fechar para a regra existir

Não são respostas novas do IBES. São o mínimo para a seção 5F funcionar, e estão abertas a correção:

- A decisão do comitê é texto livre. Não há lista fechada de decisões, nem de votos.
- `nivel_concedido` pode ficar vazio e não precisa coincidir com o nível calculado.
- A conformidade da rodada anterior não é copiada. O que acumula é a evidência.
- O limiar do Grupo III no ME 5 1_07 está em 70%, o valor do programa anterior ao ME 5 1_08. Trocar o número é um update em `manuais`, não uma mudança da função.
- Perfis da instituição, neste código: `gestor_instituicao` e `profissional_instituicao`. Perfis IBES: `admin_ibes`, `responsavel_ibes`, `avaliador_ibes`, `membro_comite`.

## Importação

O manual continua importado pelo IBES, a partir de arquivo exportado em CSV ou JSON e da pasta de anexos. `lotes_importacao.meio` aceita só `csv` ou `json`. `formato_entrada` fica nulo: o formato está **PENDENTE IBES** e a constraint recusa qualquer layout preenchido. Não há função de leitura da plataforma atual.

## Beta v0.3

A tela segue o protótipo: emblema e fundo oficiais, entrada por perfil de teste, índice de projetos, ficha, workflow, autoavaliação, evidência, avaliação, comitê e roteiro de testes. Os percentuais exibidos são os de `regras_nivel` (Avançado 70% no Grupo I, Ótimo com 40% no Grupo II, Excelente com 40% no Grupo III) e o mínimo arredonda para cima. O caso 139/142 aparece como 97,9% em `src/lib/regras/nivel.ts`.

O Supabase em São Paulo, o login por senha e os dois ambientes na Vercel ficam para quando houver credencial. Nesta homologação local o acesso é o seletor de perfil, e o estado fica no navegador.

## Pendências 21 a 28

Permanecem `PENDENTE IBES` em [respostas-ibes.md](respostas-ibes.md). O formato de entrada da importação de projetos também está PENDENTE IBES. O prompt v0.3 acrescenta as pendências 12, 19, 29, 30 e 33, que a tela marca e não decide.

## Beta v0.5 (02/11/2026)

O pedido está em [prompt-v0.5.md](prompt-v0.5.md). O HTML `referencia/prototipo-v0.5.html` ainda não está no repositório, então as telas em execução continuam as do v0.3. O que mudou no código:

- Consenso do comitê em `src/lib/regras/comite.ts`: três pareceres com o mesmo voto. Sem consenso, a resolução fica bloqueada (`SEM_CONSENSO`). PENDÊNCIA 34.
- Uma janela de 12 meses desde a abertura, em `prazoAutoavaliacao`. Manutenção +30 e recertificação +60 contam da certificação. `manuais.prazo_autoavaliacao_meses` nasce em 12. Não há coluna de um segundo prazo.
- Universo em `src/lib/regras/universo.ts`: núcleo + anexos do projeto − N/A do manual − N/A do diagnóstico. O percentual do nível incide sobre esse conjunto. O Diagnóstico não altera `nao_se_aplica_manual`.
- `db/migrations/20261102_01_manuais_v05.sql` cria âmbito, critério, anexo, elemento, requisito, prova e o staging de projetos. Requisitos ficam sob RLS dos perfis IBES. O motor SQL `calcular_nivel` de 26/10 segue recusando ME 2 1_05 como denominador.
- A tela `/importar-manual` lê a planilha, mostra o resumo e só então confirma. Nesta homologação a confirmação não grava no Postgres. A planilha de teste é fictícia (ME 0 0_00).
- Arquivo novo: até 20 MB, caminho `projeto/{id}/id_origem/{id}`. O lote histórico não passa por esse limite. A extração continua fora do repositório.
