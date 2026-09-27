// Tilápia-do-nilo (Oreochromis niloticus) procedural.
// Corpo alto e comprimido, dorso arqueado, nadadeira dorsal longa (espinhosa na frente,
// mole atrás), cauda truncada com listras verticais, faixas verticais tênues no flanco,
// mancha opercular. Nada é baixado: a malha nasce aqui, então não há licença a verificar.
import React, { useMemo } from "react";
import * as THREE from "three";
import { NOISE, SWIM } from "./glsl";
import { GRADE } from "./grade";

// perfis ao longo do corpo (u: 0 focinho → 1 pedúnculo), medidos em fotos de referência
const U = [0, 0.04, 0.12, 0.25, 0.4, 0.55, 0.7, 0.84, 0.94, 1.0];
const HT = [0.02, 0.1, 0.24, 0.4, 0.46, 0.43, 0.33, 0.2, 0.14, 0.13]; // meia-altura dorsal
const HB = [0.02, 0.08, 0.2, 0.32, 0.36, 0.33, 0.25, 0.16, 0.12, 0.12]; // meia-altura ventral
const WD = [0.01, 0.07, 0.14, 0.18, 0.18, 0.15, 0.11, 0.07, 0.05, 0.045]; // meia-largura
const X0 = 1.0,
  X1 = -0.78; // focinho → pedúnculo

// Catmull-Rom: curva contínua que passa pelos pontos, sem os "platôs" que ondulavam o perfil
const interp = (arr: number[], u: number) => {
  const n = U.length;
  let i = 0;
  while (i < n - 2 && u > U[i + 1]) i++;
  const t = Math.min(1, Math.max(0, (u - U[i]) / (U[i + 1] - U[i])));
  const p0 = arr[Math.max(0, i - 1)],
    p1 = arr[i],
    p2 = arr[i + 1],
    p3 = arr[Math.min(n - 1, i + 2)];
  const t2 = t * t,
    t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
export const bodyTop = (u: number) => interp(HT, u);
export const bodyBot = (u: number) => -interp(HB, u);
const uToX = (u: number) => X0 + (X1 - X0) * u;

function bodyGeometry() {
  const NU = 90,
    NV = 56;
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  for (let i = 0; i <= NU; i++) {
    const u = i / NU;
    // focinho arredondado: concentra anéis perto da ponta
    const ue = u < 0.06 ? 0.06 * Math.sin((u / 0.06) * Math.PI * 0.5) : u;
    const x = uToX(ue);
    const ht = interp(HT, ue),
      hb = interp(HB, ue),
      w = interp(WD, ue);
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      const th = v * Math.PI * 2;
      const s = Math.sin(th),
        c = Math.cos(th);
      const y = s >= 0 ? ht * s : hb * s;
      // seção em lente: mais fina no dorso e no ventre
      const z = w * Math.sign(c) * Math.pow(Math.abs(c), 0.62) * (1 - 0.1 * Math.abs(s));
      pos.push(x, y, z);
      uv.push(ue, v);
    }
  }
  for (let i = 0; i < NU; i++)
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j,
        b = a + NV + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1); // normais para fora
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // a primeira e a última coluna são o mesmo ponto: une as normais para não marcar costura
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i <= NU; i++) {
    const a0 = i * (NV + 1),
      a1 = a0 + NV;
    const nx = nrm.getX(a0) + nrm.getX(a1),
      ny = nrm.getY(a0) + nrm.getY(a1),
      nz = nrm.getZ(a0) + nrm.getZ(a1);
    const l = Math.hypot(nx, ny, nz) || 1;
    nrm.setXYZ(a0, nx / l, ny / l, nz / l);
    nrm.setXYZ(a1, nx / l, ny / l, nz / l);
  }
  return g;
}

/** faixa de nadadeira: base (bx,by) → ponta, u da faixa em x, v da base (0) à borda (1) */
function finStrip(base: [number, number][], tip: [number, number][], z = 0) {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  const N = base.length;
  const R = 6;
  for (let i = 0; i < N; i++)
    for (let r = 0; r <= R; r++) {
      const t = r / R;
      pos.push(base[i][0] + (tip[i][0] - base[i][0]) * t, base[i][1] + (tip[i][1] - base[i][1]) * t, z);
      uv.push(i / (N - 1), t);
    }
  for (let i = 0; i < N - 1; i++)
    for (let r = 0; r < R; r++) {
      const a = i * (R + 1) + r,
        b = a + R + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function fins() {
  const S = 40;
  // dorsal: espinhosa (0.26–0.62) mais baixa, mole (0.62–0.9) alta e apontada para trás
  const dB: [number, number][] = [],
    dT: [number, number][] = [];
  for (let i = 0; i < S; i++) {
    const u = 0.26 + (0.9 - 0.26) * (i / (S - 1));
    const x = uToX(u),
      y = interp(HT, u) - 0.015;
    const soft = Math.max(0, (u - 0.6) / 0.3);
    const h = 0.15 + 0.03 * Math.sin(i * 1.7) * (1 - soft) + 0.16 * Math.sin(Math.min(1, soft * 1.25) * Math.PI * 0.8);
    dB.push([x, y]);
    dT.push([x - 0.1 - 0.22 * soft, y + h]);
  }
  // anal
  const aB: [number, number][] = [],
    aT: [number, number][] = [];
  for (let i = 0; i < 24; i++) {
    const u = 0.62 + 0.28 * (i / 23);
    const x = uToX(u),
      y = -interp(HB, u) + 0.015;
    const soft = (u - 0.62) / 0.28;
    aB.push([x, y]);
    aT.push([x - 0.12 - 0.14 * soft, y - (0.12 + 0.12 * Math.sin(soft * Math.PI * 0.85))]);
  }
  // caudal: truncada, levemente arredondada
  const cB: [number, number][] = [],
    cT: [number, number][] = [];
  for (let i = 0; i < 30; i++) {
    const t = i / 29,
      a = (t - 0.5) * 2;
    cB.push([X1 + 0.03, a * 0.12]);
    cT.push([X1 - 0.46 + 0.05 * a * a, a * 0.38]);
  }
  return {
    dorsal: finStrip(dB, dT),
    anal: finStrip(aB, aT),
    caudal: finStrip(cB, cT),
  };
}

function ovalFin(len: number, wid: number) {
  const g = new THREE.PlaneGeometry(len, wid, 12, 6);
  g.translate(-len / 2, 0, 0); // pivô na base
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i);
    const t = -x / len; // 0 base → 1 ponta
    p.setY(i, y * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95)) * (1 - 0.3 * t));
  }
  g.computeVertexNormals();
  return g;
}

const LIGHT = /* glsl */ `
uniform vec3 uSun;       // direção da luz (mundo)
uniform vec3 uSunCol;
uniform vec3 uAmb;
uniform vec3 uFogCol;
uniform float uFogDen;
vec3 fogApply(vec3 col, float dist){ float f = 1.0 - exp(-pow(uFogDen * dist, 1.6)); return mix(col, uFogCol, clamp(f, 0.0, 1.0)); }
`;

const bodyVert = /* glsl */ `
${SWIM}
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vObj;
void main(){
  vUv = uv; vObj = position;
  vec3 p = swim(position);
  // normal corrigida pela derivada do deslocamento lateral
  float e = 0.01;
  float dz = (swim(position + vec3(e,0,0)).z - swim(position - vec3(e,0,0)).z) / (2.0 * e) ;
  vec3 n = normal; n.x -= dz * n.z;
  vN = normalize(mat3(modelMatrix) * n);
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const bodyFrag = /* glsl */ `
${NOISE}
${LIGHT}
uniform float uTime; uniform float uGlint; uniform vec3 uPal[5];
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vObj;
// Posterização no idioma da logo: a luz vira 5 tons, com borda orgânica (manchas),
// como a Vênus da LACP. O peixe pertence ao mesmo mundo gráfico da marca.
vec3 poster(float x, vec2 p){
  x += (fbm(p * 9.0) - 0.5) * 0.16;              // manchas orgânicas nas bordas dos tons
  float t = clamp(x, 0.0, 0.999) * 5.0;
  float i = floor(t); float f = fract(t);
  float k = smoothstep(0.93, 1.0, f);             // borda quase dura, sem serrilhado
  int a = int(i); int b = min(a + 1, 4);
  vec3 ca = uPal[0], cb = uPal[0];
  for(int j = 0; j < 5; j++){ if(j == a) ca = uPal[j]; if(j == b) cb = uPal[j]; }
  return mix(ca, cb, k);
}
void main(){
  float u = vUv.x; float v = vUv.y;
  float side = sin(v * 6.2831);          // +1 dorso, −1 ventre
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 L = normalize(uSun);
  // valor tonal: luz de cima + reflexo prateado + desenho do corpo
  float hemi = 0.5 + 0.5 * N.y;
  float ndl = max(dot(N, L), 0.0);
  vec3 R = reflect(-V, N);
  float env = smoothstep(-0.45, 0.6, R.y + 0.5 * N.y);
  float tone = 0.26 + 0.34 * hemi + 0.26 * ndl + 0.22 * env;
  // desenho: dorso escuro, ventre claro, faixas verticais, escamas, opérculo
  tone -= 0.26 * smoothstep(0.2, 0.95, side);
  tone += 0.3 * smoothstep(-0.1, -0.85, side);
  float bars = smoothstep(0.55, 1.0, sin(u * 40.0 + 0.8)) * smoothstep(-0.5, 0.5, side) * smoothstep(0.1, 0.3, u);
  tone -= 0.06 * bars;
  vec2 sc = vec2(u * 58.0, v * 74.0);
  sc.y += floor(sc.x) * 0.5;
  vec2 cell = fract(sc) - vec2(0.0, 0.5);
  float d = length(cell * vec2(0.9, 1.15));
  float edge = smoothstep(0.46, 0.56, d) * smoothstep(0.75, 0.56, d);
  float scaleMask = smoothstep(0.12, 0.2, u);
  tone -= 0.05 * edge * scaleMask;
  float op = abs(u - (0.2 + 0.05 * side * side));
  tone -= 0.25 * smoothstep(0.014, 0.0, op) * smoothstep(-0.8, 0.6, side + 0.4);
  tone -= 0.16 * smoothstep(0.03, 0.0, length(vec2((u - 0.215) * 1.6, side - 0.55) * vec2(1.0, 0.25)));
  tone -= 0.35 * smoothstep(0.01, 0.0, abs(side + 0.05)) * smoothstep(0.06, 0.0, u);
  vec3 col = poster(tone, vUv * vec2(3.0, 1.2) + 0.3);
  // acentos: película perolada na borda (pêssego) e cintilação rara de escamas
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += vec3(1.0, 0.72, 0.58) * fres * 0.35 * smoothstep(-0.3, 0.6, side + 0.3);
  float rnd = hash21(floor(sc));
  vec3 H = normalize(L + V);
  vec3 Ns = normalize(N + 0.4 * (vec3(hash21(floor(sc) + 3.1), hash21(floor(sc) + 7.7), hash21(floor(sc) + 1.3)) - 0.5));
  float sp = pow(max(dot(Ns, H), 0.0), 70.0) * scaleMask * step(0.86, rnd) * (1.0 - smoothstep(0.15, 0.42, d));
  col += vec3(1.0, 0.94, 0.84) * sp * 1.4 * uGlint;
  gl_FragColor = vec4(fogApply(col, length(cameraPosition - vW)), 1.0);
}`;

const finVert = /* glsl */ `
${SWIM}
uniform float uFlap;
varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){
  vUv = uv;
  vec3 p = position;
  p.z += uFlap * sin(6.2831 * uTime * 1.3 + uv.x * 3.0) * uv.y * 0.04;
  p = swim(p);
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const finFrag = /* glsl */ `
${NOISE}
${LIGHT}
uniform float uRays; uniform float uStripes; uniform vec3 uTint; uniform float uOpacity;
varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){
  float rays = smoothstep(0.35, 0.0, abs(fract(vUv.x * uRays) - 0.5));
  float stripes = uStripes > 0.0 ? smoothstep(0.3, 0.9, sin(vUv.y * uStripes + vUv.x * 2.0)) : 0.0;
  vec3 col = uTint * (0.75 + 0.35 * rays) * (1.0 - 0.3 * stripes);
  float edgeFade = smoothstep(1.0, 0.82, vUv.y + 0.08 * vnoise(vUv * vec2(30.0, 4.0)));
  float a = uOpacity * (0.45 + 0.4 * rays) * edgeFade;
  vec3 N = normalize(vN);
  vec3 L = normalize(uSun);
  float back = pow(max(dot(-N, L), max(dot(N, L), 0.0)), 1.0);
  col *= uAmb + uSunCol * (0.4 + 0.6 * back);
  gl_FragColor = vec4(fogApply(col, length(cameraPosition - vW)), a);
}`;

const eyeFrag = /* glsl */ `
${LIGHT}
varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  // uv (0.5,0.5) aponta para fora; r = 1 a 90° do centro da íris
  float r = length((vUv - 0.5) * vec2(2.0, 1.0)) * 2.0;
  vec3 iris = mix(vec3(0.85, 0.62, 0.26), vec3(0.42, 0.18, 0.08), smoothstep(0.3, 0.8, r));
  vec3 col = r < 0.36 ? vec3(0.015) : iris;
  float spec = pow(max(dot(reflect(-normalize(uSun), N), V), 0.0), 80.0);
  col += spec * 1.2;
  gl_FragColor = vec4(fogApply(col, length(cameraPosition - vW)), 1.0);
}`;
const eyeVert = /* glsl */ `
${SWIM}
varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){ vUv = uv; vec3 p = swim(position); vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

export type Env = {
  sun: THREE.Vector3;
  sunCol: THREE.Color;
  amb: THREE.Color;
  fogCol: THREE.Color;
  fogDen: number;
};

export const Tilapia: React.FC<{
  time: number;
  env: Env;
  swim?: number;
  freq?: number;
  glint?: number;
  position?: [number, number, number];
  rotation?: THREE.EulerTuple;
  scale?: number;
}> = ({ time, env, swim = 1, freq = 1.6, glint = 1, position, rotation, scale = 1 }) => {
  const geo = useMemo(() => ({ body: bodyGeometry(), fins: fins(), pec: ovalFin(0.34, 0.16), pel: ovalFin(0.22, 0.07) }), []);
  const common = useMemo(
    () => ({
      uTime: { value: 0 },
      uSwim: { value: 1 },
      uFreq: { value: 1.6 },
      uSun: { value: new THREE.Vector3() },
      uSunCol: { value: new THREE.Color() },
      uAmb: { value: new THREE.Color() },
      uFogCol: { value: new THREE.Color() },
      uFogDen: { value: 0.1 },
    }),
    [],
  );
  const mats = useMemo(() => {
    const body = new THREE.ShaderMaterial({
      uniforms: {
        ...common,
        uGlint: { value: 1 },
        // paleta prata-quente em 5 tons (sombra → realce), vizinha dos tons da Vênus
        uPal: { value: GRADE.fish.map((c) => new THREE.Color(c)) },
      },
      vertexShader: bodyVert,
      fragmentShader: bodyFrag,
    });
    const fin = (tint: THREE.Color, rays: number, stripes: number, opacity: number, flap = 0) =>
      new THREE.ShaderMaterial({
        uniforms: {
          ...common,
          uTint: { value: tint },
          uRays: { value: rays },
          uStripes: { value: stripes },
          uOpacity: { value: opacity },
          uFlap: { value: flap },
        },
        vertexShader: finVert,
        fragmentShader: finFrag,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    const eye = new THREE.ShaderMaterial({ uniforms: common, vertexShader: eyeVert, fragmentShader: eyeFrag });
    return {
      body,
      dorsal: fin(new THREE.Color(0.42, 0.38, 0.34), 26, 0, 0.9),
      anal: fin(new THREE.Color(0.5, 0.44, 0.38), 14, 0, 0.85),
      caudal: fin(new THREE.Color(0.46, 0.4, 0.35), 22, 38, 0.9),
      pec: fin(new THREE.Color(0.8, 0.72, 0.62), 10, 0, 0.55, 1),
      eye,
    };
  }, [common]);

  // uniforms compartilhados: atualizados a cada render a partir do quadro (nunca por useFrame)
  common.uTime.value = time;
  common.uSwim.value = swim;
  common.uFreq.value = freq;
  common.uSun.value.copy(env.sun);
  common.uSunCol.value.copy(env.sunCol);
  common.uAmb.value.copy(env.amb);
  common.uFogCol.value.copy(env.fogCol).convertLinearToSRGB(); // shader cru: névoa em sRGB, igual ao céu
  common.uFogDen.value = env.fogDen;
  mats.body.uniforms.uGlint.value = glint;

  const flapA = Math.sin(time * 6.2831 * 1.3) * 0.35;
  const eyeX = uToX(0.1);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo.body} material={mats.body} />
      <mesh geometry={geo.fins.dorsal} material={mats.dorsal} />
      <mesh geometry={geo.fins.anal} material={mats.anal} />
      <mesh geometry={geo.fins.caudal} material={mats.caudal} />
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh
            geometry={geo.pec}
            material={mats.pec}
            position={[uToX(0.27), -0.04, s * 0.155]}
            rotation={[0, s * (0.35 + flapA), -0.25]}
          />
          <mesh
            geometry={geo.pel}
            material={mats.anal}
            position={[uToX(0.33), bodyBot(0.33) + 0.03, s * 0.06]}
            rotation={[s * 0.5, s * 0.2, -0.9]}
          />
          <mesh position={[eyeX, 0.075, s * 0.098]} rotation={[0, (-s * Math.PI) / 2, 0]} material={mats.eye}>
            <sphereGeometry args={[0.042, 24, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
