// Trechos GLSL compartilhados. Tudo é função pura de (posição, uTime):
// nada acumula estado entre quadros, então o render paralelo do Remotion é idêntico.

export const NOISE = /* glsl */ `
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), u.x), mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float a = .5, s = 0.; for(int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
// Voronoi: x = distância à célula mais próxima, y = distância à borda (para fissuras/cáusticas)
vec2 voronoi(vec2 p){
  vec2 n = floor(p), f = fract(p), mg, mr; float md = 8.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 g = vec2(float(i), float(j)); vec2 o = hash22(n + g); vec2 r = g + o - f; float d = dot(r, r);
    if(d < md){ md = d; mr = r; mg = g; }
  }
  float me = 8.;
  for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++){
    vec2 g = mg + vec2(float(i), float(j)); vec2 o = hash22(n + g); vec2 r = g + o - f;
    if(dot(mr - r, mr - r) > .00001) me = min(me, dot(.5 * (mr + r), normalize(r - mr)));
  }
  return vec2(sqrt(md), me);
}
`;

// Nado da tilápia: onda lateral que cresce para a cauda (x vai de +1 no focinho a −1,25 na cauda)
export const SWIM = /* glsl */ `
uniform float uTime;
uniform float uSwim;   // amplitude geral (0 = parado)
uniform float uFreq;   // batidas por segundo
float swimU(float x){ return clamp((1.0 - x) / 2.25, 0.0, 1.0); }
vec3 swim(vec3 p){
  float u = swimU(p.x);
  float amp = uSwim * (0.018 + 0.16 * u * u);
  float ph = 6.2831 * (uFreq * uTime) - u * 5.2;
  p.z += amp * sin(ph);
  // a cabeça acompanha levemente (yaw), o que tira o aspecto de "bandeira"
  p.z += uSwim * 0.02 * sin(ph + 1.6) * (1.0 - u);
  return p;
}
`;
