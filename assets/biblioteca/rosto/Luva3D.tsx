// A luva do filtro em 3D (Three.js, procedural por metaballs: punho, rolo dos nós dos dedos, palma e polegar se fundem
// numa forma só, como uma luva estofada de verdade) + manguito com faixa. Material de "objeto digital": azul envernizado
// com borda ciano (fresnel) e linhas de varredura finas. É o único objeto azul do vídeo (a cor do antagonista).
// Eixos locais: o antebraço sai para +Y (manguito), os nós dos dedos apontam para −Z (a direção do soco), polegar em +X.
import React, { useMemo } from "react";
import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const FRESNEL_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }`;
const FRESNEL_FRAG = /* glsl */ `
uniform float uBrilho; varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){
  float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.4);
  float scan = smoothstep(0.35, 0.5, abs(fract(vP.y * 22.0) - 0.5)) * 0.35;
  gl_FragColor = vec4(vec3(0.45, 0.88, 1.0) * (f * 1.1 + scan * f) * uBrilho, f * 0.9 * uBrilho);
}`;

function luva(mat: THREE.Material): MarchingCubes {
  const mc = new MarchingCubes(72, mat, false, false, 60000);
  mc.isolation = 80;
  mc.reset();
  // o campo vive em [0,1]³; centro em 0,5. Escala da peça: ~0,5 do cubo.
  const B = (x: number, y: number, z: number, s: number) => mc.addBall(0.5 + x * 0.25, 0.5 + y * 0.25, 0.5 + z * 0.25, s, 12);
  B(0, 0.05, 0.05, 1.05); // corpo
  B(0, -0.35, 0.1, 0.8); // palma / base
  for (const x of [-0.42, -0.14, 0.14, 0.42]) B(x * 0.9, 0.42, -0.55, 0.42); // rolo dos nós dos dedos (topo-frente)
  for (const x of [-0.3, 0, 0.3]) B(x, 0.05, -0.75, 0.38); // dedos dobrados (frente)
  B(0, -0.3, -0.55, 0.45); // ponta dos dedos, embaixo na frente
  B(0, 0.75, 0.2, 0.55); // transição para o manguito
  B(0, 1.05, 0.2, 0.45);
  mc.update();
  return mc;
}

export const Luva3D: React.FC<{ pos?: [number, number, number]; rot?: [number, number, number]; escala?: number; brilho?: number }> = ({
  pos = [0, 0, 0], rot = [0, 0, 0], escala = 1, brilho = 1,
}) => {
  const mat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#2A62F0"), roughness: 0.28, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.5, sheenColor: new THREE.Color("#8FD8FF") }),
    [],
  );
  const borda = useMemo(
    () => new THREE.ShaderMaterial({ uniforms: { uBrilho: { value: 1 } }, vertexShader: FRESNEL_VERT, fragmentShader: FRESNEL_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    [],
  );
  borda.uniforms.uBrilho.value = brilho;
  const corpo = useMemo(() => luva(mat), [mat]);
  const polegar = useMemo(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0.5, -0.45, 0.3), new THREE.Vector3(0.7, -0.3, 0.0), new THREE.Vector3(0.72, -0.05, -0.35), new THREE.Vector3(0.58, 0.18, -0.58)]);
    const g = new THREE.TubeGeometry(c, 48, 0.26, 32, false);
    // pontas arredondadas: duas esferas somadas na mesma geometria
    const a = new THREE.SphereGeometry(0.26, 32, 16); a.translate(0.58, 0.18, -0.58);
    const b = new THREE.SphereGeometry(0.26, 32, 16); b.translate(0.5, -0.45, 0.3);
    return mergeGeometries([g.toNonIndexed(), a.toNonIndexed(), b.toNonIndexed()]);
  }, []);
  const casca = useMemo(() => { const m = new THREE.Mesh(corpo.geometry, borda); return m; }, [corpo, borda]);
  const matCuff = useMemo(() => new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#1D48C8"), roughness: 0.32, clearcoat: 0.9 }), []);
  const matFaixa = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#E9FBFF"), emissive: new THREE.Color("#8FE0FF"), emissiveIntensity: 0.5, roughness: 0.4 }), []);
  matFaixa.emissiveIntensity = 0.5 * brilho;
  return (
    <group position={pos} rotation={rot} scale={escala}>
      <group scale={3.1}>
        <primitive object={corpo} />
        <primitive object={casca} />
      </group>
      {/* polegar: peça separada (com o vinco entre ele e o punho), curvado da base até a frente */}
      <group scale={1.3} position={[0.02, -0.05, 0]}>
        <mesh geometry={polegar} material={mat} />
        <mesh geometry={polegar} material={borda} />
      </group>
      {/* manguito longo, levemente aberto, com a tira de velcro */}
      <mesh material={matCuff} position={[0, 2.25, 0.3]}>
        <cylinderGeometry args={[0.62, 0.72, 1.1, 64, 1]} />
      </mesh>
      <mesh material={matFaixa} position={[0, 1.78, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.73, 0.05, 16, 96]} />
      </mesh>
      <mesh material={matFaixa} position={[0, 2.78, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.63, 0.04, 16, 96]} />
      </mesh>
    </group>
  );
};
