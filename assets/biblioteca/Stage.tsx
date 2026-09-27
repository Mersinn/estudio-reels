// O "centro cirúrgico" do Sistema Vênus: fundo terracota com poça de luz, foco cirúrgico
// circular acima e a Vênus em relevo. Não é uma sala realista: é o palco da marca.
import React, { useMemo } from "react";
import * as THREE from "three";
import { NOISE } from "./glsl";

const bgFrag = /* glsl */ `
${NOISE}
uniform vec2 uPool; uniform float uPoolInt; uniform float uTime;
varying vec2 vUv;
void main(){
  vec3 deep = vec3(0.34, 0.13, 0.07), coral = vec3(0.93, 0.52, 0.37), terra = vec3(0.64, 0.27, 0.15);
  float d = length((vUv - uPool) * vec2(1.0, 1.43));   // plano 14×20: corrige para círculo
  vec3 col = mix(coral, terra, smoothstep(0.02, 0.13, d));
  col = mix(col, deep, smoothstep(0.1, 0.3, d));
  col = mix(deep, col, uPoolInt);
  col *= 0.94 + 0.06 * fbm(vUv * 6.0 + 2.0);
  gl_FragColor = vec4(col, 1.0);
}`;
const uvVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export const StageBackground: React.FC<{ pool?: [number, number]; poolInt?: number; z?: number }> = ({
  pool = [0.5, 0.47],
  poolInt = 1,
  z = -2.5,
}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uPool: { value: new THREE.Vector2() }, uPoolInt: { value: 1 }, uTime: { value: 0 } },
        vertexShader: uvVert,
        fragmentShader: bgFrag,
        depthWrite: false,
      }),
    [],
  );
  mat.uniforms.uPool.value.set(pool[0], pool[1]);
  mat.uniforms.uPoolInt.value = poolInt;
  return (
    <mesh material={mat} position={[0, 0.6, z]} renderOrder={-1}>
      <planeGeometry args={[14, 20]} />
    </mesh>
  );
};

const lensFrag = /* glsl */ `
uniform float uOn; varying vec2 vUv;
void main(){
  float r = length(vUv - 0.5) * 2.0;
  vec3 c = mix(vec3(1.0, 0.98, 0.92), vec3(1.0, 0.86, 0.66), smoothstep(0.0, 1.0, r));
  float ring = smoothstep(0.08, 0.0, abs(r - 0.72)) * 0.25;
  gl_FragColor = vec4((c * (0.35 + 0.95 * uOn) - ring) , 1.0);
}`;

/** foco cirúrgico: carcaça circular com 7 lentes. Voltado para −Y (ilumina para baixo). */
export const SurgicalLamp: React.FC<{ on: number; position?: [number, number, number] }> = ({
  on,
  position = [0, 2.6, 0],
}) => {
  const lens = useMemo(
    () => new THREE.ShaderMaterial({ uniforms: { uOn: { value: 1 } }, vertexShader: uvVert, fragmentShader: lensFrag }),
    [],
  );
  lens.uniforms.uOn.value = on;
  const cells: [number, number][] = [[0, 0]];
  for (let i = 0; i < 6; i++) cells.push([Math.cos((i * Math.PI) / 3) * 0.42, Math.sin((i * Math.PI) / 3) * 0.42]);
  return (
    // construído no plano XY com as lentes para +Z; a rotação aponta as lentes para baixo (−Y)
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.92, 0.24, 64, 1, true]} />
        <meshStandardMaterial color="#e9e1d8" roughness={0.45} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <torusGeometry args={[0.8, 0.06, 16, 96]} />
        <meshStandardMaterial color="#f4eee8" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[0.8, 64]} />
        <meshStandardMaterial color="#b9ada2" roughness={0.6} />
      </mesh>
      {cells.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.05]} material={lens}>
          <circleGeometry args={[0.17, 48]} />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 16]} />
        <meshStandardMaterial color="#d8d0c6" roughness={0.5} />
      </mesh>
    </group>
  );
};
