// A passageira em 2.5D: cada tomada (imagem ampliada 4×) vira um relevo pelo mapa de profundidade
// (scripts/profundidade.py, Depth Anything V2) e a câmera se move de verdade (paralaxe: o rosto se descola da poltrona).
// No shader: a cor da liga (fim de tarde quente), a luz coral do celular no rosto e uma vinheta suave.
import React, { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { H, W } from "../brand/brand";
import { CameraRig } from "../three/CameraRig";

// tamanho de cada tomada ampliada (px)
export const TAM: Record<number, [number, number]> = {
  1: [1444, 1472], 2: [1196, 1472], 3: [1120, 1472], 4: [1068, 1472], 5: [1252, 1472], 6: [1744, 1404], 7: [1716, 1404],
  8: [1484, 1404], 9: [1160, 1404], 10: [1488, 1196], 11: [1168, 1196], 12: [1212, 1196], 13: [1056, 1196], 14: [1160, 1196],
};

const vert = /* glsl */ `
uniform sampler2D uDepth; uniform float uAmt;
varying vec2 vUv; varying float vD;
void main(){
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vD = d;
  vec3 p = position + vec3(0.0, 0.0, d * uAmt);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const frag = /* glsl */ `
uniform sampler2D uMap; uniform vec2 uGlowUv; uniform float uGlow; uniform float uAspect; uniform float uQuente;
varying vec2 vUv; varying float vD;
void main(){
  vec3 c = texture2D(uMap, vUv).rgb;
  // cor da liga: fim de tarde quente, pretos levemente cor de terra, um pouco mais de contraste
  vec3 q = mix(c, c * vec3(1.07, 0.97, 0.9) + vec3(0.02, 0.0, -0.01), uQuente);
  q = mix(vec3(dot(q, vec3(0.299, 0.587, 0.114))), q, 0.92);
  q = (q - 0.5) * 1.05 + 0.5;
  // luz coral do celular: ilumina o que está perto do aparelho e voltado para ele (mais forte no que está à frente)
  vec2 dv = (vUv - uGlowUv) * vec2(1.0, uAspect);
  float luz = exp(-dot(dv, dv) / 0.035) * (0.35 + 0.65 * vD);
  q += vec3(1.0, 0.5, 0.33) * luz * uGlow * 0.55;
  // vinheta
  vec2 v = vUv - 0.5;
  q *= 1.0 - 0.35 * smoothstep(0.35, 0.85, length(v * vec2(1.0, 0.9)));
  gl_FragColor = vec4(clamp(q, 0.0, 1.0), 1.0);
}`;

const Relevo: React.FC<{ n: number; amt: number; glowUv: [number, number]; glow: number }> = ({ n, amt, glowUv, glow }) => {
  const [w, h] = TAM[n];
  const id = String(n).padStart(2, "0");
  const [map, depth] = useLoader(THREE.TextureLoader, [staticFile(`personagem/x4/c${id}.png`), staticFile(`personagem/prof/c${id}.png`)]);
  const geo = useMemo(() => new THREE.PlaneGeometry(w / 1000, h / 1000, 220, 220), [w, h]);
  const mat = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, uDepth: { value: depth }, uAmt: { value: amt }, uGlowUv: { value: new THREE.Vector2() }, uGlow: { value: 0 }, uAspect: { value: h / w }, uQuente: { value: 1 } },
      vertexShader: vert, fragmentShader: frag,
    });
  }, [map, depth, amt, w, h]);
  mat.uniforms.uGlowUv.value.set(glowUv[0], glowUv[1]);
  mat.uniforms.uGlow.value = glow;
  return <mesh geometry={geo} material={mat} />;
};

/**
 * n: tomada · foco: ponto da imagem (px, y para baixo) no centro da tela · esc: px de tela por px da imagem
 * orbita: [x, y] deslocamento lateral da câmera (paralaxe) · amt: força do relevo · glow: luz coral do celular (uv, v para cima)
 */
export const TomadaRelief: React.FC<{
  n: number; foco: [number, number]; esc: number; orbita?: [number, number]; amt?: number; glowUv?: [number, number]; glow?: number; tremor?: number;
}> = ({ n, foco, esc, orbita = [0, 0], amt = 0.16, glowUv = [0.5, 0.4], glow = 0, tremor = 0 }) => {
  const [w, h] = TAM[n];
  const fx = (foco[0] - w / 2) / 1000, fy = (h / 2 - foco[1]) / 1000;
  const fov = 30;
  const D = (H / esc / 1000) / (2 * Math.tan((fov / 2) * (Math.PI / 180)));
  const z = amt * 0.5; // mira no meio do relevo
  const tx = tremor / (esc * 1000);
  return (
    <ThreeCanvas width={W} height={H}>
      <CameraRig pos={[fx + orbita[0] * D + tx, fy + orbita[1] * D, z + D]} target={[fx + tx, fy, z]} fov={fov} />
      <Relevo n={n} amt={amt} glowUv={glowUv} glow={glow} />
    </ThreeCanvas>
  );
};
