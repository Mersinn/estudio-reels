# 09 · Armadilhas (cada uma já custou uma rodada)

## Ambiente e máquina (Windows + app Claude)
1. **Pasta virtualizada do app Claude.** Projetos dentro de `AppData\Roaming\Claude\scratch-workspaces` são redirecionados pelo Windows, e processos filhos (Chrome headless, ffmpeg do compositor) falham com `spawn ... ENOENT`, embora o arquivo exista. **Solução definitiva:** projeto numa pasta comum (Documentos). Paliativo automático: copiar Chrome e compositor para `~/.cache` (o `novo_projeto.py` faz isso) e o `remotion.config.ts` do template detecta e aponta para lá.
2. **Caminho longo.** Acima de ~180 caracteres, o `npm install` quebra (`WinError 267`). Use caminhos curtos.
3. **Primeiro carregamento lento** (fontes + texturas numa GPU integrada) estoura o `delayRender` de 30 s. O template usa 120 s.
4. **Heredoc no Git Bash come barras invertidas e aspas.** Para escrever código (regex, `\\`, aspas), use a ferramenta Write/Edit em vez de `cat <<EOF`. Depois de editar em lote com `str.replace`, confirme com `grep -c` que o padrão entrou (replace que não casa falha em silêncio).
5. **Python 3.14 sem scipy**: instale `pip install edge-tts numpy scipy pillow` antes. `edge-tts` roda como `python -m edge_tts` (o executável pode não estar no PATH).

## Remotion
6. **Quadro local × global.** `useCurrentFrame()` dentro de `<Sequence>` é local; tempo de palavra é global. Sintoma: rótulos e palavras que nunca aparecem. Use `useG()`.
7. **Medir texto antes das fontes carregarem** grava larguras erradas no cache. Envolva a composição em `FontGate`.
8. **`useFrame()` do R3F é proibido**: tudo vem do quadro.
9. **Vista de cima**: `lookAt` com `up` paralelo à direção de visão degenera. Passe `up` explícito.

## 3D
10. **Enrolamento invertido dos triângulos** → normais para dentro → vê-se a parede oposta por dentro ("ventre brilhando", "olho do outro lado"). Depure com cor = normal.
11. **Smoothstep entre pontos de perfil** cria platôs que ondulam a silhueta. Use Catmull-Rom.
12. **Costura** na primeira/última coluna de uma malha de revolução: tire a média das normais.
13. **Horizonte visível**: a cor do fundo perto do horizonte tem de ser a mesma da névoa.
14. **Fotorrealismo às pressas parece IA.** Posterizar na paleta da marca resolveu o peixe numa rodada.
15. **Close demais em textura 2.5D** mostra pixel borrado. Limite o enquadramento.
16. **Disco de luz enorme** (janela de Snell de 48°) não cabe num quadro vertical: para o match cut, use um disco de sol de ~10°.

## Tipografia e legenda
17. **Linha em caixa alta encavala na de cima** com entrelinha de minúscula: use altura de linha maior para caixa alta.
18. **Texto claro sobre fundo claro** (laboratório, sol) some: `tone: "dark"`.
19. **Palavra de fonte manuscrita com maiúscula ornamentada** fica ilegível ("Anvisa" em Great Vibes). Nomes próprios vão em itálico editorial.
20. **Figura entre as palavras cobrindo o meio da palavra de trás** ("cu tivo"): a figura só pode cobrir a base da palavra.
21. **Quebra de linha inesperada** numa frase de impacto: use `whiteSpace: "nowrap"` e um tamanho que caiba.

22b. **Palavra banal ou negativa em fonte manuscrita** ("lixo" em Great Vibes) fica bonita demais e perde o sentido. Manuscrita só para palavra nobre (curativo, cuidado); banal ou negativa vai em peso (`*`).
22c. **Cor hex em ShaderMaterial cru**: `new THREE.Color("#hex")` converte para linear; se o shader não converte de volta, a cor sai mais escura e saturada (o chão do rio virou uma faixa vermelha no horizonte). Em uniform de shader cru use `.convertLinearToSRGB()` ou valores `vec3` literais.
22d. **Gradação apagada** (bronze/laranja) faz o mundo parecer sujo. Compare 3 gradações lado a lado (`REMOTION_GRADE=...` + stills) antes de decidir; o objeto principal em tom frio contra a água quente salta.

## Roteiro e conteúdo
22. **Informativo sem história** foi rejeitado. Primeira entrega: jornada + virada + pedagogia na imagem.
23. **Frase "segura" que é imprecisa** ("cicatriza no mesmo tempo" quando a diferença foi significativa). Leia o resumo do artigo, não a notícia.
24. **CTA que contradiz o estudo** ("operar" num estudo ambulatorial).
25. **Fonte temporal sem data** (status regulatório). Sempre "status em mês/ano" e revalidar na publicação.

## Processo
26. **Não criar a pasta do projeto no início.** O projeto nasceu numa pasta temporária e foi preciso migrar. Crie a pasta definitiva na fase 0 (ex.: `Documentos\<MARCA>\<marca>-reels\AAAA-MM-tema`).
27. **Descrever em vez de mostrar.** O usuário quer ver: envie folha de contato, MP4 e capas a cada portão.
