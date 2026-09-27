import * as THREE from "three";
import { H, W } from "../brand/brand";

export type Cam = { pos: [number, number, number]; target: [number, number, number]; fov: number; roll?: number };

/** projeta um ponto 3D para pixels do quadro, com a mesma câmera do CameraRig (para rótulos 2D presos ao 3D) */
export function project(cam: Cam, p: THREE.Vector3 | [number, number, number]): [number, number] {
  const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.05, 200);
  c.position.set(...cam.pos);
  const roll = cam.roll ?? 0;
  c.up.set(Math.sin(roll), Math.cos(roll), 0);
  c.lookAt(new THREE.Vector3(...cam.target));
  c.updateMatrixWorld();
  const v = Array.isArray(p) ? new THREE.Vector3(...p) : p.clone();
  v.project(c);
  return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
}

export const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** rotação (Euler) que aponta o focinho do peixe (+X local) para a direção d */
export function heading(d: [number, number, number], bank = 0): THREE.EulerTuple {
  const [x, y, z] = d;
  const yaw = Math.atan2(-z, x);
  const pitch = Math.atan2(y, Math.hypot(x, z));
  // ordem YZX: primeiro inclina no próprio eixo (bank), depois arfagem, depois rumo
  return [bank, yaw, pitch, "YZX"];
}
