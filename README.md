# ACSAS IBES MODERN

Plataforma de acreditação do IBES, Beta v0.3. A tela em execução reproduz o protótipo navegável: identidade do GRUPO IBES, projeto fictício `2025/009` do Hospital Modelo de Demonstração e o manual de demonstração. Definições de padrão nessa tela são texto fictício. O catálogo oficial entra por importação do IBES.

## Rodar

```bash
npm install
npm test
npm run dev
```

A aplicação sobe em [http://127.0.0.1:4317](http://127.0.0.1:4317). Na entrada, escolha um perfil de teste. Não há senha nesta homologação: o login do Supabase entra quando houver credencial.

Para conferir o banco local:

```bash
npm run test:sql
```

## O que está nesta entrega

- Emblema e fundo oficiais, cabeçalho, menu do projeto e as telas do protótipo v0.3.
- Regras de nível e de permissão em `src/lib/regras`, com teste. O caso conhecido 139/142 aparece como 97,9%. Na manutenção o Grupo III sai do escopo e o nível não chega a Excelente.
- `auditoria` só aceita insert. `regras_nivel` guarda os percentuais do v0.3. O motor SQL da amostra Serra Verde ainda usa o limiar de 26/10 (Grupo III em 70%). Isso é a pendência 30.

## Documentos

- `docs/prompt-v0.3.md` — pedido do Beta v0.3.
- `referencia/prototipo-v0.3.html` — fonte das telas.
- `docs/decisoes-2026-10-27.md` — comitê do IBES e importação por arquivo.
- `docs/conciliacao.md` — onde cada resposta caiu no esquema.
- `docs/mapeamento-manual.md` — seção 5F com as respostas de 26/10.
- `docs/respostas-ibes.md` — o que foi aplicado e o que continua pendente.
