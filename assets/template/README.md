# __NOME_PROJETO__

Reels feito com o **estudio-reels** (Remotion + Three.js). A narração é o relógio do vídeo.

| Etapa | Comando |
|---|---|
| Voz (grátis) | `python scripts/tts.py` (edite antes `roteiro/falas.py`) |
| Voz humana | `python scripts/align_recording.py gravacao.m4a` |
| Preview no navegador | `npm run dev` |
| Quadros de revisão | `node scripts/stills.mjs out/rev 0.4 30 120 300` e `python scripts/sheet.py out/rev out/rev.png 5` |
| Som | `python scripts/audio_mix.py` (partitura em `roteiro/trilha.py`) |
| Entrega completa | `python scripts/render_final.py` → `out/entrega/` |

Onde mexer: `roteiro/` (falas e som) · `src/projeto/` (cenas, legenda, capa) · `src/brand/` (marca) · `docs/` (briefing, dossiê, roteiro, QA).
Não mexer sem motivo: `src/engine/` e `src/three/` (motor compartilhado).
