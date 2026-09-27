# 03 · Direção de arte

## 1. Um motivo visual que amarra o vídeo inteiro
Escolha uma forma ou gesto que se repete e se transforma. No Reels da tilápia foi o **círculo**: o sol visto de dentro do rio → a cuba do laboratório vista de cima → o foco cirúrgico → o anel da logo no fecho. Cada transição de ato vira um *match cut* (mesma forma, mesma posição, dissolve de 8 quadros), e a logo "fecha" a história.
Como achar: qual forma existe no começo (natureza), no meio (processo) e no fim (marca)? Círculo, linha/fio, camada, rachadura, onda.

## 2. O verbo (personagem + ação)
Quando a marca tem um personagem (a Vênus da LACP), cada tema é **um verbo aplicado a ele**: impressa, costurada, vestida, cicatrizando, mapeada. O verbo explica o mecanismo sem texto e dá começo, meio e fim animáveis. Dignidade sempre: lesão vira fissura, luz, cor ou textura, nunca pele real nem gore.

## 3. Identidade > fotorrealismo
3D fotorrealista feito às pressas parece IA genérica. O que funcionou:
- **Gravura posterizada**: a luz de objetos 3D é quantizada em 5 tons da paleta, com borda orgânica (ruído), a mesma linguagem de uma logo posterizada (`src/three/poster.ts`). O peixe deixou de ser "3D de banco" e virou parte do mundo da marca.
- **Contraste de linguagens**: sujeito posterizado sobre atmosfera pintada e suave (névoa, raios de luz). Dá profundidade e leitura de animação autoral.
- **Imagens da marca em relevo 2.5D** (`ImageRelief`): a arte original ganha volume por mapa de profundidade. Fidelidade de 100%; a câmera gira até ~12° sem quebrar. O usuário preferiu isso a escanear um modelo 3D.

### Quando usar cada técnica
| Situação | Técnica |
|---|---|
| Personagem ou logo da marca | 2.5D (`ImageRelief` + `prep_depth.py`) |
| Objeto que precisa girar 360° ou se mover no espaço (animal, instrumento) | 3D procedural posterizado |
| Ambiente (água, sala, luz) | shaders de atmosfera (névoa, raios, cáusticas) |
| Número, comparação, prova | 2D editorial (papel, tipografia, barras, ícones com fração honesta) |
| Tese, frase de impacto | tipografia pura em fundo da marca, sem nada competindo |

## 4. Registros visuais: alterne, não repita
Cenas vizinhas não podem ter o mesmo registro. Revezamos: 3D subaquático → laboratório vista de cima (claro) → palco escuro com foco → prancha de papel creme → tipografia sobre coral → cartão de papel → volta ao rio → fecho tipográfico com a figura entre as palavras.

## 5. Transições com significado (nunca de template)
| Transição | Quando | Como |
|---|---|---|
| **Match cut / dissolve de forma** | mudança de lugar mantendo a ideia | mesma forma centralizada nos dois planos, dissolve de 8 quadros |
| **Folha de papel (wipe material)** | entrar em dado/prova | a prancha sobe por baixo em 12 quadros com aceleração |
| **Corte seco** | a batida da tese | sem transição; o silêncio e o grave fazem o trabalho |
| **Slide** | sair de tipografia para cena | o fundo sobe e revela a cena anterior continuando |
| **Push** | fechar uma ideia | a câmera acelera para dentro e o corte cai na velocidade |
Proibidos: flash branco, whip pan, glitch, zoom com blur sem motivo, "transição de template".

## 6. Câmera
Movimento motivado: dolly na origem, push-in no problema, órbita lenta na virada, câmera baixa no herói. Tranco de câmera só quando a história pede (o pulso de dor), curto e decaindo. Nunca câmera nervosa sem motivo.

## 7. Elementos por quadro
No máximo 3–4 elementos: sujeito + legenda + 1 rótulo técnico + selo. Rótulo sai quando o próximo entra. O selo da marca fica fixo no mesmo canto o vídeo inteiro.

## 8. Tipografia (sistema da pilha)
Três vozes: **pesada** (Montserrat 900: impacto, legenda), **editorial** (Playfair itálico: nuance), **manuscrita** (Great Vibes: 1–3 palavras emocionais, girada −6°). Padrão de título: "espaçada / PESADA / *manuscrita girada*". Referências que o usuário mandou: pilha com contraste de tamanho e o sujeito **entre** as palavras (umas atrás, outras na frente da figura), o que usamos no fecho.

## 9. Legibilidade
Texto claro em fundo claro some. Cena clara (laboratório, sol) pede legenda em tinta escura (`tone: "dark"`). Use o `SafeZoneGuide` (`props {"guides":true}`) para conferir a área segura.
