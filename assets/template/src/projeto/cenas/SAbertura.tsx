// Cena de exemplo: objeto 3D procedural em "gravura posterizada" (a paleta vem da marca).
// Padrão de toda cena 3D: tudo é função do quadro (g), câmera pelo CameraRig, nada de useFrame().
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CameraRig } from "../../three/CameraRig";
import { NOISE } from "../../three/glsl";
import { POSTER_GLSL, palette } from "../../three/poster";
import { BgGradient, useG } from "../../engine/ui";
import { C, FPS, H, W } from "../../brand/brand";

const vert = /* glsl */ `varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const frag = /* glsl */ `${NOISE}
${POSTER_GLSL}
varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){
  vec3 N = normalize(vN); vec3 L = normalize(vec3(-0.4, 0.8, 0.6));
  float tone = 0.25 + 0.55 * max(dot(N, L), 0.0) + 0.2 * (0.5 + 0.5 * N.y);
  gl_FragColor = vec4(poster(tone, vUv * vec2(8.0, 2.0)), 1.0);
}`;

export const SAbertura: React.FC = () => {
  const g = useG();
  const t = g / FPS;
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uPal: palette([C.fundoC, C.apoio, C.destaque, C.acento, C.papel]) },
        vertexShader: vert,
        fragmentShader: frag,
      }),
    [],
  );
  return (
    <AbsoluteFill>
      <BgGradient />
      <ThreeCanvas width={W} height={H}>
        <CameraRig pos={[0, 0.2, 5.2]} target={[0, 0.25, 0]} fov={40} />
        <mesh material={mat} rotation={[0.4 + t * 0.35, t * 0.6, 0]} position={[0, 0.7, 0]}>
          <torusKnotGeometry args={[0.62, 0.21, 220, 32]} />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
