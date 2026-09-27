# 02 · Evidência e roteiro para a voz

## 1. Dossiê com taxonomia (docs/DOSSIE.md)
| Status | Significa | Entra no vídeo? |
|---|---|---|
| **V** verificado | fonte primária indexada (PubMed, periódico, diretriz, órgão oficial) conferida com número exato | sim, com fonte visível |
| **I** indicativo | notícia, fonte secundária, dado que muda com o tempo | só datado e com cuidado ("status em set/2026"); nunca como número de impacto |
| **N** não verificado | "todo mundo diz" | não |

**Como verificar:** PubMed MCP (`search_articles` + `get_article_metadata`) devolve resumo, números e DOI; cite "segundo o PubMed" com o link do DOI. Notícias: WebSearch + WebFetch, e registre data e trecho.

**Conflito de fontes:** registre as duas, prefira a mais recente e mais específica, e escreva a frase do vídeo de forma que seja verdadeira nos dois cenários, com data. Caso real: "Anvisa aprova" (jan/2025) × "depende de registro" (2025–2026) → "Ainda sem registro na Anvisa · status em set/2026".

## 2. O olhar do especialista (onde vídeos bonitos erram)
Antes de escrever, pergunte: *um especialista da área corrigiria esta frase?*
- "Cicatriza no mesmo tempo" estava **errado**: a diferença de 0,5 dia teve p = 0,001 e os autores dizem que acelera. O certo é "só meio dia antes".
- O desfecho era "número de curativos", não "trocas".
- Estudo ambulatorial não autoriza CTA de cirurgia.
- Escopo: dizer sempre para quem vale ("2º grau superficial") e para quem não vale.

## 3. Escrever para a voz (roteiro/falas.py)
- Uma fala = uma ideia = 1–2 frases curtas. A pausa depois de cada fala é **desenhada**: 0,3 s entre ideias ligadas, 0,6–0,9 s antes e depois de uma revelação, 1,5–2,2 s no fim.
- Frases de peso ficam sozinhas e mais lentas ("É doer menos." com ritmo −12%).
- Conversa, não locução: "pra", "aí", "só que". Contrações humanizam a voz sintética.
- ~2,6 palavras/s é o ritmo natural didático: 175 palavras ≈ 67 s de fala.
- **Número falado × exibido:** `{4,9|quatro vírgula nove}`. A voz lê por extenso e a legenda mostra o número. Arredondar na fala é aceitável ("quarenta e dois por cento"); na tela, use o exato (−42,1%).

## 4. Texto de tela
- ≤7 palavras por bloco, ≥1,2 s por bloco, leitura ≈2,5 palavras/s.
- O texto de tela É a legenda. Cenas com tipografia própria (dados, tese, cartão) não recebem legenda por cima.
- Rótulos técnicos em mono: curtos, em CAIXA ALTA, um de cada vez.
- Fonte visível no quadro dos números (mono pequeno) + referência completa na legenda do post.

## 5. Tabela de cenas (docs/ROTEIRO.md)
Cada linha: tempo · cena · fala · visual/câmera · texto/rótulo · som · fonte (#dossiê). Toda afirmação aponta para uma linha do dossiê.

## 6. Legenda do post
Gancho (a pergunta + a lacuna) → contexto em 2–3 frases → os números em lista com comparador → a tese → aviso de limites e status datado → fontes completas (autor, periódico, ano, DOI) → CTA de compartilhamento → 5–6 hashtags. No máximo 2 emojis.
