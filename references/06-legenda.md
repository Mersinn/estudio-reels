# 06 · Legenda em pilha tipográfica

## O que é
Legenda queimada que funciona como tipografia de motion: blocos curtos, **uma palavra-chave gigante** por bloco, entrelinha colada, cada palavra entrando no quadro exato em que é dita. Inspirada nas referências do usuário (pilha com contraste de tamanho; sujeito entre as palavras) e no padrão medido do motion-vox (corte seco; a fluidez vem do ritmo, não do easing).

## Decupagem (src/projeto/legendas.ts)
```ts
hook:  { spec: "^um ^peixe / #pode #tratar / ~queimaduras?", pos: "top" },
rio:   { spec: "essa história / começa no / *rio, || com uma *pele / que quase sempre / ia pro ~lixo." },
lab:   { spec: "no *laboratório, || ...", tone: "dark" },   // fundo claro → tinta escura
```
`||` separa blocos · ` / ` separa linhas · prefixos: `*` chave · `~` manuscrita · `_` itálico editorial · `^` espaçada · `#` pesada em caixa alta. As palavras têm de bater, na ordem, com a fala (o motor avisa se sobrar ou faltar).

## Regras de decupagem (o que decidir palavra por palavra)
1. **A chave é o substantivo ou verbo que carrega o sentido** (rio, pele, laboratório, dói, gruda). Nunca artigo ou conjunção.
2. **Manuscrita = emoção ou desfecho**, no máximo uma por fala (lixo, colágeno, fica, rio).
3. **Itálico = nuance ou qualificador** (superficial, mais rápido, nordestina).
4. **Bloco curto**: 2–3 linhas, ≤7 palavras. A palavra-chave sozinha num bloco é o soco ("*dói.").
5. **Bloco nunca atravessa fala.** Pontuação forte fecha bloco.
6. **Não legende o que a cena já escreve**: tese, prancha de dados, cartão, fecho. Duas tipografias no mesmo quadro brigam.
7. **Tom**: `dark` sobre fundos claros (laboratório, sol, papel); `light` no resto. Confira na folha de contato.
8. **Posição**: `low` (padrão, centro em ~1230 px), `top` (título do gancho), `center` (frase-assinatura sobre um objeto central).

## Parâmetros do motor (src/engine/Captions.tsx)
Corpo 92 px · chave 182 px · manuscrita 170 px · itálico 112 px · espaçada 50 px · pesada 150 px. Cada linha encolhe sozinha se passar da largura segura. Entrelinha 0,86 (caixa alta 1,12). "Pop" de 3 quadros (nasce 6% maior). Sombra de tinta suave; em tom escuro, halo claro.

## Palavras em cenas tipográficas
Use `<At f={wf("fala", i)}>palavra</At>` para a palavra aparecer no tempo dela dentro de layouts livres (tese, fecho). A figura entre as palavras (fecho): palavra de trás → imagem da figura (máscara na base) → palavras da frente.

## SRT
`scripts/make_srt.py` gera `out/entrega/legendas.srt` a partir do mesmo `vo.json` (blocos de até ~38 caracteres, sem atravessar falas), para acessibilidade e para a legenda automática do app.
