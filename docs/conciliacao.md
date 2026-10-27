# Conciliação das respostas de 26/10

Cada linha liga a resposta da [seção 5F](mapeamento-acsa.md) ao banco, à função e à tela. A amostra do Hospital Serra Verde, UGC Farmácia, é o caso usado nos testes: o padrão `5.06.02` está não aplicável por diagnóstico; o Grupo II aplicável fica 1 de 2, mínimo 1, e a rodada 2 de certificação calcula Ótima. Se esse padrão voltasse ao denominador sem estar cumprido, o mínimo do grupo passaria a 2 e o nível cairia para Avançada.

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
| Resolução manual | `resolucoes_comite`: `orgao` ACSA ou IBES, data, resultado em texto, pontuação, `nivel_concedido`, documento. Insert só para admin e responsável IBES. Nenhuma tabela de integração. |
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
| `db/migrations/20261026_05_resolucao_comite.sql` | Resolução manual. |
| `db/migrations/20261026_06_rls.sql` | Papel `app_sessao` e policies. |
| `db/migrations/20261026_07_calcular_nivel.sql` | Nível e lista visível por perfil. |
| `db/migrations/20261026_08_amostra.sql` | Doze padrões de demonstração e o projeto Serra Verde. Não é o catálogo oficial. |

`db/test/decisoes.sql` percorre a amostra: nível Ótima, Grupo II com mínimo 1 em vez de 2, lista vazia de não aplicáveis para o gestor, recusa de estado terminal, evidência que não some, origem diferente de `diagnostico` rejeitada e Grupo III fora da manutenção.

A função TypeScript em `src/domain/calcularNivel.ts` segue a mesma conta. `npm test` cobre o domínio; `npm run test:sql` aplica as migrações num banco limpo e roda as asserções.

## Leitura que a implementação precisou fechar para a regra existir

Não são respostas novas do IBES. São o mínimo para a seção 5F funcionar, e estão abertas a correção:

- O resultado do comitê é texto livre. Não há lista fechada de resultados.
- `nivel_concedido` pode ficar vazio e não precisa coincidir com o nível calculado.
- A conformidade da rodada anterior não é copiada. O que acumula é a evidência.
- O limiar do Grupo III no ME 5 1_07 está em 70%, o valor do programa anterior ao ME 5 1_08. Trocar o número é um update em `manuais`, não uma mudança da função.
- Perfis da instituição, neste código: `gestor_instituicao` e `profissional_instituicao`. Perfis IBES: `admin_ibes`, `responsavel_ibes`, `avaliador_ibes`.

## Pendências 21 a 28

Permanecem `PENDENTE IBES` em [respostas-ibes.md](respostas-ibes.md). Nenhuma migração, policy ou ramo de `calcularNivel` escolhe uma delas.
