# Mapeamento ACSA

Este arquivo registra o que o projeto usa do modelo ACSA e as respostas do IBES de 26/10/2026. A seção 5F é a fonte dessas respostas. A conciliação com o esquema está em [conciliacao.md](conciliacao.md).

## 1. Dois manuais, dois papéis

| Manual | Papel neste projeto |
| --- | --- |
| ME 2 1_05 | Referência de estrutura do mapeamento. A contagem citada é 144 padrões. Explica blocos, grupos e a forma do modelo. Não entra em total, mínimo nem catálogo operacional. |
| ME 5 1_07 | Manual operacional das Unidades de Gestão Clínica. `calcularNivel` só aceita este código. A contagem é o número de linhas carregadas em `padroes`, menos os não aplicáveis do projeto. |

O banco guarda o 144 em `referencias_estrutura`. A tabela `manuais` recusa o código ME 2 1_05. A amostra carregada hoje tem 12 padrões e `catalogo_oficial = false`: serve para exercitar a regra, não substitui o catálogo do ME 5 1_07.

## 2. Grupos

- Grupo I: direitos, ética e segurança. Parte dele é obrigatória para qualquer nível.
- Grupo II: desenvolvimento da organização. Parte pode ser imprescindível para Ótima e Excelente.
- Grupo III: inovação e resultado para fora da unidade. Entra em Excelente. Fica fora da manutenção.

Os limiares gravados para o ME 5 1_07 são os do programa de Unidades de Gestão Clínica anterior à edição ME 5 1_08, que passou o Grupo III de 70% para 40%:

| Nível | Grupo I | Grupo II | Grupo III |
| --- | --- | --- | --- |
| Avançada | ≥ 70%, com 100% dos obrigatórios aplicáveis | — | — |
| Ótima | 100% | ≥ 40%, com 100% dos imprescindíveis aplicáveis | — |
| Excelente | 100% | 100% | ≥ 70% |

O percentual mora em `manuais`. A quantidade de padrões não mora no percentual.

## 5F. Respostas do IBES em 26/10/2026

### 5F.1 Padrões não aplicáveis

Ficam na tabela `padroes_nao_aplicaveis`, por projeto, com origem `diagnostico`. Perfis da instituição não os veem: a policy não devolve a linha e a tela não lista o padrão. Eles saem do total e do mínimo em `calcularNivel`. O resultado de conformidade `Ausente` deixa de existir. Não aplicável não é um terceiro resultado de cumprimento.

### 5F.2 Diagnóstico

Um registro por projeto, com avaliador, data e anexo do relatório. Digitalizar o diagnóstico, padrão a padrão, é v2 e não tem tabela nesta versão.

### 5F.3 Reavaliação

`avaliacoes.rodada` vai de 1 a n no mesmo projeto. A evidência da rodada anterior permanece. A conformidade é da rodada; a rodada nova não apaga o que já foi anexado.

### 5F.4 Estados recusado e abandonado

Somente `admin_ibes` e `responsavel_ibes` fazem essa passagem. O trigger grava a transição em `historico_estados`. Sem o perfil certo, a alteração não acontece.

### 5F.5 Resolução do comitê

Registro manual: órgão `ACSA` ou `IBES`, data, resultado, pontuação, nível concedido e documento. Não há credencial, fila nem acesso externo para a ACSA. O nível concedido não é preenchido pelo cálculo.

### 5F.6 Ciclos

O tipo da avaliação é `certificacao`, `manutencao` ou `recertificacao`. Manutenção avalia somente os Grupos I e II que continuam aplicáveis. Com o Grupo III fora do escopo, o cálculo não concede Excelente nessa rodada.

### 5F.7 Contagens

Usar o ME 5 1_07. Os números do mapeamento (ME 2 1_05, 144 padrões) são referência de estrutura.

## O que esta seção não fecha

Os itens 21 a 28 de [respostas-ibes.md](respostas-ibes.md) continuam `PENDENTE IBES`. Nenhuma implementação abaixo escolhe resposta para eles.
