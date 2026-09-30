// O implante mamário em 3D (Three.js), no idioma da marca: casca de silicone translúcida com a luz
// posterizada em tons de pêssego/creme (gravura), gel coesivo visível no corte, e a cápsula de colágeno
// (fibras em terra/coral) em volta, com espessura e aperto controláveis (contratura capsular).
// Tudo é função pura dos props (quadro a quadro), então o render paralelo do Remotion é idêntico.
//
// Geometria: implante redondo de perfil moderado (diâmetro 2, projeção ~0,62), feito por revolução
// (LatheGeometry) em torno do eixo Y; o grupo é girado para a cúpula olhar para a câmera (+Z).
import React, { useMemo } from "react";
import * as THREE from "three";
import { NOISE } from "../three/glsl";
import { POSTER_GLSL, palette } from "../three/poster";

export type ImplanteFx = {
  time: number; // segundos (para o gel "respirar" e as fibras correrem)
  corte?: number; // 0 = inteiro · 1 = metade da frente removida (mostra o gel)
  capsula?: number; // 0 = sem cápsula · 1 = cápsula normal formada
  grossa?: number; // 0 = cápsula fina · 1 = cápsula grossa (contratura)
  aperto?: number; // 0 = implante macio · 1 = apertado (Baker IV: mais redondo e menor)
  bolhas?: number; // 0..1 gás entre o implante e a cápsula
  espaco?: number; // 0..1 o espaço entre implante e cápsula acende em dourado ("guarda esse espaço")
  balanco?: number; // 0..1 amplitude do "jiggle" macio
  cor?: number; // 0 = implante em tons de gravura · 1 = mais translúcido/brilhante
};

const R = 1; // raio da base
const HPROJ = 0.62; // projeção

/** perfil do implante (meia seção), de baixo-centro → borda → topo-centro */
function perfil(n = 64, r = R, h = HPROJ): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  // base levemente côncava (encosta no músculo)
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(t * r * 0.9, 0.02 * (1 - t * t)));
  }
  // borda arredondada (quarto de círculo pequeno) + cúpula (superelipse)
  const rb = 0.1;
  for (let i = 1; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r * 0.9 + rb * Math.cos(a), rb + rb * Math.sin(a)));
  }
  for (let i = 1; i <= n; i++) {
    const t = i / n; // 0 borda → 1 topo
    const a = t * Math.PI * 0.5;
    const x = (r * 0.9 + rb) * Math.cos(a) ** 0.8;
    const y = rb + (h - rb) * Math.sin(a) ** 0.7;
    pts.push(new THREE.Vector2(Math.max(0.0001, x), y));
  }
  pts.push(new THREE.Vector2(0.0001, h));
  return pts;
}

const vert = /* glsl */ `
uniform float uAperto, uBalanco, uTime, uInfla;
varying vec3 vN; varying vec3 vP; varying vec3 vW; varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  // aperto (contratura): a cápsula encolhe a base e empurra o implante para uma forma mais esférica
  float r = length(p.xz);
  p.xz *= 1.0 - 0.22 * uAperto;
  p.y *= 1.0 + 0.55 * uAperto * (1.0 - 0.3 * r);
  // "infla": para a cápsula ficar um pouco maior que o implante
  p += normal * uInfla;
  // balanço macio (gel coesivo): onda lenta
  p.y += uBalanco * 0.035 * sin(uTime * 5.0 + r * 3.0) * r;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vW = w.xyz; vP = p;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const fragImplante = /* glsl */ `
${NOISE}
${POSTER_GLSL}
uniform float uCorte, uCor, uTime;
uniform vec3 uLuz;
varying vec3 vN; varying vec3 vP; varying vec3 vW; varying vec2 vUv;
void main(){
  // corte: remove a metade da frente (z local > 0 depois da rotação = x do lathe aqui)
  if(uCorte > 0.001 && vP.x > (1.0 - 2.0 * uCorte) * 1.05) discard;
  vec3 N = normalize(vN);
  if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float ndl = max(dot(N, normalize(uLuz)), 0.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
  // silicone liso e translúcido (o v1 posterizado lia como "ovo"): luz envolvente, núcleo quente,
  // reflexo de uma janela (softbox), brilho especular fino e borda clara de fresnel
  vec3 L = normalize(uLuz);
  float wrap = clamp((dot(N, L) + 0.45) / 1.45, 0.0, 1.0);
  vec3 col = mix(vec3(0.8, 0.5, 0.4), vec3(0.99, 0.89, 0.81), smoothstep(0.05, 1.0, wrap));
  col = mix(col, vec3(1.0, 0.76, 0.62), 0.22 * (1.0 - fres));
  vec3 Rv = reflect(-V, N);
  float box = smoothstep(0.5, 0.66, Rv.y) * smoothstep(0.55, 0.3, abs(Rv.x + 0.25));
  col += vec3(1.0, 0.97, 0.93) * box * 0.42;
  vec3 H = normalize(L + V);
  col += vec3(1.0) * pow(max(dot(N, H), 0.0), 140.0) * 0.9;
  col = mix(col, vec3(1.0, 0.95, 0.9), fres * 0.5 * (0.6 + 0.4 * uCor));
  col += vec3(0.95, 0.5, 0.35) * pow(fres, 3.0) * 0.25; // contraluz coral
  col *= 1.0 - 0.22 * smoothstep(0.86, 0.99, fres);
  col *= 0.985 + 0.03 * fbm(vP.xz * 4.0 + uTime * 0.05);
  if(!gl_FrontFacing) col = mix(vec3(0.86, 0.62, 0.42), vec3(0.97, 0.84, 0.66), 0.3 + 0.5 * ndl); // o gel visto por dentro
  gl_FragColor = vec4(col, 1.0);
}`;

// tampa do corte: o gel coesivo (mantém a forma), com microbolhas presas desde a fabricação
const fragTampa = /* glsl */ `
${NOISE}
uniform float uTime, uBolhas;
varying vec2 vUv;
void main(){
  vec2 p = vUv;
  vec3 gel = mix(vec3(0.97, 0.86, 0.72), vec3(1.0, 0.95, 0.86), smoothstep(0.0, 0.6, p.y));
  gel *= 0.94 + 0.08 * fbm(p * 7.0);
  // microbolhas (poucas, pequenas)
  vec2 cell = floor(p * vec2(9.0, 5.0)); vec2 f = fract(p * vec2(9.0, 5.0));
  vec2 o = hash22(cell) * 0.6 + 0.2;
  float d = length(f - o);
  float b = smoothstep(0.06, 0.04, d) * step(0.62, hash21(cell + 3.1));
  gel = mix(gel, vec3(1.0), b * 0.8);
  gl_FragColor = vec4(gel, 1.0);
}`;

const fragCapsula = /* glsl */ `
${NOISE}
uniform float uCapsula, uGrossa, uTime, uCorte;
uniform vec3 uLuz;
varying vec3 vN; varying vec3 vP; varying vec3 vW; varying vec2 vUv;
void main(){
  if(uCorte > 0.001 && vP.x > (1.0 - 2.0 * uCorte) * 1.05) discard;
  vec3 N = normalize(vN); if(!gl_FrontFacing) N = -N;
  // fibras de colágeno: faixas que dão a volta (ao longo de vUv.x) com ondulação
  float fib = sin(vUv.y * (140.0 + 90.0 * uGrossa) + fbm(vUv * vec2(40.0, 6.0)) * 6.0);
  float fibras = smoothstep(0.2, 0.9, fib);
  // a cápsula "cresce": aparece por manchas que se unem (fbm < limiar)
  float cresce = fbm(vUv * vec2(18.0, 7.0) + 2.0);
  if(cresce > uCapsula * 1.15) discard;
  float ndl = max(dot(N, normalize(uLuz)), 0.0);
  vec3 fino = mix(vec3(0.93, 0.62, 0.5), vec3(0.98, 0.8, 0.7), fibras);
  vec3 grosso = mix(vec3(0.62, 0.26, 0.16), vec3(0.8, 0.4, 0.27), fibras);
  vec3 col = mix(fino, grosso, uGrossa) * (0.65 + 0.45 * ndl);
  float a = mix(0.42, 0.9, uGrossa) * (0.55 + 0.45 * fibras);
  gl_FragColor = vec4(col, a);
}`;

// o espaço peri-implantar: casca fina dourada que brilha na silhueta (fresnel)
const fragEspaco = /* glsl */ `
uniform float uEsp, uTime;
varying vec3 vN; varying vec3 vW;
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - abs(dot(normalize(vN), V)), 1.4);
  float pulso = 0.85 + 0.15 * sin(uTime * 4.0);
  gl_FragColor = vec4(vec3(1.0, 0.84, 0.45) * pulso, uEsp * (0.18 + 0.82 * fres));
}`;

const fragBolha = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - max(dot(normalize(vN), V), 0.0), 1.6);
  gl_FragColor = vec4(mix(vec3(0.95, 0.98, 1.0), vec3(1.0), fres), 0.35 + 0.6 * fres);
}`;
const vertSimples = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main(){ vN = normalize(normalMatrix * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const vertUv = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// bolhas fixas (posições no espaço local do implante, na interface implante/cápsula)
const BOLHAS: [number, number, number, number][] = [
  [0.55, 0.52, 0.2, 0.07], [0.72, 0.34, -0.25, 0.05], [0.3, 0.64, 0.35, 0.045], [0.84, 0.18, 0.1, 0.06], [0.42, 0.6, -0.4, 0.04], [0.62, 0.46, 0.5, 0.05],
];

export const Implante3D: React.FC<{ fx: ImplanteFx; pos?: [number, number, number]; rot?: [number, number, number]; escala?: number }> = ({
  fx,
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  escala = 1,
}) => {
  const { time, corte = 0, capsula = 0, grossa = 0, aperto = 0, bolhas = 0, balanco = 0.4, cor = 0.6 } = fx;
  const geo = useMemo(() => new THREE.LatheGeometry(perfil(), 96), []);
  const matImpl = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAperto: { value: 0 }, uBalanco: { value: 0 }, uTime: { value: 0 }, uInfla: { value: 0 }, uCorte: { value: 0 }, uCor: { value: 0 },
          uLuz: { value: new THREE.Vector3(-0.4, 0.8, 0.7) },
          uPal: palette(["#D29A80", "#E9C3AE", "#F5DDCF", "#FCEFE6", "#FFFBF7"]),
        },
        vertexShader: vert, fragmentShader: fragImplante, side: THREE.DoubleSide,
      }),
    [],
  );
  const matCaps = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAperto: { value: 0 }, uBalanco: { value: 0 }, uTime: { value: 0 }, uInfla: { value: 0.06 }, uCapsula: { value: 0 }, uGrossa: { value: 0 }, uCorte: { value: 0 },
          uLuz: { value: new THREE.Vector3(-0.4, 0.8, 0.7) },
        },
        vertexShader: vert, fragmentShader: fragCapsula, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      }),
    [],
  );
  const matTampa = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uBolhas: { value: 0 } }, vertexShader: vertUv, fragmentShader: fragTampa, side: THREE.DoubleSide }), []);
  const matBolha = useMemo(() => new THREE.ShaderMaterial({ vertexShader: vertSimples, fragmentShader: fragBolha, transparent: true, depthWrite: false }), []);
  const matEsp = useMemo(
    () => new THREE.ShaderMaterial({ uniforms: { uEsp: { value: 0 }, uTime: { value: 0 } }, vertexShader: vertSimples, fragmentShader: fragEspaco, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    [],
  );
  matEsp.uniforms.uEsp.value = fx.espaco ?? 0;
  matEsp.uniforms.uTime.value = time;

  for (const m of [matImpl, matCaps]) {
    m.uniforms.uAperto.value = aperto;
    m.uniforms.uBalanco.value = balanco;
    m.uniforms.uTime.value = time;
    m.uniforms.uCorte.value = corte;
  }
  matImpl.uniforms.uCor.value = cor;
  matCaps.uniforms.uCapsula.value = capsula;
  matCaps.uniforms.uGrossa.value = grossa;
  matCaps.uniforms.uInfla.value = 0.05 + 0.1 * grossa;
  matTampa.uniforms.uTime.value = time;

  // tampa do corte: seção plana no plano x = xc do lathe (antes da rotação), com o contorno do perfil
  const tampa = useMemo(() => {
    const pf = perfil(48);
    const shape = new THREE.Shape();
    // meia-seção espelhada: contorno completo em (z, y)
    const full = [...pf.map((p) => new THREE.Vector2(p.x, p.y)), ...pf.slice().reverse().map((p) => new THREE.Vector2(-p.x, p.y))];
    shape.moveTo(full[0].x, full[0].y);
    full.forEach((p) => shape.lineTo(p.x, p.y));
    return new THREE.ShapeGeometry(shape, 24);
  }, []);
  const xc = (1 - 2 * corte) * 1.05;
  const larguraTampa = Math.sqrt(Math.max(0, 1 - Math.min(1, Math.abs(xc)) ** 2)); // largura da seção nesse x (aprox. círculo)

  return (
    <group position={pos} rotation={rot} scale={escala}>
      {/* a cúpula olha para +Z (a câmera) */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={geo} material={matImpl} />
        {corte > 0.02 && corte < 0.98 && (
          <mesh geometry={tampa} material={matTampa} position={[Math.min(xc, 0.999), 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[larguraTampa, 1 - 0.2 * (1 - larguraTampa), 1]} />
        )}
        {(fx.espaco ?? 0) > 0.001 && <mesh geometry={geo} material={matEsp} renderOrder={3} scale={[1.03 * (1 - 0.22 * aperto), 1.05, 1.03 * (1 - 0.22 * aperto)]} />}
        {capsula > 0.001 && <mesh geometry={geo} material={matCaps} renderOrder={2} />}
        {bolhas > 0.001 &&
          BOLHAS.map(([x, y, z, r], i) => {
            const k = Math.max(0, Math.min(1, bolhas * 1.6 - i * 0.12));
            const ang = Math.atan2(z, x);
            const rr = Math.hypot(x, z);
            return (
              <mesh key={i} material={matBolha} position={[rr * Math.cos(ang) * (1 - 0.22 * aperto), y, rr * Math.sin(ang) * (1 - 0.22 * aperto)]} scale={r * k}>
                <sphereGeometry args={[1, 20, 14]} />
              </mesh>
            );
          })}
      </group>
    </group>
  );
};
