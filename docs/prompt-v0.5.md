# ACSAS IBES MODERN — Beta v0.5

02/11/2026 · Beta v0.5. A tela de referência é `referencia/prototipo-v0.5.html`, já neste repositório. As telas em execução continuam as do protótipo v0.3, com o consenso, os selos Ausente e Pendente e o rótulo da pontuação. O restante das telas do v0.5 e os roteiros Playwright T16–T20 ficam para a próxima rodada.

O restante de [prompt-v0.3.md](prompt-v0.3.md) continua valendo, salvo o que esta versão corrige. Duas regras que tinham sido escritas para a v0.4 estavam erradas e foram desfeitas no código, não só no texto: comitê por maioria e dois prazos de 12 meses.

## 4. Fluxo — o que muda

- O Comitê decide por consenso. Os 3 membros votam igual. Com pareceres divergentes, a resolução fica bloqueada e a tela mostra «Sem consenso». O que acontece depois é a pendência 34. A decisão registrada segue o consenso. A justificativa continua obrigatória quando o nível final difere do calculado.
- O prazo do Comitê é de 30 dias a partir de `avaliacoes.resultado_positivo_em`. Vencido, e ainda sem resolução, a etapa não avança para comitê nem para certificado. Na tela, a pontuação se chama «Pontuação (% de cumprimento dos padrões)». A pendência 23 continua aberta.
- O prazo de 12 meses é uma janela única, contada da abertura do projeto. Nela a unidade conclui a autoavaliação e solicita a auditoria. Não existem dois prazos de 12 meses.
- Manutenção aos 30 meses e recertificação aos 60 meses, ambos contados da data de certificação.
- O universo do projeto é o núcleo do manual mais os anexos escolhidos no projeto, menos o que não se aplica no manual, menos o que o Diagnóstico marcou como não aplicável.
- O que não se aplica no manual vale para todo projeto daquele manual e o Diagnóstico não desmarca.
- O anexo usa os mesmos percentuais de nível do núcleo.

A frase do v0.3 que liberava a resolução com 2 pareceres e maioria deixa de valer.

## 5. Contagens de referência

Estes números são contagem, não texto de padrão. Nenhum enunciado oficial entra em código, semente ou teste.

| Manual | Listados | Anexos | Núcleo por grupo | N/A do manual | No cálculo |
| --- | --- | --- | --- | --- | --- |
| ME 2 1_05 Centros Hospitalares | 144 | nenhum | 65 obrigatórios, 98 GI, 30 GII, 16 GIII | 2 (1 GI, 1 GII) | referência de estrutura; desde 09/11 o motor conta os padrões deste manual e 144 não é denominador |
| ME 5 1_07 UGC | 101 + Laboratório 28 + Hemodiálise 6 + Imagem 24 = 159 | os três | 41 obrigatórios, 65 GI, 24 GII, 12 GIII | 2 (1 GII, 1 GIII) | só o núcleo = 99 (65/23/11); núcleo + Laboratório = 127 (129 − 2) |
| ME 28 1_01 | 102 + Diálise 6 + Imagem 10 = 118 | os dois | 41 / 69 / 20 / 13 | 0 | núcleo + Imagem = 112 |

ME 5 lista 101 e o cálculo do núcleo usa 99 porque os 2 que não se aplicam no manual saem do total. Elementos e requisitos, só como volume: ME 2 tem 456 elementos e 523 requisitos, sem provas; ME 5 tem 425 elementos e 628 requisitos; ME 28 tem 342 elementos e 320 requisitos.

Hierarquia: âmbito (I–V) › critério (01–11) › padrão › elemento avaliável (autoavaliação) e, à parte, requisito de avaliação (avaliação externa). Cada requisito tem zero ou mais provas, de um catálogo por manual. A prova é opcional. Elemento e requisito guardam o identificador numérico de origem em `id_origem_acsa`. O código do padrão leva o sufixo de versão (`ES 2 01.01_00`). O projeto usa o código do sistema.

A tabela de percentuais do v0.3 permanece. O mínimo continua arredondando para cima. Desde 09/11 o motor SQL lê `regras_nivel` (Grupo III em 40% na amostra).

## 6. Modelo — o que esta migração acrescenta

`db/migrations/20261102_01_manuais_v05.sql` é uma migração nova. As anteriores não são reescritas.

```
ambitos              (id, manual_id, codigo 'I'..'V', nome, ordem)
criterios            (ambito_id)                         -- no lugar de blocos
anexos_manual        (id, manual_id, nome, ordem)
padroes              + criterio_id, anexo_id null, nao_se_aplica_manual, id_origem_acsa
elementos_avaliaveis (padrao_id, ordem, texto, id_origem_acsa)
requisitos_avaliacao (padrao_id, ordem, texto, id_origem_acsa)
provas               (manual_id, codigo, nome)
requisitos_provas    (requisito_id, prova_id)
projetos_anexos      (projeto_id, anexo_id)
manuais              prazo_autoavaliacao_meses int default 12
documentos           (projeto_id, nome, id_origem_acsa)
evidencias_arquivos  (evidencia_id, documento_id)
```

Não há coluna `prazo_solicitar_auditoria_meses`. `requisitos_avaliacao` e `requisitos_provas` são visíveis só para `admin_ibes`, `responsavel_ibes`, `avaliador_ibes` e `membro_comite`.

Staging, sem tela final:

```
stg_projetos     (idpry_acsa, codigo, manual_codigo, payload jsonb, importado_em)
stg_documentos   (id_fichero_acsa, idpry_acsa, idaut_acsa, nome, tamanho_bytes, enviado_em, enviado_por, arquivo_path)
stg_doc_vinculos (id_fichero_acsa, cod_estandar, id_evidencia_acsa, descricao_evidencia, descricao_area_melhoria)
```

O texto de área de melhoria do lote histórico fica em `stg_doc_vinculos`. O vínculo do arquivo com a evidência é `evidencias_arquivos`.

## 10. Pendências

Quando a tarefa depender destes itens, deixe em configuração e marque `// PENDÊNCIA nº`:

- 34: sem consenso no Comitê, o que acontece (nova rodada, desempate, troca de membro)? O bloqueio está implementado.
- 33: regra de conflito de interesse do Comitê. A declaração continua em cada parecer.
- 21: unidade dos prazos de Diagnóstico (1), Candidatura (2) e da nova avaliação após negativa (6). Os números estão em `PRAZOS_ETAPA`. A unidade não foi decidida.
- 31: exportação formal dos dados da ACSA (até 30/11/2026).
- 46: a exportação formal inclui os anexos das evidências?
- 40: licença formal do IBES para os textos dos manuais (os PDFs trazem Creative Commons BY-NC-ND).
- 19: a IA continua no escopo?
- 49: remover os apelidos `responsavel_ibes`, `gestor_instituicao` e `profissional_instituicao` depois da migração dos dados. Enquanto isso valem como Backoffice, Responsável do projeto e Conferente. `admin_ibes`, `avaliador_ibes` e `membro_comite` permanecem, porque já são nomes da matriz.
- 47: limite e tipos do arquivo novo. Nesta versão o teto é 25 MB e a recusa cobre zip e executáveis. O lote histórico não passa por esse teto. O bucket fica com limite provisório de 500 MB.
- 48: o código do projeto nasce sugerido e pode ser editado. Nesta versão só Administrador e Backoffice criam projeto, do zero ou a partir da candidatura. A regra continua em aberto.
- 50: obrigatório cumprido só por área de melhoria concluída libera a saída da autoavaliação? (hoje: não)

Fechadas e removidas: 2 (101 × 99 = N/A do manual), 4 (manuais extraídos) e 12 (28/10: sair da autoavaliação exige Cumpre e evidência chancelada em todo obrigatório aplicável). As pendências 23, 25, 27 e 29 do v0.3 que não foram fechadas aqui continuam abertas. A 30 deixou de travar o motor SQL em 09/11.

## Importação

A tela do IBES em `/importar-manual` lê um `.xlsx` com as abas `Padroes`, `Elementos`, `Requisitos_avaliacao` e `Provas`, nas colunas pedidas no prompt. Os totais por critério precisam bater com o que o usuário informa. A gravação é uma transação. O resumo (padrões, elementos, requisitos, provas, N/A do manual) aparece antes da confirmação. O teste usa a planilha fictícia ME 0 0_00. O conteúdo oficial dos manuais não entra no repositório.

O índice de documentos da migração é o JSON `indice_documentos_idautN.json`. A deduplicação do índice é por `id_fichero`. No Storage, o mesmo SHA-256 do lote histórico compartilha um objeto. Volume contado na extração de 02/11: 112.009 arquivos, cerca de 97 GB. O número de 46 GB estava errado. O plano Supabase Pro tem 100 GB, com cerca de 3 GB de folga. Arquivo novo: até 25 MB, no caminho `projeto/{id}/documentos/{doc}/v{n}/{arquivo}`, com URL assinada por 120 segundos. O lote histórico não passa por esse limite de 25 MB e o arquivo local não é renomeado. O bucket `documentos` fica com `file_size_limit` provisório de 500 MB. O sistema não acessa a plataforma de origem; a extração é feita fora do repositório.

## Testes

Vitest cobre consenso, prazos, universo, nível com anexo, a recusa do Diagnóstico sobre N/A do manual, a planilha fictícia e o índice de documentos. `npm run test:sql` cobre a coluna de 12 meses, a ausência do segundo prazo, o bloqueio para desmarcar N/A do manual e a invisibilidade do requisito para a instituição. Playwright T16–T20 espera o protótipo v0.5.
