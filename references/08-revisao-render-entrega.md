# 08 · Revisão, render e entrega

## 1. O ciclo de revisão (o que mais economizou tempo)
Nunca renderize o vídeo inteiro para ver se algo ficou bom. Faça assim:
1. `node scripts/stills.mjs out/rev 0.4 <10–15 quadros-chave>`: um quadro por beat, em 1–4 s cada, com uma sessão de navegador só.
2. `python scripts/sheet.py out/rev out/rev.png 5`: folha de contato.
3. Olhe a folha como diretor: o que lê sem som? há texto encavalado? legenda sumindo em fundo claro? elemento fora da área segura? cena parecendo template?
4. Corrija o **módulo** e rode de novo só os quadros afetados.
5. Envie a folha ao usuário (`SendUserFile`, display "render") como styleframes.

Quadros-chave = meio de cada fala importante, logo depois de cada corte, e o pico de cada número.

## 2. Preview completo
Com a folha aprovada: `npx remotion render Reel out/preview.mp4 --scale=0.5 --props='{"audio":"mix"}'`, que leva ~3–5 min para 70 s numa GPU integrada. Envie o MP4 ao usuário para revisar ritmo e cenas. É aqui que se ajustam pausas (em `falas.py`) e tempos de animação.

## 3. Final
`python scripts/render_final.py` faz:
- vídeo 1080×1920, H.264 high, yuv420p, CRF 16, 30 fps (mudo)
- montagem com o mix normalizado (−14 LUFS / −1 dBTP), AAC 256k, faststart → `reel_final.mp4` (+ `reel_final_trilha.mp4`)
- `capa_reel.png` (1080×1920) + `capa_grid.png` (1080×1350)
- `legendas.srt`

Custo real medido (i5-13420H, Intel UHD, 7,7 GB): preview de 74 s em 0,5× levou ~3 min; o final em 1× leva cerca de 3–4 vezes mais. Informe o tempo ao usuário.

## 4. Pacote de entrega (out/entrega/)
| Arquivo | Conteúdo |
|---|---|
| `reel_final.mp4` | com efeitos, sem música |
| `reel_final_trilha.mp4` | com trilha ambiente própria |
| `capa_reel.png` · `capa_grid.png` | capas |
| `legendas.srt` | legenda para acessibilidade |
| `legenda_post.txt` | texto do post com fontes e DOIs |
| `CREDITOS.md` | voz, trilha, fontes tipográficas, imagens, software, artigos, status regulatório datado |
| `GRAVACAO.md` | roteiro de gravação para a voz humana (quando a voz for sintética) |

## 5. QA antes de mostrar a versão final
Preencha `docs/QA.md`. Teste de determinismo: renderize o mesmo quadro duas vezes e compare `md5sum`. Red team de 1 rodada; depois disso, corrija só o que falhou. Não entre em loop de "melhorias" sem pedido.
