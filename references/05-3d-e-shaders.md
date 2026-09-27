# 05 · 3D e shaders (receitas testadas)

Arquivos de referência em `assets/biblioteca/` (copie para `src/three/` do projeto e adapte).

## 1. Criatura procedural (Tilapia.tsx): como modelar qualquer bicho/objeto orgânico
1. **Perfis ao longo do corpo**: arrays de meia-altura dorsal, meia-altura ventral e meia-largura em pontos `u` (0 = ponta → 1 = cauda), medidos em fotos de referência.
2. **Interpolação Catmull-Rom** entre os pontos. Smoothstep por segmento cria "platôs" e ondula a silhueta.
3. **Seção transversal** em lente/superelipse: `z = w·sign(cos)·|cos|^0.62`.
4. **Enrolamento dos triângulos para fora**: `idx.push(a, a+1, b, b, a+1, b+1)`. Invertido, as normais apontam para dentro e você vê o interior da parede oposta (ventre "brilhando", olho do outro lado aparecendo). Depure renderizando `normal*0.5+0.5`.
5. **Costura**: a primeira e a última coluna são o mesmo ponto; tire a média das normais.
6. **Nadadeiras/apêndices**: faixas (base → ponta) com shader de raios e alfa; olhos como esferas com íris por uv.
7. **Movimento**: onda lateral no vertex shader, função de `(x, uTime)`, com amplitude crescendo para a cauda. Corrija a normal pela derivada do deslocamento.
8. **Sombreamento**: tom = luz de hemisfério + difusa + reflexo do ambiente + desenho do corpo (dorso escuro, ventre claro, faixas, escamas), depois `poster(tom)`. Acentos: película perolada na borda e cintilação rara por escama.

## 2. Relevo 2.5D (ImageRelief + prep_depth.py)
- Profundidade = silhueta "inflada" (distância até a borda, raiz quadrada) + volumes elípticos (cabeça, tórax…) + 12% da luminância da arte, tudo suavizado. Metade da resolução basta.
- Malha 220 × (220·aspecto), deslocada no vertex shader; normal pela derivada da textura de profundidade (luz "morde" a forma sem mudar a arte).
- `discard` onde alfa < 0,5; degradê na base para esconder o recorte.
- Close-up amplia pixels da textura: não aproxime além de ~⅓ da largura da figura.
- **Verbos em shader** (VenusRelief do lacp-reels): máscaras em coordenadas uv com borda de ruído fbm, um uniform por estado (`burn`, `cream`, `heal`…), cicatrização por "borda que avança" + "ilhas" de Voronoi.

## 3. Tecido que cai, adere e enrola (SkinSheet.tsx): sem simulação
- Grade 72×72; cada vértice pousa no relevo (amostra a textura de profundidade no vertex shader).
- **Queda** analítica: atraso por distância ao centro, easing cúbico, onda senoidal enquanto está no ar.
- **Enrolar** analítico: linha de descolamento avança na diagonal; o trecho já passado gira em cilindro (`along = Lp − r·sin θ`, `z += r·(1 − cos θ)`).
- Tudo função pura de `(drape, adhere, peel, time)`: idêntico em render paralelo. Pré-simular em JSON só se a física for complexa demais para uma fórmula.

## 4. Água, luz e atmosfera (River.tsx)
- Céu/fundo em esfera `BackSide` com gradiente por `dir.y` (a cor do horizonte deve casar com a da névoa, senão aparece uma linha).
- **Disco de sol** visto de dentro d'água (`smoothstep(cos(r+ε), cos(r), dot)`): é o círculo do match cut.
- Raios de luz: planos aditivos com ruído animado por `uTime`, `depthWrite:false`.
- Cáusticas no leito: bordas de Voronoi com coordenadas deformadas por fbm, duas camadas.
- Partículas em suspensão: `Points` com posições de PRNG com semente (`mulberry32`), deriva senoidal no shader.
- Névoa exponencial própria nos shaders (`fogApply`) e `fogExp2` para materiais padrão.

## 5. Cenas de estúdio
- **Vista de cima** (LabDish.tsx): câmera em `[0,h,0]` com `up=[sin(rot),0,−cos(rot)]`; líquido e objeto como planos com shader.
- **Palco com foco** (Stage.tsx): fundo com poça de luz (corrija o aspecto do plano no cálculo do raio) e foco circular com lentes emissivas.

## 6. Rótulos presos ao 3D
`project(cam, ponto3D)` devolve pixels com a mesma câmera do `CameraRig` → `MonoLabel point={...}`.

## 7. Desempenho (GPU integrada, 8 GB)
Styleframe em 0,4× leva 1–4 s por quadro; preview em 0,5× leva ~3–5 min para 74 s; o final em 1× leva cerca de 3–4 vezes mais. Mantenha malhas ≤ 300 mil vértices, poucos materiais transparentes sobrepostos e sem pós-processamento em tela cheia (faça a posterização no shader de cada objeto).
