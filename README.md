# Certificação IBES

Projeto da UGC Farmácia do Hospital Serra Verde. O manual operacional é o **ME 5 1_07**, importado pelo IBES. O mapeamento **ME 2 1_05**, de **144 padrões**, aparece só como referência de estrutura. O catálogo carregado tem 12 padrões de demonstração (`catalogo_oficial = false`).

## O que a tela faz

- Esconde padrão não aplicável do gestor e do profissional da instituição, e mostra a origem `diagnostico` para os perfis IBES, inclusive o membro do comitê.
- Recalcula Avançada, Ótima e Excelente sem esses padrões no total e no mínimo.
- Na manutenção, tira o Grupo III do cálculo.
- Abre a rodada seguinte sem apagar evidência.
- Recusa `recusado` e `abandonado` para quem não é admin IBES ou responsável IBES, e grava o histórico quando a passagem é válida.
- Reserva o Comitê de Certificação ao IBES. Parecer e resolução estão no banco. As telas entram na Fase 2.

As pendências 21 a 28 e o formato de entrada da importação estão **PENDENTE IBES**.

## Rodar

```bash
npm install
npm test
npm run dev
```

A aplicação sobe em [http://127.0.0.1:4317](http://127.0.0.1:4317).

As migrações são SQL puro, em `db/migrations`. Com PostgreSQL local:

```bash
npm run test:sql
```

Isso recria o banco `certificacao_ibes`, aplica as migrações e confere as decisões.

## Documentos

- `docs/decisoes-2026-10-27.md` — comitê do IBES e importação por arquivo.
- `docs/mapeamento-manual.md` — seção 5F com as respostas de 26/10.
- `docs/conciliacao.md` — onde cada resposta caiu no esquema.
- `docs/respostas-ibes.md` — o que foi aplicado e o que continua pendente.
