// A arena (mundo do locutor): escuro terra/ink, holofotes em cone com poeira na luz, ringue em perspectiva com cordas
// coral, os dois cantos (azul = o filtro; vermelho/coral = a anatomia) e a plateia em meio-tom com flashes.
// Tudo 2D em camadas (paralaxe por `cam`), função pura do quadro.
import React from "react";
import { AbsoluteFill } from "remotion";
import { H, W } from "../brand/brand";
import { AZUL, CIANO } from "./Malha";
import { P, rnd, twos } from "./kit";

export type LuzArena = { azul?: number; coral?: number; centro?: number };

/** cone de luz do teto: do ponto (x0, topo) abrindo até a largura `larg` no chão `y1` */
const Cone: React.FC<{ x0: number; x1: number; y1: number; larg: number; cor: string; forca: number }> = ({ x0, x1, y1, larg, cor, forca }) => {
  if (forca <= 0) return null;
  const pts = `${x0 - 18},-20 ${x0 + 18},-20 ${x1 + larg / 2},${y1} ${x1 - larg / 2},${y1}`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: forca }}>
      <defs>
        <linearGradient id={`cone${x0}${cor}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cor} stopOpacity={0.9} />
          <stop offset="0.7" stopColor={cor} stopOpacity={0.28} />
          <stop offset="1" stopColor={cor} stopOpacity={0.05} />
        </linearGradient>
        <filter id={`bl${x0}${cor}`}><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <polygon points={pts} fill={`url(#cone${x0}${cor})`} filter={`url(#bl${x0}${cor})`} />
      <ellipse cx={x1} cy={y1} rx={larg * 0.62} ry={larg * 0.12} fill={cor} opacity={0.35} filter={`url(#bl${x0}${cor})`} />
    </svg>
  );
};

/** poeira suspensa dentro do cone (partículas determinísticas, em dois) */
const Poeira: React.FC<{ g: number; x0: number; x1: number; y1: number; larg: number; cor: string; forca: number; n?: number; seed?: number }> = ({
  g, x0, x1, y1, larg, cor, forca, n = 70, seed = 1,
}) => {
  if (forca <= 0) return null;
  const f = twos(g);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: forca }}>
      {Array.from({ length: n }, (_, i) => {
        const t = (rnd(seed * 100 + i) + f * 0.0012 * (0.5 + rnd(i * 3))) % 1; // desce devagar
        const y = t * y1;
        const meia = 18 + (larg / 2) * (y / y1);
        const cx = x0 + (x1 - x0) * (y / y1);
        const x = cx + (rnd(seed * 50 + i * 7) - 0.5) * 2 * meia * 0.85 + Math.sin(f * 0.03 + i) * 6;
        return <circle key={i} cx={x} cy={y} r={0.8 + rnd(i * 11) * 2.2} fill={cor} opacity={0.25 + 0.6 * rnd(i * 5)} />;
      })}
    </svg>
  );
};

/** plateia: fileiras de silhuetas (cabeça + ombros) em meio-tom, com flashes de celular pipocando */
const Plateia: React.FC<{ g: number; topo: number; agito?: number; flashes?: number }> = ({ g, topo, agito = 0.3, flashes = 1 }) => {
  const f = twos(g);
  const filas = [0, 1, 2, 3];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="meiotomPlateia" width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#140908" />
          <circle cx="3.5" cy="3.5" r="1.6" fill="#3A1E16" />
        </pattern>
      </defs>
      {filas.map((fi) => {
        const y = topo + fi * 70;
        const esc = 0.8 + fi * 0.22;
        const n = 14 - fi * 2;
        return (
          <g key={fi}>
            {Array.from({ length: n }, (_, i) => {
              const x = ((i + 0.5 + (fi % 2) * 0.5) / n) * W + (rnd(fi * 40 + i) - 0.5) * 40;
              const pulo = Math.max(0, Math.sin(f * 0.35 + i * 1.9 + fi)) * 14 * agito * esc;
              const cy = y - pulo;
              const r = 30 * esc;
              return (
                <g key={i}>
                  <ellipse cx={x} cy={cy + r * 2.3} rx={r * 1.9} ry={r * 1.4} fill="url(#meiotomPlateia)" />
                  <circle cx={x} cy={cy} r={r} fill="url(#meiotomPlateia)" />
                  {/* braço erguido em quem está vibrando */}
                  {rnd(fi * 13 + i) > 0.62 && agito > 0.2 && (
                    <path d={`M${x + r * 0.9},${cy + r * 1.6} q${14 * esc},${-r * 1.5 - pulo} ${4 * esc},${-r * 2.6 - pulo * 1.2}`} stroke="#1c0e0b" strokeWidth={12 * esc} strokeLinecap="round" fill="none" />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {/* flashes: pontos que acendem por 2 quadros */}
      {Array.from({ length: 16 }, (_, i) => {
        const ciclo = 23 + Math.floor(rnd(i * 9) * 30);
        const fase = Math.floor(rnd(i * 17) * ciclo);
        const on = (f + fase) % ciclo < 2;
        if (!on || flashes <= 0) return null;
        const x = rnd(i * 31 + Math.floor((f + fase) / ciclo)) * W;
        const y = topo + rnd(i * 41) * 220;
        return <circle key={i} cx={x} cy={y} r={7} fill="#FFF6EC" opacity={0.9 * flashes} style={{ filter: "blur(2px)" }} />;
      })}
    </svg>
  );
};

/** o ringue em perspectiva: lona, três cordas coral e os dois postes (azul à esquerda, coral à direita) */
const Ringue: React.FC<{ chao: number; op?: number }> = ({ chao, op = 1 }) => {
  const yF = chao, yT = chao - 260; // frente e fundo da lona
  const xl = -120, xr = W + 120, tl = 170, tr = W - 170;
  const corda = (k: number) => {
    const alt = 70 + k * 78;
    return (
      <g key={k}>
        <line x1={tl} y1={yT - alt * 0.6} x2={tr} y2={yT - alt * 0.6} stroke={P.coral} strokeWidth={5} opacity={0.75} />
        <line x1={xl} y1={yF - alt} x2={tl} y2={yT - alt * 0.6} stroke={P.coral} strokeWidth={7} opacity={0.85} />
        <line x1={xr} y1={yF - alt} x2={tr} y2={yT - alt * 0.6} stroke={P.coral} strokeWidth={7} opacity={0.85} />
      </g>
    );
  };
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: op }}>
      <defs>
        <linearGradient id="lona" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a2a1c" />
          <stop offset="1" stopColor="#2a1410" />
        </linearGradient>
      </defs>
      <polygon points={`${tl},${yT} ${tr},${yT} ${xr},${yF} ${xl},${yF}`} fill="url(#lona)" />
      <polygon points={`${xl},${yF} ${xr},${yF} ${xr},${yF + 90} ${xl},${yF + 90}`} fill="#1a0c09" />
      {[0, 1, 2].map(corda)}
      {/* postes do fundo: azul (filtro) e coral (anatomia) */}
      <rect x={tl - 14} y={yT - 260} width={28} height={260} rx={8} fill={AZUL} />
      <rect x={tl - 22} y={yT - 250} width={44} height={120} rx={12} fill={CIANO} opacity={0.55} />
      <rect x={tr - 14} y={yT - 260} width={28} height={260} rx={8} fill={P.coralLo} />
      <rect x={tr - 22} y={yT - 250} width={44} height={120} rx={12} fill={P.coral} opacity={0.8} />
    </svg>
  );
};

export const Arena: React.FC<{ g: number; luz?: LuzArena; chao?: number; plateiaTopo?: number; agito?: number; ringue?: boolean; children?: React.ReactNode }> = ({
  g, luz = {}, chao = 1500, plateiaTopo = 1480, agito = 0.3, ringue = true, children,
}) => {
  const { azul = 0.8, coral = 0.8, centro = 0.5 } = luz;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 38%, #3a1a12 0%, #1e0e0b 55%, #0f0706 100%)" }}>
      <Cone x0={220} x1={260} y1={chao - 120} larg={560} cor="#4F8BFF" forca={azul} />
      <Cone x0={860} x1={820} y1={chao - 120} larg={560} cor="#FF9A6E" forca={coral} />
      <Cone x0={540} x1={540} y1={chao - 60} larg={760} cor="#FFE6CF" forca={centro} />
      <Poeira g={g} x0={220} x1={260} y1={chao - 120} larg={560} cor="#BFE6FF" forca={azul * 0.7} seed={2} />
      <Poeira g={g} x0={860} x1={820} y1={chao - 120} larg={560} cor="#FFD9C4" forca={coral * 0.7} seed={5} />
      {ringue && <Ringue chao={chao} />}
      {children}
      <Plateia g={g} topo={plateiaTopo} agito={agito} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(8,3,2,.6) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
