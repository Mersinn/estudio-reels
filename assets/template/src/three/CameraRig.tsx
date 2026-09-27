import React from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Câmera controlada pelo quadro: posição, alvo, fov e rolagem vêm do componente pai. */
export const CameraRig: React.FC<{
  pos: [number, number, number];
  target: [number, number, number];
  fov?: number;
  roll?: number;
  up?: [number, number, number]; // obrigatório em vista de cima (olhando reto para baixo)
}> = ({ pos, target, fov = 40, roll = 0, up }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...pos);
  if (up) cam.up.set(...up);
  else cam.up.set(Math.sin(roll), Math.cos(roll), 0);
  cam.lookAt(new THREE.Vector3(...target));
  if (cam.fov !== fov) {
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }
  cam.near = 0.05;
  cam.far = 200;
  return null;
};
