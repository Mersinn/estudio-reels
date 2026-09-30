---
name: estudio-reels
description: Estúdio completo para produzir Reels, Shorts e TikToks verticais (9:16) de alto nível do zero, com narração (voz sintética grátis ou humana), motion design, 3D (Three.js), legenda queimada em pilha tipográfica, desenho de som e render final, usando Remotion. Traz o método em fases com portões, um motor pronto (template que já renderiza) e uma biblioteca de cenas 3D. Use SEMPRE que o pedido for criar um vídeo animado, explicativo, educativo, de divulgação científica, de marca ou de história para Instagram/TikTok/YouTube Shorts; "fazer um reels", "vídeo com motion", "animação em Remotion", "vídeo com 3D", "roteiro + vídeo", "narração com legenda", ou quando quiser reaproveitar a estrutura de um vídeo anterior, mesmo que o usuário não cite Remotion. Não use para cortar vídeo bruto existente (isso é corte-viral) nem para pôr motion sobre filmagem de pessoa falando (motion-vox).
---

# Estúdio de Reels

Um sistema para fabricar vídeos verticais com **ideia + autoridade + clareza + retenção + identidade + qualidade visual**, sem recomeçar do zero. Ele nasceu da produção do Reels "Um peixe pode tratar queimaduras?" (LACP-PB, set/2026) e guarda tudo o que funcionou e tudo o que deu errado.

## Como o sistema é organizado

| Camada | Onde fica | O que é |
|---|---|---|
| **Método** | este `SKILL.md` + `references/` | as fases, os portões, a psicologia do feed, a direção de arte, as armadilhas |
| **Motor** | `assets/template/` | projeto Remotion + Three.js que já renderiza: relógio pela narração, legenda em pilha, componentes, voz, som, revisão, render |
| **Biblioteca** | `assets/biblioteca/` | cenas 3D prontas para adaptar: criatura procedural (peixe), ambiente subaquático, laboratório (cuba), palco com foco cirúrgico, lâmina de tecido que cai e enrola; `suturas/` (pele em corte, cartas, personagens, LegendaViva); `protese/` (avião 3D, saco que explode, implante 3D, personagem de IA em 2.5D, README com receitas) |
| **Pacote de marca** | outra skill (ex.: `lacp-reels`) | cores, fontes, imagens, componentes próprios e decisões da marca, aplicados por cima do motor |
| **Projeto** | uma pasta por vídeo | roteiro, cenas, áudio e entrega daquele vídeo |

Uma marca nova não exige mexer no motor, só no `src/brand/brand.ts` e nas imagens. Um tema novo não exige mexer na marca, só no roteiro e nas cenas.

## Começar um projeto

```bash
python ~/.claude/skills/estudio-reels/scripts/novo_projeto.py <pasta-do-projeto> [--marca <pacote-de-marca>]
```
Isso copia o motor, aplica a marca, instala dependências e o Chrome de render, e gera a voz da demonstração. O projeto já nasce renderizando: substitua a demonstração pelo seu conteúdo. Pré-requisitos: Node 18+, Python 3 com `edge-tts numpy scipy pillow`, ffmpeg no PATH.

## O pipeline (cada fase termina num portão)

Mostre sempre **o resultado** (arquivo, quadro, vídeo), nunca uma descrição. Use `SendUserFile` a cada portão.

| # | Fase | Entrega | Ferramentas | Leia | Portão |
|---|---|---|---|---|---|
| 0 | Ativação | checagem real do ambiente (Node, Python, GPU, RAM, pacote de marca) + tese em 5 linhas + ≤3 perguntas | Bash/PowerShell | — | usuário vê o plano |
| 1 | Evidência | `docs/DOSSIE.md` com taxonomia V/I/N | PubMed MCP, WebSearch/WebFetch, paper-lookup | `02` | todo número tem fonte; dado temporal revalidado |
| 2 | História e roteiro | `docs/ROTEIRO.md` + `roteiro/falas.py` | — | `01`, `02` | tese clara, lacuna aberta cedo, ≤7 palavras por tela |
| 3 | Voz | `src/data/vo.json` + `public/vo/` | `scripts/tts.py` (provisória) · `scripts/vo_nova_voz.py` (ElevenLabs no ritmo natural) + `scripts/conferir_voz.py` · `scripts/align_recording.py` (humana) | `07` | duração-alvo; toda fala conferida palavra por palavra |
| 4 | Direção de arte | 3–5 styleframes numa folha de contato | stills.mjs + sheet.py | `03`, `05` | a estética tem identidade e não parece IA genérica |
| 5 | Cenas | `src/projeto/` (cenas, legendas, capa) | Remotion, Three.js | `04`, `05`, `06` | folha de contato de todos os atos aprovada |
| 6 | Som | `roteiro/trilha.py` + mixagem | `scripts/audio_mix.py` | `07` | cada efeito cai no corte/palavra |
| 7 | Preview → final | preview em meia resolução → correções → `out/entrega/` | render, `scripts/render_final.py` | `08`, `09` | checklist `docs/QA.md` + red team |
| 8 | Registro | decisões e créditos; o que funcionou volta para o pacote de marca | — | — | a próxima produção começa mais adiante |

Se o usuário autorizar ir até o fim ("pode fazer e finalizar"), passe pelos portões sem parar, mas continue **mostrando** o resultado de cada um enquanto avança.

## Princípios (e por quê)

1. **A narração é o relógio.** Todo corte, legenda, rótulo e efeito se prende a uma palavra (`wfind("fala","palavra")`). Trocar a voz, humana ou sintética, re-temporiza o vídeo inteiro de graça. Tempo "no olho" quebra na primeira revisão.
2. **Determinismo.** O Remotion renderiza quadros fora de ordem e em paralelo. Tudo que se mexe tem de ser função pura do número do quadro. Nada de `Math.random()` sem semente, estado acumulado ou `useFrame()`. Sem isso o vídeo pisca e muda a cada render.
3. **Mostrar a prova, apontar o detalhe, concluir.** Um número vira uma imagem que prova (duas barras quase iguais dizem "só meio dia" melhor que o texto). Movimento acompanha o raciocínio; nada se mexe "para dar dinâmica".
4. **Uma ideia por beat, um beat novo a cada 5–10 s.** Retenção vem de progressão informacional, não de corte a cada meio segundo.
5. **História > informativo.** O usuário rejeitou o primeiro roteiro por ser "informativo sem falar nada". Conte uma jornada com começo, virada e fim. Ensine dentro da história (o mecanismo aparece na imagem).
6. **Identidade > "3D bonito".** 3D fotorrealista genérico parece IA. Leve o mundo inteiro para a linguagem da marca (ex.: gravura posterizada igual à logo). Para imagens da marca, o relevo 2.5D preserva 100% a arte original.
7. **Evidência vence estética.** Se um desejo visual contradisser um dado, o dado vence. Avise e proponha uma alternativa visual.
8. **Não degradar em silêncio.** Se algo técnico travar (licença, desempenho, render), pare e ofereça duas alternativas.
9. **Corrigir o módulo, não refazer tudo.** A folha de contato mostra o problema; corrija aquele componente.

## Comunicação com o usuário
Muitos usuários não programam. Explique decisões em linguagem de produto ("isso deixa o render 3× mais rápido", "assim o vídeo se reajusta sozinho à sua voz"), nunca como revisão de código. Envie arquivos, não caminhos. Diga o tempo real de render. Seja direto sobre o que não ficou bom.

## Mapa das referências
- `references/01-historia-e-retencao.md`: tese, virada, estruturas de roteiro, psicologia do feed, relógio comportamental. Leia na fase 2.
- `references/02-evidencia-e-roteiro.md`: dossiê V/I/N, escrever para a voz, números falado × exibido. Fases 1–2.
- `references/03-direcao-de-arte.md`: motivo visual, verbo, posterização, 2.5D × 3D, transições com significado. Fase 4.
- `references/04-motor-remotion.md`: arquitetura do template, `Scene`/`useG`, janelas de cena, capas, props. Fase 5.
- `references/05-3d-e-shaders.md`: modelagem procedural, relevo 2.5D, tecido analítico, água, câmera. Fases 4–5.
- `references/06-legenda.md`: legenda em pilha (sintaxe, regras medidas, tom claro/escuro). Fase 5.
- `references/07-voz-e-som.md`: vozes grátis, gravação humana, efeitos sintetizados, mixagem e loudness. Fases 3 e 6.
- `references/08-revisao-render-entrega.md`: folha de contato, preview, render final, entregáveis, custo de render. Fase 7.
- `references/09-armadilhas.md`: todos os erros que já custaram tempo, com a correção. **Leia antes da fase 5.**

## Skills vizinhas
`remotion-best-practices` (API do Remotion) · `corte-viral` (psicologia do feed, cortes de vídeo bruto) · `motion-vox` (motion sobre filmagem, padrão de legenda medido) · `paper-lookup` / PubMed MCP (evidência) · pacote de marca da vez (ex.: `lacp-reels`).

## Modo filmagem
Com vídeo de gente falando já cortado (corte-viral): `python scripts/filmagem_para_vo.py corte.mp4` transforma a fala real no relógio (`vo.json`) e gera um rascunho de legendas; `assets/biblioteca/CorteFilmado.tsx` põe o vídeo como fundo (Reel com `audio="none"`). Legenda, rótulos, SFX e cenas de motion se prendem às palavras como num reel narrado.
