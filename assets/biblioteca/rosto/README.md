# Biblioteca "rosto" (reel "Dá pra operar um rosto que não existe?", LACP-PB, set/2026)

Peças do formato **luta transmitida** (arena × mesa do comentarista × tela). Copie para `src/projeto/` (e `comum.tsx`
para `src/projeto/cenas/`); os imports relativos batem com o motor. Caso completo: `lacp-reels/references/caso-rosto.md`.

| Arquivo | O que é | Depende de |
|---|---|---|
| `RostoFx.tsx` | o rosto de uma arte (recorte ampliado 4×) com **liquify em shader** (lábio mais curto, nariz fino sem a sombra da cartilagem, olhos maiores, sobrancelha que sobe mais na cauda, pele de app, luz de tela, onda de soco, impressão P&B). `fonte()`/`destino()` repetem o liquify em TS para rótulos e malha caírem certo; `Vista` + `naTela()` mapeiam px da arte → tela (câmera quase ortográfica). | three, `malha.json` (pontos da face) |
| `Malha.tsx` | `Malha`: a malha de rastreio facial do filtro (Delaunay, ciano, acompanha o liquify, racha e cai em pedaços com `racha`). `Marcas`: a caneta dermográfica no rosto verdadeiro (bullhorn do lip lift, dorso do nariz, prega da pálpebra, linha média), desenhada em progresso. | `RostoFx`, `kit` |
| `Luva3D.tsx` | luva de boxe procedural por **metaballs** (MarchingCubes: punho, rolo dos nós, palma) + polegar em tubo + manguito com faixas; verniz azul e borda fresnel ciano. | three (examples/jsm) |
| `Arena.tsx` | arena 2D em camadas: cones de holofote com poeira, ringue em perspectiva com cordas coral, postes azul/coral, plateia em meio-tom que pula (`agito`) e flashes de celular. | `kit` |
| `SRound_exemplo.tsx` | a máquina de round: gongo e etiqueta, a luva **acelera e o corte cai no pico**, deformação com mola, anel do impacto, tremida com semente; depois o **replay**: congela, vira P&B e recua até virar foto na mesa (recuo até a moldura), com a telestração da médica e as provas reais. Contém `Caneta` (traço à mão em progresso). | tudo acima, `Diagramas`, `Medica` |
| `Diagramas.tsx` | `NarizPerfil` (perfil com osso, cartilagem e envelope de pele; o esqueleto baixa, abre o espaço morto, a cicatriz preenche, nasce o bico) e `OlhoFecha` (pálpebra que fecha × lagoftalmo). | `kit` |
| `BlocoFace.tsx` + `SCamadas_exemplo.tsx` | **o bloco da bochecha**: um pedaço da arte sai do rosto como bloco de mármore (CSS 3D), gira e mostra no corte as camadas da face reveladas palavra a palavra (pele, gordura, SMAS, ligamentos como colunas até a derme, osso) e o nervo facial em ouro logo abaixo do SMAS; volta e se encaixa. | `RostoFx`, `kit` |
| `Medica.tsx` | personagem gerada fora (ChatGPT), recortada e estilizada, **animada**: o corpo respira e oscila; no selo de comentarista, UMA cabeça com a boca desenhada abrindo pela força real da voz e piscada. | `data/boca.json`, `data/medica_tam.json` |
| `comum.tsx` | `wn()` (palavra EXATA, com ocorrência — o `wfind` casa por substring), a pilha do título que volta no fim, o celular com a selfie filtrada. | `engine/timeline` |
| `LegendaViva.tsx` | a legenda da série com `quem` (etiqueta "PACIENTE ▸" do molde da sutura). As cópias de `../suturas` e `../protese` foram atualizadas. | `engine/timeline`, `kit` |
| `scripts/recortar_medica.py` | folha de personagem → tomadas: amplia 4× (Real-ESRGAN), tira o fundo por IA (rembg isnet, `pip install rembg[cpu]`), fica com o maior pedaço, troca uma cor de roupa. | `scripts/ampliar.py` |
| `scripts/estilizar_medica.py` | o meio-termo aprovado entre personagem de IA e o molde da sutura: `edgePreservingFilter` + bilateral (achata o render sem manchar), luz em faixas suaves, sombras aquecidas, luz de borda. | opencv |
| `scripts/boca.py` | envelope de energia das falas de um personagem → `src/data/boca.json` (0..1 por quadro no tempo do vídeo). | ffmpeg |
| `scripts/gerar_imagem.py` | gera imagem pela API (Gemini imagem → OpenAI). Em set/2026 a chave grátis do Gemini não gerava imagem (429) e a da OpenAI expirou. | — |

## Receitas que funcionaram (e o que não funcionou)
- **Deformar a própria arte** em shader (liquify) é o que faz o "filtro" parecer filtro. Para o close não borrar, amplie o recorte do rosto 4× antes.
- **Personagem que fala:** nunca alterne cabeças de tomadas diferentes (o Emerson chamou de "robô"). Uma cabeça só, boca desenhada por cima pelo envelope da voz, piscada a cada ~3 s, balanço pequeno.
- **Estilo de personagem de IA:** "gravura da Vênus" (paleta da estátua) deixou a pele acinzentada; "colagem impressa" foi recusada. O que passou: meio-termo com o molde Kurzgesagt da sutura, sem descaracterizar o desenho.
- **Camadas em CSS 3D:** retalhos que dobram como páginas viraram discos chapados. O bloco (caixa com topo = arte e frente = corte) lê de primeira.
- **Luva:** esfera deformada ficou "balão"; metaballs + polegar separado + manguito curto leem como luva de boxe. Tamanho no impacto: pequeno, os nós tocando o alvo, nunca cobrindo o rosto.
