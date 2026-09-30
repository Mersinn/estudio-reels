// A nossa Vênus (a da logo, em relevo 2.5D) "com silicone": prancha técnica. O implante aparece por dentro do
// mármore como num raio X, a caneta cirúrgica o circunda e a câmera trava nele e empurra em linha reta até o alvo.
// Também serve às cenas da cápsula, do espaço e do gás (mesmo corpo do começo ao fim).
import React from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { H, W } from "../brand/brand";
import { CameraRig } from "../three/CameraRig";
import { IMP_UV2, venusPoint, VenusFx, VenusRelief } from "../sistema-venus/VenusRelief";
import { lerp } from "./kit";

export const ALVO = venusPoint(IMP_UV2.x, IMP_UV2.y, [0, 0, 0], 0.18); // o implante na Vênus com silicone
const BUSTO = new THREE.Vector3(0.12, -0.05, 0);

/** push 0 = busto enquadrado · 1 = a câmera encostada no implante (a lente abre ali) */
export const VenusImplante: React.FC<{ fx: Partial<VenusFx>; push: number; orbita?: number }> = ({ fx, push, orbita = 0 }) => {
  const k = Math.min(1, push * 1.6); // o alvo centraliza antes de a câmera andar
  const tgt = BUSTO.clone().lerp(ALVO, k);
  const dist = lerp(4.6, 0.55, Math.pow(push, 1.35));
  const pos: [number, number, number] = [tgt.x + orbita * 0.5 * (1 - push), tgt.y + 0.05 * (1 - push), tgt.z + dist];
  const full: VenusFx = { burn: 0, ember: 0, pain: 0, cream: 0, creamOff: 0, heal: 0, time: 0, keyInt: 1, ...fx };
  return (
    <ThreeCanvas width={W} height={H}>
      <CameraRig pos={pos} target={[tgt.x, tgt.y, tgt.z]} fov={34} />
      <VenusRelief fx={full} keyDir={new THREE.Vector3(-0.35, 0.55, 0.8)} />
    </ThreeCanvas>
  );
};
