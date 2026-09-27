// Uma IMAGEM RECORTADA (PNG com alfa) vira relevo 3D (2.5D): a malha é deslocada por um mapa de
// profundidade (gere com scripts/prep_depth.py). Mantém 100% a fidelidade da arte original e ganha
// volume real para câmera, luz e efeitos. Foi a escolha que o Emerson preferiu ao 3D escaneado.
// Para "verbos" (algo acontecendo sobre a figura), copie este arquivo e acrescente uniforms no shader
// (exemplo completo: VenusRelief do pacote lacp-reels).
import React, { useMemo } from "react";
import * as THREE from "three";
import { staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";

const vert = /* glsl */ `
uniform sampler2D uDepth; uniform float uDepthAmt;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position + vec3(0.0, 0.0, texture2D(uDepth, uv).r * uDepthAmt);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const frag = /* glsl */ `
uniform sampler2D uMap; uniform sampler2D uDepth; uniform float uDepthAmt; uniform vec3 uKeyDir; uniform float uKey; uniform vec2 uTexel;
varying vec2 vUv;
void main(){
  vec4 tex = texture2D(uMap, vUv);
  if(tex.a < 0.5) discard;
  float dx = texture2D(uDepth, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDepth, vUv - vec2(uTexel.x, 0.0)).r;
  float dy = texture2D(uDepth, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDepth, vUv - vec2(0.0, uTexel.y)).r;
  vec3 N = normalize(vec3(-dx * uDepthAmt * 60.0, -dy * uDepthAmt * 60.0, 1.0));
  float ndl = max(dot(N, normalize(uKeyDir)), 0.0);
  gl_FragColor = vec4(tex.rgb * mix(1.0, 0.9 + 0.2 * ndl, uKey), 1.0);
}`;

export const ImageRelief: React.FC<{
  img: string; // ex.: "img/figura.png"
  depth: string; // ex.: "img/figura_depth.png"
  width: number; // largura no mundo 3D (a altura segue a proporção da imagem)
  aspect: number; // altura / largura da imagem
  depthAmt?: number;
  keyInt?: number;
  keyDir?: [number, number, number];
  position?: [number, number, number];
}> = ({ img, depth, width, aspect, depthAmt = 0.42, keyInt = 1, keyDir = [-0.3, 0.6, 0.8], position }) => {
  const [map, dmap] = useLoader(THREE.TextureLoader, [staticFile(img), staticFile(depth)]);
  const geo = useMemo(() => new THREE.PlaneGeometry(width, width * aspect, 220, Math.round(220 * aspect)), [width, aspect]);
  const mat = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: map },
        uDepth: { value: dmap },
        uDepthAmt: { value: depthAmt },
        uKeyDir: { value: new THREE.Vector3(...keyDir) },
        uKey: { value: keyInt },
        uTexel: { value: new THREE.Vector2(2 / (dmap.image?.width ?? 900), 2 / (dmap.image?.height ?? 1200)) },
      },
      vertexShader: vert,
      fragmentShader: frag,
    });
  }, [map, dmap, depthAmt, keyDir, keyInt]);
  mat.uniforms.uKey.value = keyInt;
  return <mesh geometry={geo} material={mat} position={position} />;
};
