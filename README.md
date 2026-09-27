# estudio-reels

Estúdio para produzir Reels, Shorts e TikToks verticais (9:16) com o Claude Code: roteiro com história, evidência, motion design, 3D (Three.js), legenda em pilha tipográfica, voz, som e render final com Remotion.

É uma **skill do Claude Code**. Serve para qualquer marca ou tema; a identidade de cada cliente vem num "pacote de marca" separado (ex.: o da LACP-PB mora no repositório `lacp-pb`).

## Instalar num computador
```bash
git clone https://github.com/Mersinn/estudio-reels ~/.claude/skills/estudio-reels
```
Requisitos: Node 20+, Python 3.11+ (`pip install edge-tts numpy scipy pillow faster-whisper`), ffmpeg.

## Usar
Abra o Claude Code e peça: "quero um reel sobre <tema>". O Claude segue o método do `SKILL.md`.
Criar projeto manualmente: `python ~/.claude/skills/estudio-reels/scripts/novo_projeto.py <pasta>`.

## Conteúdo
- `SKILL.md`: o método em fases com portões
- `references/`: história e retenção, evidência, direção de arte, motor, 3D, legenda, voz e som, render, armadilhas
- `assets/template/`: projeto Remotion pronto (motor, legenda, cenas de exemplo, scripts de voz, som, render, modo filmagem)
- `assets/biblioteca/`: cenas 3D reaproveitáveis (tilápia, rio, laboratório, lâmina, palco, corte filmado)
- `scripts/novo_projeto.py`: cria um projeto novo a partir do template
