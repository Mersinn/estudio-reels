// Laboratório, visto de cima: a cuba de vidro é o segundo círculo da sequência
// sol → cuba → foco. A pele passa por limpeza, clorexidina 2% + glicerol e radiação gama
// (Alves et al., Cell Tissue Bank 2018) e sai como lâmina translúcida rica em colágeno.
import React, { useMemo } from "react";
import * as THREE from "three";
import { NOISE } from "./glsl";

export type LabFx = {
  time: number;
  murk: number; // 1 = água turva (pele crua) → 0 limpa
  tint: number; // 0 neutro · 1 clorexidina (rosado) · 2 glicerol (âmbar claro, viscoso)
  gamma: number; // 0→1 varredura de radiação
  clean: number; // 0 pele crua (cinza, pigmentada) → 1 processada (translúcida)
  lift: number; // 0→1 a lâmina sobe em direção à câmera
  fiber: number; // 0→1 revela as fibras de colágeno (contraluz)
};

const uvVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const benchFrag = /* glsl */ `
${NOISE}
varying vec2 vUv;
void main(){
  vec3 c = vec3(0.984, 0.961, 0.941);
  c *= 0.95 + 0.05 * fbm(vUv * 60.0);
  float vig = smoothstep(0.75, 0.2, length(vUv - 0.5));
  gl_FragColor = vec4(c * (0.8 + 0.2 * vig), 1.0);
}`;

const liquidFrag = /* glsl */ `
${NOISE}
uniform float uTime, uMurk, uTint, uGamma, uLift;
varying vec2 vUv;
void main(){
  vec2 c = vUv - 0.5; float r = length(c) * 2.0;
  if(r > 1.0) discard;
  vec3 clear = vec3(0.93, 0.92, 0.9);
  vec3 murk = vec3(0.55, 0.45, 0.35);
  vec3 chx = vec3(0.98, 0.82, 0.8);   // clorexidina: leve rosado
  vec3 gly = vec3(0.99, 0.93, 0.8);   // glicerol: âmbar pálido
  vec3 base = uTint < 1.0 ? mix(clear, chx, uTint) : mix(chx, gly, uTint - 1.0);
  vec3 col = mix(base, murk, uMurk * (0.8 + 0.2 * fbm(c * 6.0 + uTime * 0.2)));
  // ondulações concêntricas lentas
  float rip = sin(r * 38.0 - uTime * 2.2) * 0.5 + 0.5;
  col *= 0.96 + 0.04 * rip * (1.0 - r);
  // varredura gama: um feixe que gira e deixa um rastro
  float ang = atan(c.y, c.x);
  float sweep = fract((ang / 6.2831) - uGamma * 1.0);
  float beam = smoothstep(0.08, 0.0, sweep) * step(0.001, uGamma) * step(uGamma, 0.999);
  col = mix(col, vec3(1.0, 0.72, 0.45), beam * 0.45);
  // borda interna mais escura (espessura do vidro)
  col *= 1.0 - 0.18 * smoothstep(0.85, 1.0, r);
  float a = mix(0.92, 0.0, uLift * 0.6);
  gl_FragColor = vec4(col, 1.0);
}`;

const rimFrag = /* glsl */ `
varying vec2 vUv;
void main(){
  // anel de vidro: realce em arco no alto-esquerda
  float ang = vUv.x * 6.2831;
  float hi = pow(max(cos(ang - 2.3), 0.0), 8.0);
  vec3 c = mix(vec3(0.78, 0.76, 0.74), vec3(1.0), hi);
  gl_FragColor = vec4(c, 1.0);
}`;

const sheetVert = /* glsl */ `
uniform float uTime, uLift;
varying vec2 vUv; varying float vH;
void main(){
  vUv = uv;
  vec3 p = position;
  float w = sin(uv.x * 6.0 + uTime * 1.6) * 0.02 + sin(uv.y * 5.0 - uTime * 1.2) * 0.018;
  p.z += w * (1.0 - uLift * 0.5);
  // ao subir, a lâmina curva levemente (seguro pelas bordas)
  p.z += uLift * (0.9 - 0.35 * pow(abs(uv.x - 0.5) * 2.0, 2.0));
  vH = w;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const sheetFrag = /* glsl */ `
${NOISE}
uniform float uTime, uClean, uFiber, uLift;
varying vec2 vUv; varying float vH;
void main(){
  vec2 c = vUv - 0.5;
  float edgeN = (fbm(vUv * 6.0) - 0.5) * 0.1;
  float box = max(abs(c.x) * 0.95, abs(c.y) * 1.1) + edgeN;
  if(box > 0.46) discard;
  // pele crua: prata-acinzentada com pigmento e escamas; processada: creme translúcida
  vec2 sc = vUv * vec2(14.0, 18.0); sc.y += floor(sc.x) * 0.5;
  float d = length((fract(sc) - vec2(0.0, 0.5)) * vec2(0.9, 1.15));
  float scale = smoothstep(0.46, 0.55, d) * smoothstep(0.72, 0.55, d);
  vec3 raw = mix(vec3(0.42, 0.4, 0.38), vec3(0.68, 0.66, 0.62), fbm(vUv * 8.0));
  raw *= 1.0 - 0.25 * scale;
  raw *= 1.0 - 0.3 * smoothstep(0.55, 1.0, sin(vUv.x * 30.0));  // faixas do peixe
  vec3 done = mix(vec3(0.9, 0.86, 0.82), vec3(1.0, 0.97, 0.93), fbm(vUv * 5.0));
  done *= 1.0 - 0.08 * scale;
  vec3 col = mix(raw, done, uClean);
  // fibras de colágeno em contraluz: feixes ondulados entrelaçados
  float f1 = fbm(vec2(vUv.x * 80.0 + fbm(vUv * 3.0) * 8.0, vUv.y * 6.0));
  float f2 = fbm(vec2(vUv.y * 70.0 + fbm(vUv * 3.0 + 5.0) * 8.0, vUv.x * 6.0));
  float fib = smoothstep(0.55, 0.75, max(f1, f2));
  col = mix(col, vec3(1.0, 0.8, 0.62), fib * uFiber * 0.6);
  col += vec3(1.0, 0.9, 0.78) * uFiber * 0.12;
  col *= 1.0 + vH * 3.0;
  gl_FragColor = vec4(col, 1.0);
}`;

export const LabDish: React.FC<{ fx: LabFx }> = ({ fx }) => {
  const mats = useMemo(() => {
    const u = () => ({
      uTime: { value: 0 },
      uMurk: { value: 1 },
      uTint: { value: 0 },
      uGamma: { value: 0 },
      uLift: { value: 0 },
      uClean: { value: 0 },
      uFiber: { value: 0 },
    });
    return {
      bench: new THREE.ShaderMaterial({ vertexShader: uvVert, fragmentShader: benchFrag }),
      liquid: new THREE.ShaderMaterial({ uniforms: u(), vertexShader: uvVert, fragmentShader: liquidFrag }),
      rim: new THREE.ShaderMaterial({ vertexShader: uvVert, fragmentShader: rimFrag }),
      sheet: new THREE.ShaderMaterial({ uniforms: u(), vertexShader: sheetVert, fragmentShader: sheetFrag, side: THREE.DoubleSide }),
    };
  }, []);
  for (const m of [mats.liquid, mats.sheet]) {
    m.uniforms.uTime.value = fx.time;
    m.uniforms.uMurk.value = fx.murk;
    m.uniforms.uTint.value = fx.tint;
    m.uniforms.uGamma.value = fx.gamma;
    m.uniforms.uLift.value = fx.lift;
    m.uniforms.uClean.value = fx.clean;
    m.uniforms.uFiber.value = fx.fiber;
  }
  // tudo deitado no plano XZ; a câmera olha de cima
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh material={mats.bench} position={[0, 0, -0.05]}>
        <planeGeometry args={[12, 16]} />
      </mesh>
      {/* sombra de contato da cuba */}
      <mesh position={[0.06, -0.08, -0.04]}>
        <circleGeometry args={[1.78, 96]} />
        <meshBasicMaterial color="#d9cbbf" transparent opacity={0.55} />
      </mesh>
      <mesh material={mats.liquid} position={[0, 0, 0]}>
        <circleGeometry args={[1.62, 128]} />
      </mesh>
      <mesh material={mats.rim} position={[0, 0, 0.01]}>
        <ringGeometry args={[1.6, 1.74, 128, 1]} />
      </mesh>
      <mesh material={mats.sheet} position={[0, 0, 0.03]} rotation={[0, 0, 0.12]}>
        <planeGeometry args={[1.9, 1.5, 60, 48]} />
      </mesh>
    </group>
  );
};
