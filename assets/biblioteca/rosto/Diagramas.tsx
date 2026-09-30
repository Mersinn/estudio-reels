// Diagramas desenhados para a mesa do comentarista (o desenho também é afirmação médica: conferir no DOSSIE).
//  · NarizPerfil: o nariz em perfil em três camadas (osso nasal em cima, cartilagens embaixo, envelope de pele por
//    cima). Com `reduz` o esqueleto baixa; a pele grossa fica (não encolhe junto): abre-se o espaço morto acima da
//    ponta (`espaco`, dourado); a cicatriz o preenche (`cicatriz`, hachura coral) e empurra a pele: o bico (`bico`).
//    Pollybeak de partes moles (Conrad 2003; Aldosari 2023).
//  · OlhoFecha: pálpebra que fecha × lagoftalmo (tirou pele demais e o olho não fecha).
import React from "react";
import { P } from "./kit";

type Pt = [number, number];
const L = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const bump = (t: number, c: number, w: number) => Math.exp(-(((t - c) / w) ** 2));
const path = (pts: Pt[]) => "M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L");

// perfil de referência (caixa 620×720, virado para a direita)
const NAS: Pt = [150, 110], PONTA: Pt = [470, 470];
function dorso(t: number): { p: Pt; n: Pt } {
  // linha do dorso levemente convexa, da raiz (násio) à ponta
  const p = L(NAS, PONTA, t);
  const dx = PONTA[0] - NAS[0], dy = PONTA[1] - NAS[1];
  const len = Math.hypot(dx, dy);
  const n: Pt = [dy / len, -dx / len]; // normal para fora (para cima/direita)
  const conv = 18 * Math.sin(Math.PI * t) - 26 * bump(t, 0.95, 0.07); // arco suave; a ponta arredonda
  return { p: [p[0] + n[0] * conv, p[1] + n[1] * conv], n };
}

export const NarizPerfil: React.FC<{ x: number; y: number; esc?: number; osso: number; cart: number; pele: number; reduz: number; espaco: number; cicatriz: number; bico: number; rotulos?: number }> = ({
  x, y, esc = 1, osso, cart, pele, reduz, espaco, cicatriz, bico, rotulos = 1,
}) => {
  const N = 60;
  const ts = Array.from({ length: N + 1 }, (_, i) => i / N);
  const esp = (t: number) => 26 + 16 * bump(t, 0.68, 0.18); // pele mais grossa acima da ponta (supratip)
  const queda = (t: number) => reduz * 46 * bump(t, 0.62, 0.2); // o esqueleto baixa (redução do dorso)
  const inchar = (t: number) => bico * 30 * bump(t, 0.64, 0.14); // a cicatriz empurra a pele: o bico
  const fora = ts.map((t) => { const { p, n } = dorso(t); return [p[0] + n[0] * inchar(t), p[1] + n[1] * inchar(t)] as Pt; });
  const dentro = ts.map((t) => { const { p, n } = dorso(t); const e = esp(t); return [p[0] - n[0] * e, p[1] - n[1] * e] as Pt; });
  const esq = ts.map((t) => { const { p, n } = dorso(t); const e = esp(t) + queda(t); return [p[0] - n[0] * e, p[1] - n[1] * e] as Pt; });
  // a base do nariz: da ponta à columela e ao lábio (fixa)
  // osso nasal: do násio até ~40% do dorso; cartilagem: do fim do osso até a ponta
  const idxOsso = Math.round(N * 0.4);
  const faixa = (a: number, b: number, off: number) => {
    const topo = esq.slice(a, b + 1);
    const fundo = topo.map((p, i) => { const { n } = dorso(ts[a + i]); return [p[0] - n[0] * off, p[1] - n[1] * off] as Pt; }).reverse();
    return path([...topo, ...fundo]) + "Z";
  };
  const espacoPoly = path([...dentro.slice(20, 56), ...esq.slice(20, 56).reverse()]) + "Z";
  const envelope = path([...fora, ...dentro.slice().reverse()]) + "Z";
  // o perfil inteiro (testa → násio → dorso → ponta → columela → lábios → queixo) e a massa do rosto à esquerda
  const perfil: Pt[] = [[60, -60], [110, -40], [132, 30], [140, 90], ...fora, [455, 505], [420, 528], [372, 540], [345, 552], [352, 600], [378, 630], [360, 652], [352, 680], [372, 715], [360, 770], [320, 830], [250, 850]];
  const rosto = path([...perfil, [-40, 850], [-40, -60]]) + "Z";
  return (
    <svg width={640 * esc} height={900 * esc} viewBox="-40 -60 640 900" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <defs>
        <pattern id="hachuraCic" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="12" height="12" fill="rgba(238,133,96,.25)" />
          <line x1="0" y1="0" x2="0" y2="12" stroke={P.coralLo} strokeWidth={5} />
        </pattern>
        <pattern id="pontosOsso" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#F4ECDD" />
          <circle cx="7" cy="7" r="2.2" fill="#CDBFA6" />
        </pattern>
        <linearGradient id="massaRosto" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F6D8C6" stopOpacity={0} />
          <stop offset="0.45" stopColor="#F6D8C6" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      {/* o rosto em perfil (massa de pele clara) e o contorno */}
      <path d={rosto} fill="url(#massaRosto)" />
      <path d={path(perfil)} fill="none" stroke={P.ink2} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      {/* a narina */}
      <ellipse cx={400} cy={498} rx={34} ry={14} fill="#C98567" transform="rotate(-18 400 498)" opacity={pele} />
      {/* osso nasal */}
      <path d={faixa(0, idxOsso, 30)} fill="url(#pontosOsso)" stroke={P.ink2} strokeWidth={4} opacity={osso} />
      {/* cartilagens (lateral superior e alar) */}
      <path d={faixa(idxOsso, N - 2, 24)} fill="#EAD9B0" stroke={P.ink2} strokeWidth={4} opacity={cart} />
      {/* o espaço morto acima da ponta, depois a cicatriz */}
      {espaco > 0 && <path d={espacoPoly} fill="#F2C75C" opacity={0.85 * espaco * (1 - cicatriz * 0.7)} />}
      {cicatriz > 0 && <path d={espacoPoly} fill="url(#hachuraCic)" opacity={cicatriz} />}
      {/* o envelope de pele (grosso) */}
      <path d={envelope} fill="rgba(238,133,96,.55)" stroke={P.coralLo} strokeWidth={4} opacity={pele} />
      <path d={path(fora)} fill="none" stroke={P.ink} strokeWidth={7} strokeLinecap="round" opacity={pele} />
      {rotulos > 0 && (
        <g fontFamily="Mono" fontWeight={600} fontSize={22} fill={P.ink2} opacity={rotulos} letterSpacing="2">
          {osso > 0.5 && <text x={20} y={250}>OSSO NASAL</text>}
          {osso > 0.5 && <line x1={180} y1={242} x2={dorso(0.22).p[0] - 20} y2={dorso(0.22).p[1] + 20} stroke={P.ink2} strokeWidth={3} />}
          {cart > 0.5 && <text x={120} y={430}>CARTILAGEM</text>}
          {cart > 0.5 && <line x1={270} y1={420} x2={dorso(0.62).p[0] - 40} y2={dorso(0.62).p[1] + 30} stroke={P.ink2} strokeWidth={3} />}
          {pele > 0.5 && <text x={470} y={250}>PELE</text>}
          {pele > 0.5 && <line x1={500} y1={260} x2={dorso(0.55).p[0] + 12} y2={dorso(0.55).p[1] - 8} stroke={P.ink2} strokeWidth={3} />}
        </g>
      )}
    </svg>
  );
};

/** a pálpebra que fecha × o lagoftalmo: dois olhos fechando lado a lado */
export const OlhoFecha: React.FC<{ x: number; y: number; esc?: number; p: number }> = ({ x, y, esc = 1, p }) => {
  const olho = (cx: number, fim: number) => {
    // a margem da pálpebra desce de aberta (−45) até `fim`: 40 fecha o olho; 8 para antes (fresta: lagoftalmo)
    const borda = -45 + (fim + 45) * p;
    return (
      <g transform={`translate(${cx},0)`}>
        <path d="M-120,0 Q0,-80 120,0 Q0,80 -120,0Z" fill="#FFF8F0" stroke={P.ink} strokeWidth={5} />
        <circle cx={0} cy={0} r={42} fill={P.terra} />
        <circle cx={0} cy={0} r={18} fill={P.ink} />
        <path d={`M-124,0 Q0,-86 124,0 Q0,${2 * borda} -124,0 Z`} fill="#F3C3AC" stroke={P.coralLo} strokeWidth={5} />
      </g>
    );
  };
  return (
    <svg width={760 * esc} height={260 * esc} viewBox="-380 -110 760 260" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      {olho(-190, 40)}
      {olho(190, 8)}
      <text x={-190} y={130} textAnchor="middle" fontFamily="Mono" fontWeight={600} fontSize={24} fill={P.ink2}>FECHA</text>
      <text x={190} y={130} textAnchor="middle" fontFamily="Mono" fontWeight={600} fontSize={24} fill={P.coralLo}>LAGOFTALMO</text>
    </svg>
  );
};
