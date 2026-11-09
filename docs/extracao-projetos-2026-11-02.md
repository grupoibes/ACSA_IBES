# Dados dos projetos da plataforma ACSA — formato da extração (02/11/2026)

A extração é feita fora do repositório (script no navegador, com o login do IBES). O sistema novo **não acessa** a plataforma da ACSA: só importa os arquivos gerados.

## Estrutura da pasta extraída
```
ACSA_extracao/
  resumo_extracao.json                      [{codigo, idpry, idauts, idevas, documentos, mb}]
  projetos/<AAAA-NNN>_idpry<n>/
    ficha_projeto.html, menu_projeto.html
    paginas/*.html                          configuração, fases, responsáveis, escopo, certificado,
                                            cronograma, históricos, autoavaliações e avaliações
    relatorios_e_certificados/<id>_<nome>   PDFs de relatórios de avaliação e certificados
    indice_documentos_idaut<N>.json         índice dos anexos de evidência (um por autoavaliação/acompanhamento)
    anexos/<id_fichero>_<nome>              arquivos de evidência (passo 3)
```

## Formato de `indice_documentos_idautN.json`
```json
{ "projeto": "2024/010", "idpry": 62, "idaut": "140", "extraido_em": "ISO-8601",
  "documentos": [ {
    "id_fichero": "1110112", "id_proyecto": "62",
    "fichero_nombre": "nome.pdf", "dec_tamano": "77971",
    "fec_upload": "06/09/2024 3:14:20", "usuario_nombre": "…",
    "listado_evpam": [ { "id_fichero": "1110112", "id_evidencia": "48147",
       "cod_estandar": "ES 2 10.15_00", "descripcion_evp": "texto da evidência",
       "descripcion_am": "texto da área de melhoria, se houver" } ] } ] }
```
- `dec_tamano` vem em bytes; 1.687 registros vêm com vírgula decimal (tratar como KB).
- O índice do acompanhamento é cumulativo (inclui os documentos da certificação): deduplicar por `id_fichero`.
- Um arquivo pode estar ligado a várias evidências e a áreas de melhoria (N:N).
- `fec_upload` em `dd/mm/aaaa h:mm:ss`, horário de Brasília.

## Volume
- 72 projetos (idpry 1 a 73; o idpry 2 não existe), 112.009 arquivos de evidência, cerca de 97 GB (o número de 46 GB citado no PROMPT v0.5 estava errado).
- Maioria imagens (png, jpg) e PDFs; também docx, pptx, xlsx, mp3.
- Maiores: 2019/008 (17,2 GB), 2025/006_R1 (7,3 GB), 2023/005 (4,8 GB), 2023/006 (4,6 GB).
- 2024/010 como referência: 3.896 arquivos, 1,63 GB, 461 evidências, 142 padrões.

## Lacunas conhecidas
- Páginas `evaluaciones.resultados` e `evaluadores.asignacion` não foram extraídas (a plataforma recusa a leitura por script).
- Certificados de projetos antigos podem vir como página "Não pode acessar o arquivo" (HTML de 214 bytes): tratar como ausente.
- Projeto 2025/007 está em candidatura e não tem índice.

## Nomes de arquivo e casamento na importação (atualizado 09/11/2026)
O arquivo salvo em `anexos/` nem sempre tem o nome original do índice. A extração aplicou estas regras:
- prefixo `<id_fichero>_` sempre presente: **case arquivo e registro por esse prefixo**;
- caracteres inválidos no Windows (`\ / : * ? " < > |` e controle) viram `_`; espaços repetidos viram um;
- nome cortado em 120 caracteres; pontos e espaços no fim removidos;
- extensões que o navegador bloqueia na gravação (`.url`, `.lnk`, `.local`, `.scf` e similares) ganharam `.txt` no fim (ex.: `... (link).url.txt`, atalho de internet com o link dentro).
Outros pontos:
- muitos anexos de 2017–2019 **não têm extensão** no nome: detectar o tipo pelo conteúdo;
- o mesmo arquivo aparece várias vezes com sufixos "(1)", "(2)": deduplicar por hash ao subir para o Storage;
- `_logs/erros.txt` lista os anexos que falharam (rede, sessão expirada, nome não permitido); depois da passada final, os que continuarem ausentes entram no relatório como `ausente`.
