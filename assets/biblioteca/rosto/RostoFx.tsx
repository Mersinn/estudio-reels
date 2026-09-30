// O rosto da Vênus (recorte ampliado 4× com Real-ESRGAN: public/img/rosto_x4.png) com o verbo do reel:
// ESCANEADA pelo filtro (liquify em shader: lábio, nariz, olhos, sobrancelha, pele lisa, brilho de tela) e, no fim,
// MARCADA pelo cirurgião (a caneta fica no SVG por cima, em Malha.tsx). É a própria arte deformada, nunca pintura
// por cima (lição do reel da prótese). Coordenadas em pixels do recorte (540×700, origem 560,330 na venus_hq.png).
import React, { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useLoader } from "@react-three/fiber";
import { H, W } from "../brand/brand";
import { CameraRig } from "../three/CameraRig";
import MALHA from "../data/malha.json";

export const RW = 540, RH = 700; // recorte do rosto em px da venus_hq
export const L = MALHA.L as unknown as Record<string, [number, number]>;

export type FiltroFx = {
  lip?: number; // 0→1 encurta o filtro do lábio (o "lip lift" do app)
  nose?: number; // 0→1 afina o nariz e apaga a sombra da asa (a cartilagem)
  eye?: number; // 0→1 olhos maiores
  brow?: number; // 0→1 sobrancelha sobe (mais na cauda)
  gloss?: number; // 0→1 pele lisa de app (sem poro, sem sombra)
  tela?: number; // 0→1 luz fria de tela
  impacto?: number; // 0→1 onda do soco (anel que sai do ponto de impacto)
  impC?: [number, number]; // ponto do impacto, px do recorte
  pb?: number; // 0→1 impressão em P&B (o replay na mesa)
};

/** vista: centro (px do recorte) que fica no meio da tela e quantos px de tela vale 1 px do recorte */
export type Vista = { cx: number; cy: number; zoom: number; x?: number; y?: number };
export const naTela = (v: Vista, p: [number, number]): [number, number] => [
  (v.x ?? W / 2) + (p[0] - v.cx) * v.zoom,
  (v.y ?? H / 2) + (p[1] - v.cy) * v.zoom,
];

// ── o liquify: para cada ponto da TELA, de onde (no recorte) vem a cor. O mesmo no shader e no TS (malha, rótulos). ──
const EIXO_A: [number, number] = [300, 230];
const EIXO_B: [number, number] = [398, 395];
export function fonte(p: [number, number], fx: FiltroFx): [number, number] {
  let dx = 0, dy = 0;
  const lip = fx.lip ?? 0, nose = fx.nose ?? 0, eye = fx.eye ?? 0, brow = fx.brow ?? 0;
  if (lip) {
    const gx = Math.exp(-(((p[0] - 345) / 90) ** 2));
    const t = Math.min(1, Math.max(0, (p[1] - 425) / 215));
    dy += lip * 52 * gx * Math.pow(Math.sin(Math.PI * t), 1.2);
  }
  if (nose) {
    const ab = [EIXO_B[0] - EIXO_A[0], EIXO_B[1] - EIXO_A[1]];
    const t = ((p[0] - EIXO_A[0]) * ab[0] + (p[1] - EIXO_A[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2);
    const tc = Math.min(1.1, Math.max(0, t));
    const q = [EIXO_A[0] + ab[0] * tc, EIXO_A[1] + ab[1] * tc];
    const per = [p[0] - q[0], p[1] - q[1]];
    const d = Math.hypot(per[0], per[1]);
    const g = ss(0.25, 0.6, t) * (1 - ss(0.95, 1.2, t)) * Math.exp(-((d / 75) ** 2));
    dx += per[0] * nose * 0.85 * g;
    dy += per[1] * nose * 0.85 * g;
  }
  if (eye) for (const e of [L.olhoA, L.olhoB]) {
    const v = [p[0] - e[0], p[1] - e[1]];
    const r = Math.hypot(v[0], v[1]) / 56;
    if (r < 1) { const k = eye * 0.55 * (1 - r * r) ** 2; dx -= v[0] * k; dy -= v[1] * k; }
  }
  if (brow) for (const [s, lado] of [[L.sobA, -1], [L.sobB, 1]] as const) {
    const w = Math.exp(-(((p[0] - s[0]) ** 2 + (p[1] - s[1]) ** 2) / (58 * 58)));
    const cauda = 1 + 0.6 * Math.max(0, Math.min(1, (lado * (p[0] - s[0])) / 50)); // a cauda sobe mais ("fox eye")
    dy += brow * 30 * w * cauda;
  }
  return [p[0] + dx, p[1] + dy];
}
/** onde um ponto do recorte aparece depois do filtro (inversa aproximada de `fonte`, boa para a malha e rótulos) */
export function destino(p: [number, number], fx: FiltroFx): [number, number] {
  let q: [number, number] = [p[0], p[1]];
  for (let i = 0; i < 4; i++) {
    const f = fonte(q, fx);
    q = [q[0] - (f[0] - p[0]), q[1] - (f[1] - p[1])];
  }
  return q;
}
function ss(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const frag = /* glsl */ `
uniform sampler2D uMap; uniform sampler2D uDepth;
uniform float uLip, uNose, uEye, uBrow, uGloss, uTela, uImp, uPb;
uniform vec2 uImpC, uOA, uOB, uSA, uSB;
varying vec2 vUv;
const vec2 RS = vec2(540.0, 700.0);
float ss(float a, float b, float x){ return smoothstep(a, b, x); }
vec2 fonte(vec2 p){
  vec2 d = vec2(0.0);
  float gx = exp(-pow((p.x - 345.0) / 90.0, 2.0));
  float t = clamp((p.y - 425.0) / 215.0, 0.0, 1.0);
  d.y += uLip * 52.0 * gx * pow(sin(3.14159 * t), 1.2);
  vec2 A = vec2(300.0, 230.0), B = vec2(398.0, 395.0), ab = B - A;
  float tn = dot(p - A, ab) / dot(ab, ab);
  vec2 q = A + ab * clamp(tn, 0.0, 1.1);
  vec2 per = p - q; float dd = length(per);
  float g = ss(0.25, 0.6, tn) * (1.0 - ss(0.95, 1.2, tn)) * exp(-pow(dd / 75.0, 2.0));
  d += per * uNose * 0.85 * g;
  for(int i = 0; i < 2; i++){
    vec2 e = i == 0 ? uOA : uOB; vec2 v = p - e; float r = length(v) / 56.0;
    if(r < 1.0){ float k = uEye * 0.55 * pow(1.0 - r * r, 2.0); d -= v * k; }
  }
  for(int i = 0; i < 2; i++){
    vec2 s = i == 0 ? uSA : uSB; float lado = i == 0 ? -1.0 : 1.0;
    float w = exp(-dot(p - s, p - s) / (58.0 * 58.0));
    float cauda = 1.0 + 0.6 * clamp(lado * (p.x - s.x) / 50.0, 0.0, 1.0);
    d.y += uBrow * 30.0 * w * cauda;
  }
  // onda do soco: anel que sai do ponto de impacto e empurra a imagem
  vec2 vi = p - uImpC; float ri = length(vi);
  float frente = uImp * 260.0;
  float onda = exp(-pow((ri - frente) / 26.0, 2.0)) * (1.0 - uImp) * step(0.001, uImp);
  d += (ri > 0.1 ? vi / ri : vec2(0.0)) * onda * 16.0;
  return p + d;
}
vec4 amostra(vec2 pc){ return texture2D(uMap, vec2(pc.x / RS.x, 1.0 - pc.y / RS.y)); }
void main(){
  vec2 pc = vec2(vUv.x * RS.x, (1.0 - vUv.y) * RS.y);
  vec2 src = fonte(pc);
  vec4 tex = amostra(src);
  if(tex.a < 0.5) discard;
  vec3 col = tex.rgb;
  // relevo → luz (a forma "morde" a luz, como no VenusRelief)
  vec2 uvs = vec2(src.x / RS.x, 1.0 - src.y / RS.y); vec2 px = vec2(2.0 / RS.x, 2.0 / RS.y);
  float dx = texture2D(uDepth, uvs + vec2(px.x, 0.0)).r - texture2D(uDepth, uvs - vec2(px.x, 0.0)).r;
  float dy = texture2D(uDepth, uvs + vec2(0.0, px.y)).r - texture2D(uDepth, uvs - vec2(0.0, px.y)).r;
  vec3 N = normalize(vec3(-dx * 9.0, -dy * 9.0, 1.0));
  col *= 0.92 + 0.16 * max(dot(N, normalize(vec3(-0.35, 0.55, 0.8))), 0.0);
  // pele de app: média larga (some o poro, some a sombra), mais clara e rosada, só dentro do rosto
  float oval = 1.0 - ss(0.75, 1.0, length((pc - vec2(300.0, 370.0)) / vec2(205.0, 300.0)));
  vec3 liso = vec3(0.0);
  for(int j = 0; j < 12; j++){ float a = float(j) * 0.5236; liso += amostra(src + vec2(cos(a), sin(a)) * 7.0).rgb; }
  liso /= 12.0;
  vec3 app = liso * 1.07 + vec3(0.05, 0.02, 0.035);
  col = mix(col, app, uGloss * oval * 0.85);
  // o nariz do app: a sombra da asa (onde mora a cartilagem) é apagada
  vec2 A = vec2(300.0, 230.0), B = vec2(398.0, 395.0), ab = B - A;
  float tn = dot(pc - A, ab) / dot(ab, ab);
  float dn = length(pc - (A + ab * clamp(tn, 0.0, 1.1)));
  float nariz = ss(0.45, 0.75, tn) * (1.0 - ss(1.0, 1.25, tn)) * (1.0 - ss(40.0, 90.0, dn));
  vec3 lisoN = vec3(0.0);
  for(int j = 0; j < 12; j++){ float a = float(j) * 0.5236; lisoN += amostra(src + vec2(cos(a), sin(a)) * 16.0).rgb; }
  lisoN = lisoN / 12.0 * 1.1;
  col = mix(col, lisoN, uNose * nariz * 0.75);
  // luz fria de tela
  col = mix(col, col * vec3(0.84, 0.95, 1.12) + vec3(0.02, 0.05, 0.1), uTela);
  // impressão P&B (replay na mesa)
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  col = mix(col, vec3(lum) * vec3(1.02, 0.98, 0.93), uPb);
  // o recorte não tem borda reta: some num degradê suave (como a base do busto na série)
  float borda = ss(0.0, 70.0, pc.x) * ss(0.0, 60.0, pc.y) * ss(0.0, 40.0, RS.x - pc.x) * ss(0.0, 110.0, RS.y - pc.y);
  gl_FragColor = vec4(col, borda);
}`;

const Plano: React.FC<{ fx: FiltroFx }> = ({ fx }) => {
  const [map, depth] = useLoader(THREE.TextureLoader, [staticFile("img/rosto_x4.png"), staticFile("img/rosto_depth.png")]);
  const mat = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: map }, uDepth: { value: depth },
        uLip: { value: 0 }, uNose: { value: 0 }, uEye: { value: 0 }, uBrow: { value: 0 }, uGloss: { value: 0 }, uTela: { value: 0 },
        uImp: { value: 0 }, uPb: { value: 0 }, uImpC: { value: new THREE.Vector2(340, 480) },
        uOA: { value: new THREE.Vector2(...L.olhoA) }, uOB: { value: new THREE.Vector2(...L.olhoB) },
        uSA: { value: new THREE.Vector2(...L.sobA) }, uSB: { value: new THREE.Vector2(...L.sobB) },
      },
      vertexShader: vert, fragmentShader: frag, transparent: true,
    });
  }, [map, depth]);
  const u = mat.uniforms;
  u.uLip.value = fx.lip ?? 0; u.uNose.value = fx.nose ?? 0; u.uEye.value = fx.eye ?? 0; u.uBrow.value = fx.brow ?? 0;
  u.uGloss.value = fx.gloss ?? 0; u.uTela.value = fx.tela ?? 0; u.uImp.value = fx.impacto ?? 0; u.uPb.value = fx.pb ?? 0;
  if (fx.impC) (u.uImpC.value as THREE.Vector2).set(...fx.impC);
  return (
    <mesh material={mat}>
      <planeGeometry args={[RW / 100, RH / 100]} />
    </mesh>
  );
};

/** o rosto na tela: `v` diz qual ponto do recorte fica no centro e o zoom (px de tela por px do recorte).
 *  Câmera quase ortográfica (fov 8°) para os rótulos 2D (naTela) caírem exatamente sobre a arte. */
export const RostoFx: React.FC<{ fx: FiltroFx; v: Vista; w?: number; h?: number }> = ({ fx, v, w = W, h = H }) => {
  const fov = 8;
  const alturaVisivel = h / v.zoom / 100; // em unidades do plano (1 = 100 px do recorte)
  const dist = alturaVisivel / 2 / Math.tan((fov * Math.PI) / 360);
  const ox = (v.x ?? w / 2) - w / 2, oy = (v.y ?? h / 2) - h / 2; // deslocamento do centro na tela
  const tx = (v.cx - RW / 2) / 100 - ox / v.zoom / 100;
  const ty = -((v.cy - RH / 2) / 100) + oy / v.zoom / 100;
  return (
    <ThreeCanvas width={w} height={h}>
      <CameraRig pos={[tx, ty, dist]} target={[tx, ty, 0]} fov={fov} />
      <Plano fx={fx} />
    </ThreeCanvas>
  );
};
