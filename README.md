# ACSAS IBES MODERN

Plataforma de acreditação do IBES. A tela em execução é o Beta v0.5: índice de projetos, projeto novo, candidaturas, ficha, biblioteca, diagnóstico, autoavaliação, ficha do padrão, áreas de melhoria, workflow, avaliação, comitê, relatório, usuários, indicadores, log e migração. O projeto fictício `2025/009` do Hospital Modelo de Demonstração abre em `/projetos/2025-009`. Definições de padrão continuam texto fictício. O catálogo oficial entra pela importação do IBES.

As regras do Beta v0.5 (02/11/2026) estão no motor: consenso do comitê, janela única de 12 meses e universo do projeto. O HTML do protótipo v0.5 está em `referencia/prototipo-v0.5.html`. Avaliação, comitê, relatórios, usuários, indicadores e o log ficam para a próxima rodada. A matriz de perfis já abre em Usuários, sem cadastro. Sem `ACSAS_DATABASE_URL`, a homologação usa a sessão de demonstração. Com a variável, projeto, candidatura, documento, diagnóstico, resposta, evidência, área e etapa gravam no Postgres e na auditoria.

## Rodar

```bash
npm install
npm test
npm run test:sql
npm run test:e2e
npm run dev
```

A aplicação sobe em [http://127.0.0.1:4317](http://127.0.0.1:4317). Na entrada, escolha um perfil de teste. Não há senha nesta homologação: o login do Supabase entra quando houver credencial.

A confirmação da planilha de manual fica em [http://127.0.0.1:4317/importar-manual](http://127.0.0.1:4317/importar-manual). O botão «Baixar planilha fictícia» entrega o ME 0 0_00, com as mesmas colunas do importador. Informe os totais `01 2` e `02 1`, veja o resumo e confirme. Nesta homologação a confirmação não grava no Postgres.

Para conferir o banco local:

```bash
npm run test:sql
```

## O que está nesta entrega

- Emblema e fundo oficiais, cabeçalho e as telas da Prioridade 1 e das rodadas 2a e 2b: índice com busca, projeto novo, candidaturas, ficha, biblioteca, diagnóstico, autoavaliação, ficha do padrão, áreas de melhoria, workflow, avaliação, comitê, relatório, usuários, indicadores, log e migração. Atribuição por critério continua na próxima rodada, sem remontar o script v0.3.
- Regras de nível e de permissão em `src/lib/regras`, com teste. O caso conhecido 139/142 aparece como 97,9%. Na manutenção o Grupo III sai do escopo e o nível não chega a Excelente.
- Consenso: três pareceres com o mesmo voto. Sem consenso, `podeResolver` devolve `SEM_CONSENSO` (pendência 34).
- Prazos: 12 meses desde a abertura para a autoavaliação e o pedido de auditoria; manutenção +30 e recertificação +60 desde a certificação.
- Universo: núcleo + anexos escolhidos − N/A do manual − N/A do diagnóstico. O anexo usa o mesmo percentual do núcleo.
- `auditoria` só aceita insert. Desde 09/11 o motor SQL lê `regras_nivel` e aceita manual importado. O 144 de ME 2 1_05 não é denominador. O lote histórico da extração tem 112.009 arquivos, cerca de 97 GB. Arquivo novo: até 25 MB.

## Documentos

- `docs/prompt-v0.5.md` — pedido do Beta v0.5.
- `docs/prompt-v0.3.md` — pedido do Beta v0.3, ainda válido no que a v0.5 não corrige.
- `referencia/prototipo-v0.3.html` — protótipo anterior. O script continua no repositório e não é a tela em `/`.
- `referencia/prototipo-v0.5.html` — referência das telas do Beta v0.5.
- `docs/decisoes-2026-10-27.md` — comitê do IBES e importação por arquivo.
- `docs/conciliacao.md` — onde cada resposta caiu no esquema.
- `docs/mapeamento-manual.md` — seção 5F com as respostas de 26/10.
- `docs/respostas-ibes.md` — o que foi aplicado e o que continua pendente.
