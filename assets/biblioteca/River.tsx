// O rio: água âmbar de rio do sertão ao entardecer. Tudo é função de `time`.
import React, { useMemo } from "react";
import * as THREE from "three";
import { NOISE } from "./glsl";
import type { Env } from "./Tilapia";
import { GRADE as G } from "./grade";

const v3 = (t: [number, number, number]) => `vec3(${t.map((x) => x.toFixed(3)).join(", ")})`;

export const riverEnv = (): Env => ({
  sun: new THREE.Vector3(0.25, 1, 0.15).normalize(),
  sunCol: new THREE.Color(...G.sun),
  amb: new THREE.Color(...G.amb),
  fogCol: new THREE.Color(G.fog),
  fogDen: 0.085,
});
export const FISH_PALETTE = G.fish;

// PRNG com semente: mesma sequência em qualquer quadro, em qualquer aba de render
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const skyFrag = /* glsl */ `
${NOISE}
uniform float uTime; uniform vec3 uSun; uniform float uWindow; uniform float uSunR; uniform float uDisk;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 deep = ${v3(G.deep)}, mid = ${v3(G.mid)}, hi = ${v3(G.hi)};
  vec3 col = mix(deep, mid, smoothstep(-0.5, 0.05, y));
  col = mix(col, hi, smoothstep(0.1, 0.7, y));
  // janela de Snell: acima de ~48° do zênite a superfície mostra o céu, com ondulação
  float win = smoothstep(0.62, 0.70, y);
  vec2 q = d.xz / max(y, 0.2) * 3.0;
  float rip = fbm(q + vec2(uTime * 0.25, -uTime * 0.18)) ;
  float ring = smoothstep(0.02, 0.0, abs(y - 0.665)) * 0.6;
  vec3 skyC = mix(vec3(1.0, 0.8, 0.56), vec3(1.0, 0.93, 0.8), rip);
  col = mix(col, skyC, win * uWindow * (0.75 + 0.25 * rip));
  col += ring * uWindow * vec3(1.0, 0.75, 0.45);
  // sol
  float s = max(dot(d, normalize(uSun)), 0.0);
  col += vec3(1.0, 0.85, 0.6) * pow(s, 14.0) * 0.6;
  // disco do sol visto através da água: o primeiro círculo da sequência sol → cuba → foco
  float disk = smoothstep(cos(uSunR + 0.012), cos(uSunR), s);
  float wob = 1.0 + 0.04 * (fbm(d.xz * 20.0 + uTime * 0.6) - 0.5);
  col = mix(col, vec3(1.0, 0.95, 0.84) * wob, disk * uDisk);
  gl_FragColor = vec4(col, 1.0);
}`;
const skyVert = /* glsl */ `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const rayFrag = /* glsl */ `
${NOISE}
uniform float uTime; uniform float uSeed; uniform float uOpacity;
varying vec2 vUv;
void main(){
  float n = vnoise(vec2(vUv.x * 7.0 + uSeed * 13.0, uTime * 0.35 + uSeed));
  float stripes = smoothstep(0.35, 1.0, n) ;
  float fade = smoothstep(0.0, 0.6, vUv.y) * smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
  gl_FragColor = vec4(${v3(G.rays)} * stripes * fade * uOpacity, 1.0);
}`;
const uvVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const floorFrag = /* glsl */ `
${NOISE}
uniform float uTime; uniform vec3 uFogCol; uniform float uFogDen;
varying vec2 vUv; varying vec3 vW;
void main(){
  vec2 p = vW.xz;
  vec3 sand = mix(${v3(G.sandA)}, ${v3(G.sandB)}, fbm(p * 0.6));
  // cáusticas: bordas de Voronoi animadas, duas camadas
  vec2 wob = vec2(fbm(p * 0.5 + uTime * 0.1), fbm(p * 0.5 - uTime * 0.1)) * 1.4;
  float c1 = voronoi((p + wob) * 0.9 + vec2(uTime * 0.22, uTime * 0.15)).y;
  float c2 = voronoi((p - wob) * 1.3 - vec2(uTime * 0.18, -uTime * 0.12)).y;
  float caus = smoothstep(0.16, 0.0, c1) * 0.55 + smoothstep(0.12, 0.0, c2) * 0.35;
  caus = caus * caus * 1.6;
  vec3 col = sand * (0.8 + 0.6 * caus * ${v3(G.caustic)});
  float dist = length(cameraPosition - vW);
  float f = 1.0 - exp(-pow(uFogDen * dist, 1.6));
  gl_FragColor = vec4(mix(col, uFogCol, clamp(f, 0.0, 1.0)), 1.0);
}`;
const floorVert = /* glsl */ `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const partVert = /* glsl */ `
uniform float uTime; uniform float uSize;
attribute float aSeed;
varying float vA;
void main(){
  vec3 p = position;
  p += vec3(sin(uTime * 0.3 + aSeed * 6.0), cos(uTime * 0.23 + aSeed * 4.0) * 0.6 + uTime * 0.05, sin(uTime * 0.2 + aSeed * 9.0)) * 0.25;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (0.4 + aSeed) / -mv.z;
  vA = smoothstep(18.0, 2.0, -mv.z) * smoothstep(0.2, 1.2, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const partFrag = /* glsl */ `
varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA * 0.55; gl_FragColor = vec4(vec3(1.0, 0.86, 0.66) * a, 1.0); }`;

const weedVert = /* glsl */ `
uniform float uTime; attribute float aSeed; varying float vY; varying vec3 vW;
void main(){
  vec3 p = position; vY = uv.y;
  p.x += sin(uTime * 0.8 + aSeed * 5.0 + uv.y * 2.0) * 0.25 * uv.y * uv.y;
  p.z += cos(uTime * 0.6 + aSeed * 3.0) * 0.12 * uv.y * uv.y;
  vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
}`;
const weedFrag = /* glsl */ `
uniform vec3 uFogCol; uniform float uFogDen; varying float vY; varying vec3 vW;
void main(){
  vec3 col = mix(${v3(G.weedA)}, ${v3(G.weedB)}, vY);
  float dist = length(cameraPosition - vW); float f = 1.0 - exp(-pow(uFogDen * dist, 1.6));
  gl_FragColor = vec4(mix(col, uFogCol, clamp(f, 0.0, 1.0)), 1.0);
}`;

export const River: React.FC<{ time: number; env: Env; window?: number; rays?: number; sunR?: number; disk?: number }> = ({
  time,
  env,
  window = 1,
  rays = 1,
  sunR = 0.16,
  disk = 1,
}) => {
  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSun: { value: new THREE.Vector3() }, uWindow: { value: 1 }, uSunR: { value: 0.16 }, uDisk: { value: 1 } },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );
  const rayMats = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) =>
        new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uSeed: { value: i * 1.37 }, uOpacity: { value: 0.22 } },
          vertexShader: uvVert,
          fragmentShader: rayFrag,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      ),
    [],
  );
  const floor = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFogCol: { value: new THREE.Color() }, uFogDen: { value: 0.1 } },
        vertexShader: floorVert,
        fragmentShader: floorFrag,
      }),
    [],
  );
  const parts = useMemo(() => {
    const r = mulberry32(7);
    const N = 900;
    const pos = new Float32Array(N * 3),
      seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (r() - 0.5) * 22;
      pos[i * 3 + 1] = (r() - 0.5) * 12;
      pos[i * 3 + 2] = (r() - 0.5) * 22;
      seed[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: 70 } },
      vertexShader: partVert,
      fragmentShader: partFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { g, m };
  }, []);
  const weeds = useMemo(() => {
    const r = mulberry32(21);
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 70; i++) {
      const h = 0.8 + r() * 2.2,
        w = 0.05 + r() * 0.07;
      const g = new THREE.PlaneGeometry(w, h, 1, 8);
      g.translate((r() - 0.5) * 20, -3.5 + h / 2, (r() - 0.5) * 14 - 5);
      g.rotateY(r() * Math.PI);
      const s = new Float32Array(g.attributes.position.count).fill(r());
      g.setAttribute("aSeed", new THREE.BufferAttribute(s, 1));
      geos.push(g);
    }
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFogCol: { value: new THREE.Color() }, uFogDen: { value: 0.1 } },
      vertexShader: weedVert,
      fragmentShader: weedFrag,
      side: THREE.DoubleSide,
    });
    return { geos, m };
  }, []);
  const rocks = useMemo(() => {
    const r = mulberry32(99);
    return Array.from({ length: 16 }, () => ({
      p: [(r() - 0.5) * 22, -3.55, (r() - 0.5) * 16 - 4] as [number, number, number],
      s: [0.3 + r() * 0.9, 0.18 + r() * 0.4, 0.3 + r() * 0.8] as [number, number, number],
      ry: r() * 6,
    }));
  }, []);

  sky.uniforms.uTime.value = time;
  sky.uniforms.uSun.value.copy(env.sun);
  sky.uniforms.uWindow.value = window;
  sky.uniforms.uSunR.value = sunR;
  sky.uniforms.uDisk.value = disk;
  rayMats.forEach((m) => {
    m.uniforms.uTime.value = time;
    m.uniforms.uOpacity.value = 0.2 * rays;
  });
  floor.uniforms.uTime.value = time;
  // shader cru: a névoa volta para sRGB, senão o chão vira uma faixa vermelha mais escura que o céu
  floor.uniforms.uFogCol.value.copy(env.fogCol).convertLinearToSRGB();
  floor.uniforms.uFogDen.value = env.fogDen;
  parts.m.uniforms.uTime.value = time;
  weeds.m.uniforms.uTime.value = time;
  weeds.m.uniforms.uFogCol.value.copy(env.fogCol).convertLinearToSRGB();
  weeds.m.uniforms.uFogDen.value = env.fogDen;

  return (
    <>
      <fogExp2 attach="fog" args={[env.fogCol.getHex(), env.fogDen * 0.9]} />
      <mesh material={sky}>
        <sphereGeometry args={[60, 48, 24]} />
      </mesh>
      {rayMats.map((m, i) => (
        <mesh
          key={i}
          material={m}
          position={[-6 + i * 1.6 + Math.sin(i * 3.1) * 0.8, 1.5, -3 - (i % 3) * 2.5]}
          rotation={[0.18, i * 0.7, 0.22 + Math.sin(i) * 0.08]}
        >
          <planeGeometry args={[1.2 + (i % 3) * 0.6, 14]} />
        </mesh>
      ))}
      <mesh material={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, 0]}>
        <planeGeometry args={[80, 80, 1, 1]} />
      </mesh>
      {weeds.geos.map((g, i) => (
        <mesh key={i} geometry={g} material={weeds.m} />
      ))}
      {rocks.map((k, i) => (
        <mesh key={i} position={k.p} scale={k.s} rotation={[0, k.ry, 0]}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={G.rock} roughness={0.95} flatShading />
        </mesh>
      ))}
      <points geometry={parts.g} material={parts.m} />
      <ambientLight intensity={0.6} color={env.amb} />
      <directionalLight position={env.sun.clone().multiplyScalar(10)} intensity={1.4} color={env.sunCol} />
    </>
  );
};
