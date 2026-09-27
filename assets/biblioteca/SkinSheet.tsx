// A lâmina de pele de tilápia: cai como tecido, assenta no relevo da Vênus, adere nas
// bordas e, no fim, enrola a partir de um canto e sai. Tudo é função pura de
// (drape, adhere, peel, time): sem simulação acumulada, o render paralelo é idêntico.
import React, { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";
import { NOISE } from "./glsl";
import { BURN_R, BURN_UV, DEPTH, VENUS_H, VENUS_W } from "./VenusRelief";

export type SheetFx = { drape: number; adhere: number; peel: number; time: number; opacity: number };

const SIZE = BURN_R * 2.7; // lado da lâmina em unidades de u da Vênus

const vert = /* glsl */ `
${NOISE}
uniform sampler2D uDepth; uniform float uDepthAmt;
uniform vec2 uCenter; uniform float uSize; uniform vec2 uVenus;
uniform float uDrape, uPeel, uTime;
varying vec2 vUv; varying float vLift; varying vec3 vW; varying vec3 vN;

vec3 surf(vec2 suv){
  // ponto da lâmina → uv da Vênus → altura do relevo
  vec2 vuv = uCenter + (suv - 0.5) * vec2(uSize, uSize * uVenus.x / uVenus.y);
  float d = texture2D(uDepth, vuv).r;
  return vec3((vuv.x - 0.5) * uVenus.x, (vuv.y - 0.5) * uVenus.y, d * uDepthAmt + 0.006);
}

void main(){
  vUv = uv;
  vec3 p = surf(uv);
  // ── queda: cada ponto pousa com atraso crescente do centro para as bordas ──
  float dist = length(uv - 0.5);
  float delay = dist * 0.55;
  float t = clamp((uDrape - delay) / 0.45, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 3.0);
  float wave = sin(uv.x * 7.0 + uTime * 3.0) * 0.03 + sin(uv.y * 5.0 - uTime * 2.4) * 0.025;
  float lift = (1.0 - e) * (0.55 + wave + dist * 0.25);
  // antes de pousar, a lâmina vem de cima e um pouco à esquerda, ondulando
  p += vec3(-(1.0 - e) * 0.18, (1.0 - e) * 0.35, lift);
  // ── saída: enrola a partir do canto superior esquerdo ──
  vec2 dir = normalize(vec2(1.0, -1.0));
  float s = dot(uv - vec2(0.0, 1.0), dir);        // 0 no canto → ~1.41 no oposto
  float Lp = uPeel * 1.75;
  float rad = 0.045;
  if(s < Lp && uPeel > 0.0){
    // cilindro que rola: o trecho já enrolado dá voltas em torno do eixo da linha de descolamento
    float k = uSize * uVenus.x;                  // 1 unidade de uv da lâmina → mundo
    float arc = Lp - s;
    float th = min(arc / rad, 3.14159 * 7.0);
    float along = Lp - rad * sin(th);
    p.xy += (along - s) * dir * k;
    p.z += rad * k * (1.0 - cos(th)) + arc * 0.01;
    lift += 0.2;
  }
  vLift = lift;
  vN = vec3(0.0, 0.0, 1.0);
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const frag = /* glsl */ `
${NOISE}
uniform float uAdhere, uTime, uOpacity;
uniform sampler2D uSkin;
varying vec2 vUv; varying float vLift; varying vec3 vW; varying vec3 vN;
void main(){
  // contorno irregular de pele recortada
  vec2 c = vUv - 0.5;
  float edgeN = (fbm(vUv * 7.0) - 0.5) * 0.09;
  float box = max(abs(c.x), abs(c.y) * 1.05) + edgeN;
  if(box > 0.47) discard;
  // escamas impressas (a lâmina guarda o desenho das escamas) + fibras de colágeno
  vec2 sc = vUv * vec2(16.0, 20.0); sc.y += floor(sc.x) * 0.5;
  float d = length((fract(sc) - vec2(0.0, 0.5)) * vec2(0.9, 1.15));
  float scale = smoothstep(0.46, 0.55, d) * smoothstep(0.72, 0.55, d);
  float fib = fbm(vec2(vUv.x * 60.0 + fbm(vUv * 4.0) * 6.0, vUv.y * 5.0));
  vec3 base = mix(vec3(0.84, 0.80, 0.77), vec3(0.98, 0.94, 0.90), fib);
  base *= 1.0 - 0.1 * scale;
  // película perolada: faixa de brilho que corre pela lâmina
  float band = smoothstep(0.12, 0.0, abs(fract((vUv.x + vUv.y) * 0.5 - uTime * 0.18) - 0.5) - 0.18);
  vec3 iri = 0.5 + 0.5 * cos(6.2831 * ((vUv.x - vUv.y) * 0.8 + uTime * 0.1 + vec3(0.0, 0.12, 0.26)));
  iri = mix(vec3(1.0, 0.86, 0.76), iri, 0.4);
  vec3 col = base + iri * band * 0.22 + vec3(1.0, 0.92, 0.85) * band * 0.12;
  // borda que "cola": uma linha creme percorre o perímetro quando adere
  float rim = smoothstep(0.03, 0.0, abs(box - 0.44));
  float ang = atan(c.y, c.x) / 6.2831 + 0.5;
  float trace = step(ang, uAdhere * 1.02);
  col = mix(col, vec3(1.0, 0.93, 0.84), rim * trace * 0.85);
  // translúcida: mais transparente no centro, mais opaca na borda e quando levantada
  float a = uOpacity * (0.5 + 0.28 * smoothstep(0.25, 0.46, box) + 0.15 * clamp(vLift * 4.0, 0.0, 1.0) + 0.1 * band);
  // sombra de contato quando está no ar é feita pela escuridão sutil da face
  col *= 1.0 - 0.12 * clamp(vLift * 2.0, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

export const SkinSheet: React.FC<{ fx: SheetFx; position?: [number, number, number] }> = ({ fx, position = [0, 0, 0] }) => {
  const depth = useLoader(THREE.TextureLoader, staticFile("img/venus_depth.png"));
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, 72, 72), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uDepth: { value: depth },
          uDepthAmt: { value: DEPTH },
          uCenter: { value: BURN_UV },
          uSize: { value: SIZE },
          uVenus: { value: new THREE.Vector2(VENUS_W, VENUS_H) },
          uDrape: { value: 0 },
          uAdhere: { value: 0 },
          uPeel: { value: 0 },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uSkin: { value: null },
        },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [depth],
  );
  const u = mat.uniforms;
  u.uDrape.value = fx.drape;
  u.uAdhere.value = fx.adhere;
  u.uPeel.value = fx.peel;
  u.uTime.value = fx.time;
  u.uOpacity.value = fx.opacity;
  if (fx.opacity <= 0.001) return null;
  return <mesh geometry={geo} material={mat} position={position} renderOrder={2} />;
};
