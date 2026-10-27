# Certificação ACSA no IBES

Projeto da UGC Farmácia do Hospital Serra Verde com as respostas do IBES de 26/10/2026 já no cálculo, na tela e nas migrações.

O manual que conta é o **ME 5 1_07**. O mapeamento **ME 2 1_05**, de **144 padrões**, aparece só como referência de estrutura. O catálogo carregado tem 12 padrões de demonstração (`catalogo_oficial = false`) para a regra ser visível antes do manual completo.

## O que a tela faz

- Esconde padrão não aplicável do gestor e do profissional da instituição, e mostra a origem `diagnostico` para os perfis IBES.
- Recalcula Avançada, Ótima e Excelente sem esses padrões no total e no mínimo.
- Na manutenção, tira o Grupo III do cálculo.
- Abre a rodada seguinte sem apagar evidência.
- Recusa `recusado` e `abandonado` para quem não é admin IBES ou responsável IBES, e grava o histórico quando a passagem é válida.
- Registra a resolução do comitê à mão, com órgão ACSA ou IBES.

As pendências 21 a 28 estão em `docs/respostas-ibes.md` como **PENDENTE IBES**, sem decisão.

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

Isso recria o banco `certificacao_ibes`, aplica as migrações e confere as decisões de 26/10.

## Documentos

- `docs/mapeamento-acsa.md` — seção 5F com as respostas.
- `docs/conciliacao.md` — onde cada resposta caiu no esquema.
- `docs/respostas-ibes.md` — o que foi aplicado e o que continua pendente.
