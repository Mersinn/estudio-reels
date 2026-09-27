// Posterização "no idioma da gravura": a luz vira N tons de uma paleta, com borda orgânica (manchas).
// Foi o que fez objetos 3D procedurais deixarem de parecer "3D genérico" e passarem a parecer da marca.
// Uso: inclua POSTER_GLSL no fragment shader, passe uniform vec3 uPal[5] e chame poster(tom, uv).
import * as THREE from "three";

export const POSTER_GLSL = /* glsl */ `
uniform vec3 uPal[5];
vec3 poster(float x, vec2 p){
  x += (fbm(p * 9.0) - 0.5) * 0.16;          // manchas orgânicas nas fronteiras dos tons
  float t = clamp(x, 0.0, 0.999) * 5.0;
  float i = floor(t); float f = fract(t);
  float k = smoothstep(0.93, 1.0, f);         // borda quase dura, sem serrilhado
  int a = int(i); int b = min(a + 1, 4);
  vec3 ca = uPal[0], cb = uPal[0];
  for(int j = 0; j < 5; j++){ if(j == a) ca = uPal[j]; if(j == b) cb = uPal[j]; }
  return mix(ca, cb, k);
}`;

/** paleta de 5 tons (sombra → realce) como uniform */
export const palette = (hexes: [string, string, string, string, string]) => ({ value: hexes.map((h) => new THREE.Color(h)) });
