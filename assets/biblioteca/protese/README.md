# Biblioteca "prótese" (reel "Prótese de silicone explode no avião?", LACP-PB, set/2026)

Peças reaproveitáveis do reel da prótese. Copie para `src/projeto/` do projeto novo; os imports relativos
(`../brand/brand`, `../three/...`, `../engine/...`, `./kit`) já batem com o motor. O caso completo, com o que funcionou e o
que foi corrigido, está em `lacp-reels/references/caso-protese.md`.

| Arquivo | O que é | Depende de |
|---|---|---|
| `Aviao3D.tsx` | avião comercial 3D procedural (fuselagem por revolução, asas enflechadas, motores, deriva, janelas e faixa pintadas numa textura). Nariz em +X, topo em +Y. Nenhum arquivo externo. | three |
| `Saco3D.tsx` | saco de salgadinho 3D que incha (`inf` 0→1), treme no limite e EXPLODE (`estouro` = quadros desde a explosão): a frente rasga em duas, sopro de ar, salgadinhos voam, pedaços caem. Rótulo desenhado em canvas. | three |
| `Implante3D.tsx` | implante mamário 3D liso e translúcido (silicone), corte mostrando o gel coesivo, cápsula de colágeno que cresce/engrossa/aperta (contratura), o espaço implante–cápsula que acende (`espaco`) e bolhas de gás. | `three/glsl` (NOISE), `three/poster` |
| `TomadaRelief.tsx` | uma IMAGEM (ex.: personagem gerada no ChatGPT) vira relevo 2.5D pelo mapa de profundidade: câmera em paralaxe de verdade, cor quente da liga e uma luz coral localizada (celular no rosto). Tabela `TAM` com o tamanho de cada imagem. | `brand/brand` (W, H), `three/CameraRig`; imagens de `scripts/ampliar.py` + `scripts/profundidade.py` |
| `VenusImplante.tsx` | a Vênus da LACP "com silicone" (pacote de marca da lacp-reels): implante em raio X, caneta cirúrgica, lente que trava e empurra até o alvo (`push` 0→1). | `sistema-venus/VenusRelief` da lacp-reels, `kit` (lerp) |
| `LegendaViva.tsx` | a legenda da série (mesma da sutura) com duas novidades: `!` no começo de um bloco inverte o tom só nele (a cena troca de fundo no meio da fala) e `~` junta palavras exibidas como uma só ("1.600~m"). A cópia em `../suturas/` foi atualizada igual. | `engine/timeline`, `engine/ui`, `brand/brand`, `kit` (P, pp, twos) |
| `Fio.tsx` | o número que rola e costura os mundos (altitude → profundidade → escala), como a régua do tempo do reel da história. | `kit` |
| `SAbertura_exemplo.tsx` | exemplo completo de abertura: o avião passa no pôr do sol, a câmera acelera até a janela e corta no pico, a personagem digita a pergunta numa barra de busca que é a própria legenda, a palavra-chave estoura, a luz coral vira o disco da cena seguinte. | tudo acima |

## Receitas que funcionaram
- **Personagem por imagens de IA:** folha de tomadas (mesma personagem, várias poses) → recorte dos painéis → `ampliar.py` (4×) → `profundidade.py` → `TomadaRelief`. Confira defeitos da geração em cada tomada (no caso, uma poltrona virada), e troque a tomada em vez de "consertar".
- **Objeto na mão da personagem:** o objeto 3D por cima da tomada e, por cima dele, o recorte da MÃO da mesma imagem (máscara de cor de pele numa caixa, borda suavizada). Use a tomada 2D (sem relevo) nesse plano, para o recorte bater pixel a pixel.
- **Estouro com som:** o estouro gravado (três camadas: saco, papel, balão) cai no quadro da explosão; se houver palavra-chave ("explode"), o som cai NA palavra dita.
