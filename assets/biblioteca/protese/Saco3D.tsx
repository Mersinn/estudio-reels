// O saco de salgadinho em 3D (Three.js): incha com a pressão da cabine, treme no limite e EXPLODE:
// a frente rasga em duas pelo meio, um sopro de ar sai, os salgadinhos voam para cima e os pedaços caem.
// Tudo é função do quadro. Nunca é citado na fala: é a imagem que faz a pergunta.
import React, { useMemo } from "react";
import * as THREE from "three";

const NX = 48, NY = 64, LARG = 1, ALT = 1.35;

function rotulo(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 700;
  const x = c.getContext("2d")!;
  const gr = x.createLinearGradient(0, 0, 0, 700);
  gr.addColorStop(0, "#F07A4E"); gr.addColorStop(1, "#C8492C");
  x.fillStyle = gr; x.fillRect(0, 0, 512, 700);
  x.fillStyle = "#D9D2CC";
  x.fillRect(0, 0, 512, 46); x.fillRect(0, 654, 512, 46);
  x.fillStyle = "#B9B0AA";
  for (let i = 0; i < 512; i += 16) { x.fillRect(i, 0, 8, 46); x.fillRect(i, 654, 8, 46); }
  x.fillStyle = "#FCEBDD";
  x.beginPath(); x.moveTo(0, 250);
  for (let i = 0; i <= 512; i += 8) x.lineTo(i, 250 + Math.sin(i / 60) * 22);
  x.lineTo(512, 390); for (let i = 512; i >= 0; i -= 8) x.lineTo(i, 390 + Math.sin(i / 60 + 1) * 18);
  x.closePath(); x.fill();
  x.fillStyle = "#3A160C";
  x.font = "900 128px Mont, Montserrat, 'Arial Black', sans-serif";
  x.textAlign = "center"; x.fillText("CROC", 256, 360);
  x.font = "italic 800 40px Playfair, Georgia, serif";
  x.fillStyle = "#FCEBDD"; x.fillText("sabor original", 256, 200);
  const chip = (cx: number, cy: number, r: number, a: number) => {
    x.save(); x.translate(cx, cy); x.rotate(a);
    x.fillStyle = "#F4C25A"; x.beginPath(); x.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#E0A23F"; x.beginPath(); x.ellipse(r * 0.15, r * 0.1, r * 0.55, r * 0.35, 0.3, 0, Math.PI * 2); x.fill();
    x.restore();
  };
  chip(170, 520, 70, 0.4); chip(310, 540, 80, -0.3); chip(240, 470, 56, 1.2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const rnd = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** deforma uma face (ou meia face) do travesseiro. x0 = deslocamento da meia face no eixo x do saco inteiro */
function deforma(g: THREE.PlaneGeometry, base: Float32Array, lado: number, inf: number, x0: number, murcha: number) {
  const p = g.attributes.position.array as Float32Array;
  for (let i = 0; i < p.length; i += 3) {
    const xl = base[i], y0 = base[i + 1];
    const xs = xl + x0;
    const u = (xs / LARG) * 2, v = (y0 / ALT) * 2;
    const selo = Math.abs(v) > 0.87 ? 0 : 1;
    const perfil = Math.pow(Math.max(0, 1 - u * u), 0.55) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(v) / 0.87, 2)), 0.5) * selo;
    const amarrota = (Math.sin(u * 17 + v * 5) * 0.5 + Math.sin(v * 23 - u * 7) * 0.5) * (0.012 * (1 - inf * 0.85) + 0.018 * murcha);
    const cheio = inf * (1 - murcha * 0.85);
    p[i] = xl * (1 - 0.1 * cheio * perfil);
    p[i + 1] = y0;
    p[i + 2] = lado * (0.05 + 0.3 * cheio) * perfil + amarrota * selo;
  }
  g.attributes.position.needsUpdate = true;
  g.computeVertexNormals();
}

/** inf: 0 (murcho) → 1 (tenso) · estouro: quadros desde a explosão (negativo = ainda inteiro) */
export const Saco3D: React.FC<{ inf: number; estouro: number; pos?: [number, number, number]; rot?: [number, number, number]; escala?: number }> = ({
  inf, estouro, pos = [0, 0, 0], rot = [0, 0, 0], escala = 1,
}) => {
  const tex = useMemo(rotulo, []);
  // frente em duas metades (rasga pelo meio) + verso
  const geos = useMemo(
    () => ({
      fe: new THREE.PlaneGeometry(LARG / 2, ALT, NX / 2, NY),
      fd: new THREE.PlaneGeometry(LARG / 2, ALT, NX / 2, NY),
      verso: new THREE.PlaneGeometry(LARG, ALT, NX, NY),
      frente: new THREE.PlaneGeometry(LARG, ALT, NX, NY),
    }),
    [],
  );
  const baseMeia = useMemo(() => Float32Array.from(geos.fe.attributes.position.array as Float32Array), [geos]);
  const baseVerso = useMemo(() => Float32Array.from(geos.verso.attributes.position.array as Float32Array), [geos]);
  const uvs = useMemo(() => {
    // cada metade mostra a sua metade do rótulo
    const fix = (g: THREE.PlaneGeometry, off: number) => {
      const uv = g.attributes.uv.array as Float32Array;
      for (let i = 0; i < uv.length; i += 2) uv[i] = uv[i] * 0.5 + off;
      g.attributes.uv.needsUpdate = true;
    };
    fix(geos.fe, 0); fix(geos.fd, 0.5);
    return true;
  }, [geos]);
  const mats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ map: tex, metalness: 0.35, roughness: 0.32, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ color: "#CFC7C1", metalness: 0.3, roughness: 0.55, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ color: "#FFF6EE", transparent: true, depthWrite: false }),
    ],
    [tex],
  );
  const t = Math.max(0, estouro) / 30; // segundos desde a explosão
  const estourou = estouro >= 0;
  const murcha = estourou ? Math.min(1, t / 0.25) : 0;
  const cheio = estourou ? 1 : inf;
  deforma(geos.fe, baseMeia, 1, cheio, -LARG / 4, murcha);
  deforma(geos.fd, baseMeia, 1, cheio, LARG / 4, murcha);
  deforma(geos.verso, baseVerso, -1, cheio, 0, murcha);
  if (!estourou) deforma(geos.frente, baseVerso, 1, cheio, 0, 0);
  void uvs;
  // no limite: incha além do normal e treme
  const limite = !estourou ? Math.max(0, inf - 0.9) * 10 : 0;
  const sobre = 1 + 0.07 * limite;
  // as metades da frente se abrem e voam (a dobradiça é a borda de fora)
  const abre = estourou ? 1 - Math.exp(-t * 9) : 0;
  const voa = (lado: number) => ({
    position: [lado * (LARG / 4 + t * 1.6), t * 1.1 - 2.2 * t * t, 0.15 + t * 1.4] as [number, number, number],
    rotation: [-abre * 0.6, lado * abre * 1.9, lado * (abre * 0.5 + t * 2)] as [number, number, number],
  });
  const puff = estourou && t < 0.4 ? t / 0.4 : -1;
  return (
    <group position={pos} rotation={rot} scale={escala}>
      <group scale={[sobre, sobre, sobre]}>
        {/* inteiro: a frente é uma peça só (sem costura); na explosão, rasga em duas metades */}
        {!estourou && <mesh geometry={geos.frente} material={mats[0]} />}
        {estourou && <mesh geometry={geos.fe} material={mats[0]} {...voa(-1)} />}
        {estourou && <mesh geometry={geos.fd} material={mats[0]} {...voa(1)} />}
        {(!estourou || t < 0.1) && (
          <mesh geometry={geos.verso} material={mats[1]} position={estourou ? [0, -1.2 * t - 3 * t * t, -t * 1.5] : [0, 0, 0]} rotation={estourou ? [t * 3, 0, t * 1.2] : [0, 0, 0]} scale={estourou ? 1 - t * 1.2 : 1} />
        )}
      </group>
      {/* o sopro de ar */}
      {puff >= 0 && (
        <mesh position={[0, 0.1, 0.3]} scale={0.25 + puff * 0.9} material={mats[2]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial attach="material" color="#FFF6EE" transparent opacity={0.3 * (1 - puff) * (1 - puff)} depthWrite={false} />
        </mesh>
      )}
      {estourou && t < 2.5 && (
        <>
          {/* tiras de plástico rasgado */}
          {Array.from({ length: 14 }, (_, i) => {
            const a = rnd(i, 1) * Math.PI * 2, vel = 1.8 + rnd(i, 2) * 2.4;
            const x = Math.cos(a) * vel * t, y = Math.sin(a) * vel * t * 0.8 + 1.4 * t - 2.9 * t * t, z = 0.3 + (rnd(i, 3) - 0.2) * vel * t;
            const s = 0.06 + rnd(i, 4) * 0.12;
            return (
              <mesh key={`p${i}`} position={[x, y, z]} rotation={[t * (4 + rnd(i, 5) * 8), t * (3 + rnd(i, 6) * 6), a]} scale={[s, s * (1.5 + rnd(i, 7) * 2), 1]} material={mats[i % 3 === 0 ? 1 : 0]}>
                <planeGeometry args={[1, 1]} />
              </mesh>
            );
          })}
          {/* salgadinhos: saem pela boca rasgada, para cima, e caem */}
          {Array.from({ length: 44 }, (_, i) => {
            const a = Math.PI / 2 + (rnd(i, 11) - 0.5) * 2.6, vel = 1.6 + rnd(i, 12) * 2.8;
            const x = Math.cos(a) * vel * t, y = 0.2 + Math.sin(a) * vel * t - 4.2 * t * t, z = 0.4 + (rnd(i, 13) - 0.3) * vel * t;
            const s = 0.045 + rnd(i, 14) * 0.035;
            return (
              <mesh key={`c${i}`} position={[x, y, z]} rotation={[t * 9 * rnd(i, 15), t * 7, rnd(i, 16) * 3]} scale={[s, s * 0.22, s * 0.8]}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color={i % 4 === 0 ? "#E0A23F" : "#F4C25A"} roughness={0.7} />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
};
