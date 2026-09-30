// O avião em 3D (Three.js, procedural): fuselagem por revolução, asas enflechadas extrudadas, motores, deriva e
// estabilizadores; a pintura (creme, faixa coral, janelas) é uma textura desenhada aqui. Liso e limpo (como o saco e o
// implante), na paleta da liga. O nariz aponta para +X, o topo para +Y. Tudo função dos props.
import React, { useMemo } from "react";
import * as THREE from "three";

const L = 6.2, R = 0.44;

/** raio da fuselagem ao longo do eixo (y de −L/2 = cauda a +L/2 = nariz) */
function raio(y: number) {
  const n = L / 2 - 0.8, c = -L / 2 + 1.6;
  if (y > n) { const t = (y - n) / 0.8; return R * Math.pow(Math.max(0, 1 - t * t), 0.45); }
  if (y < c) { const t = (c - y) / 1.6; return R * (1 - 0.82 * Math.pow(t, 1.5)); }
  return R;
}

function pintura(): THREE.CanvasTexture {
  // x do canvas = volta (u) · y do canvas = comprimento (topo = nariz). Laterais em u = 0 (+Z) e u = 0,5 (−Z); barriga em u = 0,25
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 1024;
  const x = c.getContext("2d")!;
  x.fillStyle = "#F8EFE6"; x.fillRect(0, 0, 2048, 1024);
  const g = x.createLinearGradient(0, 0, 2048, 0); // barriga um pouco mais escura
  g.addColorStop(0.25, "rgba(150,110,95,.22)"); g.addColorStop(0.0, "rgba(0,0,0,0)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(0.75, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 2048, 1024);
  const lado = (cx: number, paraBarriga: number) => {
    x.fillStyle = "#E7704B"; x.fillRect(cx + paraBarriga * 62 - 16, 250, 32, 640); // faixa coral
    x.fillStyle = "#C9A45C"; x.fillRect(cx + paraBarriga * 92 - 5, 250, 10, 640);  // filete dourado
    for (let v = 270; v < 860; v += 26) { x.fillStyle = "#2A2330"; x.beginPath(); x.roundRect(cx - 36, v, 72, 15, 7); x.fill(); } // janelas
    x.fillStyle = "#2A2330"; x.beginPath(); x.roundRect(cx - 50, 200, 100, 34, 8); x.fill(); // porta dianteira
  };
  lado(0, 1); lado(2048, 1); lado(1024, -1);
  // cabine do piloto: faixa escura de para-brisa no alto do nariz (u ≈ 0,75 = topo) e nas laterais
  x.fillStyle = "#2A2330";
  x.beginPath(); x.moveTo(1180, 118); x.lineTo(1890, 118); x.lineTo(1840, 150); x.lineTo(1230, 150); x.closePath(); x.fill();
  for (const cx of [60, 1024 - 60, 1988]) { x.beginPath(); x.roundRect(cx - 30, 126, 60, 20, 6); x.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** placa de asa: envergadura em x local, corda em −y local, espessura em z local */
function placa(corda0: number, corda1: number, env: number, flecha: number, esp: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(env, -flecha); s.lineTo(env, -flecha - corda1); s.lineTo(0, -corda0); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: true, bevelThickness: esp * 0.45, bevelSize: esp * 0.4, bevelSegments: 3 });
  g.translate(0, 0, -esp / 2);
  return g;
}
/** matriz que leva (envergadura, corda, espessura) locais para os eixos do mundo, e põe a raiz em p */
const base = (env: THREE.Vector3, corda: THREE.Vector3, esp: THREE.Vector3, p: [number, number, number]) =>
  new THREE.Matrix4().makeBasis(env, corda, esp).setPosition(...p);

export const Aviao3D: React.FC<{ pos?: [number, number, number]; rot?: [number, number, number]; escala?: number }> = ({ pos = [0, 0, 0], rot = [0, 0, 0], escala = 1 }) => {
  const tex = useMemo(pintura, []);
  const fus = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 120; i++) { const y = -L / 2 + (i / 120) * L; pts.push(new THREE.Vector2(Math.max(0.001, raio(y)), y)); }
    return new THREE.LatheGeometry(pts, 128);
  }, []);
  const mat = useMemo(() => ({
    corpo: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.36, metalness: 0.12 }),
    asa: new THREE.MeshStandardMaterial({ color: "#E6DCD3", roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide }),
    coral: new THREE.MeshStandardMaterial({ color: "#E7704B", roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }),
    motor: new THREE.MeshStandardMaterial({ color: "#D6CCC3", roughness: 0.32, metalness: 0.35 }),
    boca: new THREE.MeshStandardMaterial({ color: "#2A2330", roughness: 0.6 }),
  }), [tex]);
  const geos = useMemo(() => ({
    asa: placa(1.4, 0.42, 2.75, 1.3, 0.08),
    estab: placa(0.66, 0.25, 1.1, 0.6, 0.05),
    deriva: placa(1.15, 0.42, 1.3, 1.05, 0.06),
    motor: new THREE.CylinderGeometry(0.21, 0.18, 0.8, 40),
    boca: new THREE.CircleGeometry(0.18, 32),
  }), []);
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const M = useMemo(() => ({
    asaD: base(Z, X, Y, [0.75, -0.24, 0]),
    asaE: base(Z.clone().negate(), X, Y, [0.75, -0.24, 0]),
    estD: base(Z, X, Y, [-L / 2 + 0.95, 0.12, 0]),
    estE: base(Z.clone().negate(), X, Y, [-L / 2 + 0.95, 0.12, 0]),
    deriva: base(Y, X, Z, [-L / 2 + 1.45, 0.3, 0]),
  }), []);
  return (
    <group position={pos} rotation={rot} scale={escala}>
      {/* fuselagem: Lathe em Y girada para o nariz apontar para +X */}
      <mesh geometry={fus} material={mat.corpo} rotation={[0, 0, -Math.PI / 2]} />
      <mesh geometry={geos.asa} material={mat.asa} matrix={M.asaD} matrixAutoUpdate={false} />
      <mesh geometry={geos.asa} material={mat.asa} matrix={M.asaE} matrixAutoUpdate={false} />
      <mesh geometry={geos.estab} material={mat.asa} matrix={M.estD} matrixAutoUpdate={false} />
      <mesh geometry={geos.estab} material={mat.asa} matrix={M.estE} matrixAutoUpdate={false} />
      <mesh geometry={geos.deriva} material={mat.coral} matrix={M.deriva} matrixAutoUpdate={false} />
      {[1, -1].map((lado) => (
        <group key={lado} position={[0.55, -0.5, lado * 1.1]}>
          <mesh geometry={geos.motor} material={mat.motor} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={geos.boca} material={mat.boca} position={[0.405, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        </group>
      ))}
    </group>
  );
};
