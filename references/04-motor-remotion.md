# 04 · O motor (assets/template)

## Estrutura de um projeto
```
roteiro/falas.py        FALAS: texto, pausas, cena, voz, ritmo  → gera o tempo do vídeo
roteiro/trilha.py       PARTITURA de efeitos sonoros presos a palavras/cortes
docs/                   BRIEFING, DOSSIE, ROTEIRO, QA (preencher antes de produzir)
src/brand/brand.ts      MARCA: paleta por função, papéis tipográficos, fontes, selo, logo, área segura
src/engine/             MOTOR (não editar sem motivo): timeline, ui, Captions
src/three/              3D compartilhado: glsl (ruído/voronoi), CameraRig, project, poster, ImageRelief
src/projeto/            O VÍDEO: cenas.ts (janelas), legendas.ts (decupagem), Reel.tsx, Capa.tsx, cenas/*.tsx
src/data/vo.json        gerado: falas + tempo de cada palavra
public/                 fontes, imagens, vo/, audio/
scripts/                tts, align_recording, audio_mix + sfx_lib, prep_depth, stills, sheet, make_srt, render_final
```

## O relógio
`src/engine/timeline.ts` lê `vo.json` e oferece:
- `wf(fala, i)`: quadro da i-ésima palavra · `wfind(fala, "trecho")`: quadro da palavra que contém o trecho
- `ls/le(fala)`: início/fim da fala · `cut(a, b)`: meio do silêncio entre duas falas (ponto de corte ideal)
- `TOTAL`: duração em quadros

`src/projeto/cenas.ts` define as janelas: `SC = { abertura: [0, cut("gancho","origem")], ... }`. Nenhum número mágico de quadro; tudo derivado das falas.

## Cenas e tempo global (o bug que custou uma rodada)
Dentro de uma `<Sequence>` o `useCurrentFrame()` é **local**, mas os tempos de palavra são **globais**. Por isso:
- monte cenas com `<Scene from to pre post fadeIn>{() => <MinhaCena/>}</Scene>`
- dentro da cena, use **`useG()`** (quadro absoluto) para comparar com `wfind(...)`
- componentes do motor (`MonoLabel`, `PaperCard`, `At`, `DataCounter`, `SceneTag`, `Captions`) já usam `useG()`

## Transições no código
- sobreposição: `pre` (a cena entra antes, por cima) e `post` (a anterior continua por baixo)
- dissolve de forma: `fadeIn={8}` na cena que entra + `post={8}` na que sai
- papel que sobe: a cena calcula `translateY` a partir de `from - 10`
- slide de saída: a cena calcula `translateY` negativo nos últimos 12 quadros

## Componentes do motor (src/engine/ui.tsx)
`FontGate` (espera as fontes; sem isso a medição de texto erra) · `Scene` · `useG` · `prog(g, from, dur)` · `At` (palavra em corte seco no quadro f) · `DataCounter` · `MonoLabel` (com linha-guia até um ponto; use `project()` para ancorar no 3D) · `PaperCard` · `SealCorner` · `SceneTag` · `Grain` (trocado a cada 2 quadros e borrado, para não explodir o bitrate) · `Vignette` · `BgGradient` · `SafeZoneGuide` · estilos `heavy/italic/script/monoStyle`.

## 3D dentro do Remotion (regras da @remotion/three)
- sempre `<ThreeCanvas width height>`; `layout="none"` em Sequence dentro do canvas
- **proibido `useFrame()`**: toda animação vem do quadro (`const t = useG()/FPS`) e atualiza uniforms no corpo do componente
- câmera por `<CameraRig pos target fov roll up>` (vista de cima exige `up`, senão o lookAt degenera)
- texturas por `useLoader(THREE.TextureLoader, staticFile(...))` (o ThreeCanvas segura o render até carregar)
- materiais em `useMemo`; uniforms atualizados a cada render (determinístico)

## Props da composição
`Reel` recebe `{ guides, audio: "vo" | "mix" | "none", mixFile }`. Preview com vozes soltas: `audio:"vo"`. Final: `render_final.py` renderiza mudo e monta com o mix normalizado.

## Capas
`Capa.tsx` gera `CapaReel` (1080×1920) e `CapaGrid` (1080×1350) com o mesmo padrão do título da série e o visual-assinatura (pode ter ThreeCanvas).

## Configuração da máquina (remotion.config.ts)
`angle` (GPU via Direct3D), concorrência 2 (~8 GB de RAM), timeout de 120 s (1º carregamento lento), e detecção de pasta virtualizada do app Claude (usa Chrome/ffmpeg de `~/.cache`). Ver `09-armadilhas.md`.
