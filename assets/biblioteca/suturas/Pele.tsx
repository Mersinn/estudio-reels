// <Pele/> · o bloco de pele em corte, em 2.5D (CSS 3D): face da frente = corte perpendicular à ferida
// (camadas + trajeto do fio), face de cima = superfície (linha da ferida, furos, nós).
// Tudo é função dos controles recebidos (a cena calcula a partir das palavras da narração).
//
// Medicina (docs/DOSSIE.md):
//  simples   agulha a 90°, mordida mais larga no fundo que na superfície → borda everte ao apertar
//  donati    longe-longe fundo (abaixo da derme) + perto-perto raso (derme superior), mesmo plano
//            perpendicular à ferida; 4 furos por ponto; nó de um lado
//  intra     mordidas horizontais na derme, alternando os lados, no mesmo plano; nenhum furo no meio
import React from "react";
import { AbsoluteFill } from "remotion";
import { Agulha, curva, d, lerp, P, Pt, trecho } from "./kit";
import { F } from "../brand/brand";

export type Tipo = "simples" | "donati" | "intra";
export type PeleCtl = {
  tipo: Tipo;
  ghost?: number; // 0..1 trajeto fantasma dourado
  agulha?: number; // 0..1 agulha + fio percorrendo o trajeto
  aperto?: number; // 0..1 nó apertando: fecha a ferida e everte a borda
  extras?: number; // 0..3 pontos já dados atrás (face de cima)
  rx?: number; // câmera: inclinação (graus, negativo = vendo de cima)
  ry?: number;
  escala?: number;
  y?: number; // centro vertical do bloco na tela
  raioX?: number; // 0..1 superfície translúcida (intradérmico)
  falha?: number; // 0..1 um dos pontos de trás arrebenta (os outros seguram)
  camadas?: number; // 0..1 nomes das camadas
  anot?: Partial<Record<"angulo" | "largura" | "eversao" | "longe" | "perto" | "furos" | "tensao" | "derme", number>>;
};

const BW = 900, BD = 600, EPI = 30, DER = 190, HIP = 300, BH = EPI + DER + HIP;
const VB = { x: -520, y: -230, w: 1040, h: 230 + BH + 40 };
const G0 = 24; // meia-abertura da ferida na superfície
const g0 = (y: number) => (y < 310 ? G0 * (1 - y / 310) : 0);
const EV: Record<Tipo, number> = { simples: 22, donati: 34, intra: 5 };

/** deforma um ponto da metade esquerda (s=-1) ou direita (s=1): fecha a fenda e levanta a borda */
function def(p: Pt, c: number, ev: number): Pt {
  const [x, y] = p;
  if (Math.abs(x) < 1e-6) return [0, y - ev * Math.max(0, 1 - y / 260) * c];
  const s = Math.sign(x);
  const g = g0(y);
  const dist = Math.max(0, Math.abs(x) - g);
  const lift = ev * c * Math.exp(-dist / 70) * Math.max(0, 1 - y / 260);
  return [s * Math.max(0, Math.abs(x) - c * g), y - lift];
}
const defAll = (pts: Pt[], c: number, ev: number) => pts.map((p) => def(p, c, ev));

/** contorno de uma camada [d1,d2] da metade s, amostrado para deformar bem */
function camada(s: number, d1: number, d2: number): Pt[] {
  const top: Pt[] = [], wall: Pt[] = [], bot: Pt[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const x = lerp(450, g0(d1) + 0.01, i / n);
    top.push([s * x, d1]);
  }
  for (let i = 0; i <= 12; i++) {
    const y = lerp(d1, d2, i / 12);
    wall.push([s * (g0(y) + 0.01), y]);
  }
  for (let i = 0; i <= n; i++) bot.push([s * lerp(g0(d2) + 0.01, 450, i / n), d2]);
  return [...top, ...wall, ...bot];
}

// ── trajetos (coordenadas da face da frente, superfície em y=0) ─────────────
const TRAJ: Record<Exclude<Tipo, "intra">, Pt[]> = {
  simples: [
    [-150, -170], [-96, -60], [-60, 0], [-80, 72], [-94, 160], [-72, 238], [0, 272], [72, 238], [94, 160], [80, 72], [60, 0], [100, -70], [160, -160],
  ],
  donati: [
    [-230, -170], [-176, -60], [-150, 0], [-164, 110], [-146, 236], [-84, 300], [0, 318], [84, 300], [146, 236], [164, 110], [150, 0],
    [124, -62], [70, -66], [34, 0], [30, 44], [0, 62], [-30, 44], [-34, 0], [-66, -70], [-116, -150],
  ],
};
const FUROS: Record<Tipo, number[]> = { simples: [-60, 60], donati: [-150, -34, 34, 150], intra: [] };

const Fio: React.FC<{ pts: Pt[]; w?: number }> = ({ pts, w = 7 }) => (
  <>
    <path d={d(pts)} fill="none" stroke={P.fio} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d(pts)} fill="none" stroke={P.fioLuz} strokeWidth={w * 0.28} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} transform="translate(-1,-1.5)" />
  </>
);

const txt = (size: number, color: string, weight = 600): React.CSSProperties => ({
  fontFamily: F.tecnica, fontSize: size, fontWeight: weight, letterSpacing: "0.1em", fill: color,
});

// ── face da frente ────────────────────────────────────────────────────────
const Frente: React.FC<{ c: PeleCtl }> = ({ c }) => {
  const ap = c.aperto ?? 0;
  const ev = EV[c.tipo];
  const cam = c.camadas ?? 0;
  const an = c.anot ?? {};
  const halves = [-1, 1].map((s) => ({
    epi: defAll(camada(s, 0, EPI), ap, ev),
    der: defAll(camada(s, EPI, EPI + DER), ap, ev),
    hip: defAll(camada(s, EPI + DER, BH), ap, ev),
  }));
  // fibras de colágeno e lóbulos de gordura (deformam junto)
  const fibras: Pt[][] = [];
  for (let k = 0; k < 7; k++) {
    for (const s of [-1, 1]) {
      const y0 = EPI + 24 + k * 24;
      const pts: Pt[] = [];
      for (let i = 0; i <= 26; i++) {
        const x = lerp(440, g0(y0) + 14, i / 26);
        pts.push([s * x, y0 + Math.sin(x / 34 + k * 1.7) * 6]);
      }
      fibras.push(defAll(pts, ap, ev));
    }
  }
  const lobs: { p: Pt; r: number }[] = [];
  for (let k = 0; k < 34; k++) {
    const s = k % 2 ? 1 : -1;
    const x = 40 + ((k * 97) % 400);
    const y = EPI + DER + 30 + ((k * 53) % 250);
    if (x < g0(y) + 30) continue;
    lobs.push({ p: def([s * x, y], ap, ev), r: 26 + ((k * 13) % 16) });
  }
  // trajeto do fio
  let fio: React.ReactNode = null;
  if (c.tipo !== "intra") {
    const base = TRAJ[c.tipo];
    const raw = curva(base, 12);
    // cada ponto do trajeto acompanha a metade em que está
    const pts = defAll(raw, ap, ev);
    const gh = c.ghost ?? 0;
    const ag = c.agulha ?? 0;
    const tr = trecho(pts, ag);
    const ghostPts = trecho(pts, gh).pts;
    // depois de passar, o fio se assenta: as pontas soltas viram o nó na superfície
    const knotX = c.tipo === "simples" ? -16 : -88;
    const assent = ap;
    const fioPts = ag >= 1 && assent > 0
      ? (() => {
          const inside = pts.filter((p) => p[1] >= -2 || true);
          // corta as pontas acima da superfície e liga ao nó conforme aperta
          const first = pts.findIndex((p) => p[1] >= -1);
          let last = pts.length - 1;
          while (last > 0 && pts[last][1] < -1) last--;
          const mid = pts.slice(first, last + 1).map((p): Pt => (p[1] < 0 ? [p[0], lerp(p[1], -7, assent)] : p));
          const a = def(c.tipo === "simples" ? [60, 0] : [-34, 0], ap, ev);
          const b = def(c.tipo === "simples" ? [-60, 0] : [-150, 0], ap, ev);
          const k = def([knotX, 0], ap, ev);
          const lift = lerp(-70, -14, assent);
          const bridge = curva([a, [lerp(a[0], k[0], 0.5), lift], [k[0], k[1] - 12], [lerp(k[0], b[0], 0.5), lift * 0.7], b], 10);
          void inside;
          return { mid, bridge, k };
        })()
      : null;
    fio = (
      <g>
        {gh > 0 && <path d={d(ghostPts)} fill="none" stroke={P.gold} strokeWidth={4} strokeDasharray="12 12" strokeLinecap="round" opacity={0.95} />}
        {fioPts ? (
          <>
            <Fio pts={fioPts.mid} />
            <Fio pts={fioPts.bridge} />
            {/* nó e pontas cortadas */}
            <g transform={`translate(${fioPts.k[0]},${fioPts.k[1] - 14}) scale(${0.4 + 0.6 * assent})`}>
              <ellipse cx={0} cy={0} rx={15} ry={10} fill={P.fio} />
              <path d="M-4,-4 L-30,-34 M5,-5 L26,-36" stroke={P.fio} strokeWidth={6} strokeLinecap="round" />
              <ellipse cx={-4} cy={-3} rx={5} ry={2.4} fill={P.fioLuz} opacity={0.5} />
            </g>
          </>
        ) : (
          ag > 0 && (
            <>
              <Fio pts={tr.pts} />
              {ag < 1 && <Agulha x={tr.head[0]} y={tr.head[1]} ang={tr.ang} r={46} />}
            </>
          )
        )}
      </g>
    );
  } else {
    // intradérmico no corte: o fio aparece como dois pontinhos no meio da derme, dos dois lados
    const a = def([-62, EPI + 80], ap, ev), b = def([62, EPI + 80], ap, ev);
    const on = (c.agulha ?? 0) > 0.05 ? 1 : 0;
    fio = (
      <g opacity={on}>
        {[a, b].map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={9} fill={P.fio} />
            <circle cx={p[0] - 2} cy={p[1] - 2} r={3} fill={P.fioLuz} opacity={0.6} />
          </g>
        ))}
      </g>
    );
  }
  const layerPoly = (pts: Pt[], fill: string) => <path d={d(pts) + "Z"} fill={fill} />;
  return (
    <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} width={VB.w} height={VB.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="gDer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F29470" />
          <stop offset="1" stopColor="#E0754F" />
        </linearGradient>
        <linearGradient id="gHip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F9E4C6" />
          <stop offset="1" stopColor="#F1CFA2" />
        </linearGradient>
        {halves.map((h, i) => (
          <clipPath id={`cd${i}`} key={i}>
            <path d={d(h.der) + "Z"} />
          </clipPath>
        ))}
        {halves.map((h, i) => (
          <clipPath id={`ch${i}`} key={i}>
            <path d={d(h.hip) + "Z"} />
          </clipPath>
        ))}
      </defs>
      {/* interior da ferida (a parede do fundo), visto pela fenda */}
      <path d={d([[-G0 - 2, -2], [G0 + 2, -2], [2, 312], [-2, 312]])} fill="#8E3A22" opacity={1 - ap} />
      {halves.map((h, i) => (
        <g key={i}>
          {layerPoly(h.hip, "url(#gHip)")}
          <g clipPath={`url(#ch${i})`}>
            {lobs.filter((l) => Math.sign(l.p[0]) === (i ? 1 : -1)).map((l, k) => (
              <circle key={k} cx={l.p[0]} cy={l.p[1]} r={l.r} fill="#FBEBD3" stroke={P.hipoLinha} strokeWidth={3} />
            ))}
          </g>
          {layerPoly(h.der, "url(#gDer)")}
          <g clipPath={`url(#cd${i})`} opacity={0.85}>
            {fibras.filter((f) => Math.sign(f[0][0]) === (i ? 1 : -1)).map((f, k) => (
              <path key={k} d={d(f)} fill="none" stroke={P.dermeFibra} strokeWidth={4} strokeLinecap="round" />
            ))}
          </g>
          {layerPoly(h.epi, P.epi)}
          {/* estrato córneo: linha fina no topo */}
          <path d={d(h.epi.slice(0, 41))} fill="none" stroke={P.epiTop} strokeWidth={4} />
          {/* parede da ferida (tecido exposto) */}
          <path d={d([...h.epi.slice(41, 54), ...h.der.slice(41, 54), ...h.hip.slice(41, 54)])} fill="none" stroke={P.parede} strokeWidth={5} opacity={1 - ap * 0.7} />
        </g>
      ))}
      {/* sombra de contato na borda inferior */}
      <rect x={-450} y={BH - 6} width={900} height={6} fill="rgba(60,20,10,.18)" />
      {/* nomes das camadas */}
      {cam > 0 && (
        <g opacity={cam}>
          {[
            ["EPIDERME", 16],
            ["DERME", EPI + DER / 2],
            ["HIPODERME", EPI + DER + HIP / 2],
          ].map(([t, y], i) => (
            <g key={i} transform={`translate(${-430},${Number(y)})`}>
              <rect x={0} y={-24} width={String(t).length * 24 + 40} height={48} rx={24} fill={i === 0 ? P.ink : "rgba(42,21,16,.85)"} />
              <text x={20} y={10} style={txt(30, P.cream)}>{t}</text>
            </g>
          ))}
        </g>
      )}
      {fio}
      {/* anotações */}
      {(an.angulo ?? 0) > 0 && (
        <g opacity={an.angulo}>
          <path d={`M-60,0 L-60,${-70 * (an.angulo ?? 0)}`} stroke={P.ink} strokeWidth={3} strokeDasharray="6 6" />
          <path d="M-60,-26 L-34,-26 L-34,0" fill="none" stroke={P.ink} strokeWidth={3} />
          <text x={-150} y={-86} style={txt(30, P.ink, 700)}>90°</text>
        </g>
      )}
      {(an.largura ?? 0) > 0 && (
        <g opacity={an.largura}>
          {/* largura na superfície × no fundo: o frasco */}
          <line x1={-60} y1={-18} x2={60} y2={-18} stroke={P.gold} strokeWidth={5} />
          <line x1={-94} y1={176} x2={94} y2={176} stroke={P.gold} strokeWidth={5} />
          <text x={110} y={-8} style={txt(28, P.ink, 700)}>EM CIMA</text>
          <text x={112} y={190} style={txt(28, P.ink, 700)}>EMBAIXO · MAIS LARGO</text>
        </g>
      )}
      {(an.eversao ?? 0) > 0 && (
        <g opacity={an.eversao}>
          {[-1, 1].map((s) => (
            <path key={s} d={`M${s * 46},${-20} l0,${-46 * (an.eversao ?? 0)} m-12,14 l12,-14 l12,14`} fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>
      )}
      {(an.longe ?? 0) > 0 && (
        <g opacity={an.longe}>
          <path d="M-150,-24 L150,-24" stroke={P.ink} strokeWidth={3} markerEnd="" />
          <text x={-150} y={-40} style={txt(28, P.ink, 700)}>LONGE · 4–8 MM · FUNDO</text>
        </g>
      )}
      {(an.perto ?? 0) > 0 && (
        <g opacity={an.perto}>
          <text x={-150} y={104} style={txt(28, P.cream, 700)}>PERTO · 1–2 MM · RASO</text>
        </g>
      )}
      {(an.tensao ?? 0) > 0 && (
        <g opacity={an.tensao}>
          {[-1, 1].map((s) => (
            <path key={s} d={`M${s * 300},${240} l${s * 110 * (1 - ap * 0.6)},0 m${-s * 18},-16 l${s * 18},16 l${-s * 18},16`} fill="none" stroke={P.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          <text x={-60} y={-190 + 0} style={txt(0.1, P.ink)}> </text>
        </g>
      )}
      {(an.derme ?? 0) > 0 && (
        <g opacity={an.derme}>
          <text x={60} y={EPI + 86} style={txt(30, P.cream, 700)}>FIO NA DERME</text>
        </g>
      )}
    </svg>
  );
};

// ── face de cima (superfície) ─────────────────────────────────────────────
const Cima: React.FC<{ c: PeleCtl; enterrado?: boolean }> = ({ c, enterrado }) => {
  const ap = c.aperto ?? 0;
  const gap = G0 * (1 - ap);
  const extras = c.extras ?? 0;
  const raio = c.raioX ?? 0;
  const u = (x: number) => Math.sign(x) * Math.max(0, Math.abs(x) - (Math.abs(x) > 0 ? G0 * ap : 0));
  // posições dos pontos ao longo da ferida (a frente é v=BD: o ponto animado, no plano do corte)
  const vs = [BD - 4, BD - 150, BD - 300, BD - 450];
  const marks = (v: number, alpha0: number, key: number) => {
    const fal = key === 2 ? c.falha ?? 0 : 0;
    const alpha = alpha0 * (1 - 0.8 * fal);
    if (c.tipo === "intra" || alpha <= 0) return null;
    if (fal > 0.5)
      return (
        <g key={key} opacity={alpha0}>
          <path d={`M${u(60)},${v} q-20,-6 -34,-22 M${u(-60)},${v} q20,-6 32,-24`} stroke="#B8321F" strokeWidth={6} fill="none" strokeLinecap="round" />
          {FUROS[c.tipo].map((x, i) => <circle key={i} cx={u(x)} cy={v} r={7} fill={P.parede} />)}
          <circle cx={0} cy={v} r={30} fill="none" stroke="#B8321F" strokeWidth={4} strokeDasharray="8 7" />
        </g>
      );
    const fur = FUROS[c.tipo];
    return (
      <g key={key} opacity={alpha}>
        {c.tipo === "simples" && (
          <>
            <path d={`M${u(60)},${v} Q0,${v - 10} ${u(-60)},${v}`} stroke={P.fio} strokeWidth={11} fill="none" strokeLinecap="round" />
            <circle cx={u(-16)} cy={v - 2} r={14} fill={P.fio} />
          </>
        )}
        {c.tipo === "donati" && (
          <>
            <path d={`M${u(34)},${v} L${u(150)},${v}`} stroke={P.fio} strokeWidth={11} strokeLinecap="round" />
            <path d={`M${u(-150)},${v} L${u(-34)},${v}`} stroke={P.fio} strokeWidth={11} strokeLinecap="round" />
            <circle cx={u(-88)} cy={v - 2} r={14} fill={P.fio} />
          </>
        )}
        {fur.map((x, i) => (
          <circle key={i} cx={u(x)} cy={v} r={10} fill={P.parede} stroke={P.deep} strokeWidth={3} />
        ))}
        {(c.anot?.furos ?? 0) > 0 && fur.map((x, i) => (
          <circle key={`r${i}`} cx={u(x)} cy={v} r={24 + 6 * (1 - (c.anot?.furos ?? 0))} fill="none" stroke={P.gold} strokeWidth={5} opacity={c.anot?.furos} />
        ))}
      </g>
    );
  };
  // intradérmico: o fio enterrado corre em "degraus" ao longo da ferida, alternando os lados
  const intra = () => {
    const pts: Pt[] = [[0, 20]];
    let v = 70;
    let s = 1;
    while (v < 540) {
      pts.push([s * 62, v - 10], [s * 62, v + 62]);
      v += 62 - 10;
      s = -s;
    }
    pts.push([0, 585]);
    const moved: Pt[] = pts.map(([x, y]) => [u(x), y]);
    const tr = trecho(moved, c.agulha ?? 0);
    const gh = trecho(moved, c.ghost ?? 0).pts;
    return (
      <g>
        {(c.ghost ?? 0) > 0 && <path d={d(gh)} fill="none" stroke={P.gold} strokeWidth={4} strokeDasharray="10 10" />}
        {(c.agulha ?? 0) > 0 && (
          <>
            <path d={d(tr.pts)} fill="none" stroke={P.fio} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
            {(c.agulha ?? 0) < 1 && <Agulha x={tr.head[0]} y={tr.head[1]} ang={tr.ang} r={34} />}
          </>
        )}
      </g>
    );
  };
  return (
    <svg viewBox={`-450 0 ${BW} ${BD}`} width={BW} height={BD} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {!enterrado && (
        <>
          <defs>
            <linearGradient id="gTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F0B99E" />
              <stop offset="1" stopColor="#F8D3BE" />
            </linearGradient>
          </defs>
          <g opacity={1 - raio * 0.62}>
            <rect x={-450} y={0} width={450 - gap} height={BD} fill="url(#gTop)" />
            <rect x={gap} y={0} width={450 - gap} height={BD} fill="url(#gTop)" />
            {/* linhas finas da pele */}
            {Array.from({ length: 14 }).map((_, i) => (
              <path key={i} d={`M-450,${30 + i * 42} C-200,${22 + i * 42} 200,${40 + i * 42} 450,${28 + i * 42}`} stroke="rgba(190,110,80,.16)" strokeWidth={2} fill="none" />
            ))}
            <rect x={-gap} y={40} width={gap * 2} height={BD - 40} fill={P.parede} />
            <line x1={-gap} y1={40} x2={-gap} y2={BD} stroke={P.deep} strokeWidth={2} opacity={0.6} />
            <line x1={gap} y1={40} x2={gap} y2={BD} stroke={P.deep} strokeWidth={2} opacity={0.6} />
          </g>
          {c.tipo === "intra" && (c.agulha ?? 0) >= 1 && (
            <g>
              <path d="M0,20 q-18,-26 -40,-40" stroke={P.fio} strokeWidth={6} fill="none" strokeLinecap="round" />
              <path d="M0,585 q20,20 44,26" stroke={P.fio} strokeWidth={6} fill="none" strokeLinecap="round" />
              <circle cx={0} cy={20} r={6} fill={P.parede} />
              <circle cx={0} cy={585} r={6} fill={P.parede} />
            </g>
          )}
          {vs.map((v, i) => marks(v, i === 0 ? ((c.agulha ?? 0) >= 1 ? 1 : 0) : Math.max(0, Math.min(1, extras - (i - 1))), i))}
        </>
      )}
      {enterrado && c.tipo === "intra" && intra()}
    </svg>
  );
};

export const Pele: React.FC<PeleCtl & { children?: React.ReactNode }> = (c) => {
  const rx = c.rx ?? -24;
  const ry = c.ry ?? 0;
  const sc = c.escala ?? 1;
  const cy = c.y ?? 1020;
  const depthIntra = EPI + 80;
  return (
    <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: `50% ${cy - 200}px` }}>
      {/* sombra no papel */}
      <div
        style={{
          position: "absolute", left: 540 - 520 * sc, top: cy + (BH / 2) * sc - 10, width: 1040 * sc, height: 140 * sc,
          background: "radial-gradient(50% 50% at 50% 50%, rgba(80,30,15,.28), rgba(80,30,15,0) 70%)", transform: `translateY(${-rx * 2}px)`,
        }}
      />
      <div
        style={{
          position: "absolute", left: 540 - VB.w / 2, top: cy - (VB.h / 2), width: VB.w, height: VB.h,
          transformStyle: "preserve-3d", transform: `scale(${sc}) rotateX(${rx}deg) rotateY(${ry}deg)`, transformOrigin: `50% ${-VB.y + BH / 2}px`,
        }}
      >
        {/* face de cima: dobra 90° para trás a partir da linha da superfície */}
        <div
          style={{
            position: "absolute", left: (VB.w - BW) / 2, top: -VB.y - BD, width: BW, height: BD,
            transformOrigin: "50% 100%", transform: "rotateX(90deg)", backfaceVisibility: "hidden",
          }}
        >
          <Cima c={c} />
        </div>
        {/* plano enterrado (intradérmico): paralelo à superfície, no meio da derme */}
        {c.tipo === "intra" && (
          <div
            style={{
              position: "absolute", left: (VB.w - BW) / 2, top: -VB.y - BD + depthIntra, width: BW, height: BD,
              transformOrigin: "50% 100%", transform: "rotateX(90deg)",
            }}
          >
            <Cima c={c} enterrado />
          </div>
        )}
        {/* face da frente */}
        <div style={{ position: "absolute", left: 0, top: 0, width: VB.w, height: VB.h, transform: "translateZ(0.5px)" }}>
          <Frente c={c} />
        </div>
      </div>
      {c.children}
    </AbsoluteFill>
  );
};
