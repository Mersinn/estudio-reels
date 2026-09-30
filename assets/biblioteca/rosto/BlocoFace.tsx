// O bloco da bochecha: um pedaço da face da Vênus que sai do rosto como um bloco de mármore cortado e, girado, mostra
// no corte as camadas vivas (Alghoul & Codner 2013): pele · gordura · SMAS · ligamentos de retenção e seus espaços ·
// osso (periósteo). Os ligamentos atravessam do osso até a derme; os ramos do nervo facial passam logo abaixo do SMAS.
// Caixa em CSS 3D: topo = a superfície (a própria arte da Vênus), frente e lado = o corte.
import React from "react";
import { rnd } from "./kit";

export const BW = 480, BD = 420; // largura e profundidade do bloco (px)
export const BANDAS = [
  { id: "pele", h: 56 },
  { id: "gordura", h: 150 },
  { id: "smas", h: 64 },
  { id: "ligamentos", h: 130 },
  { id: "osso", h: 110 },
] as const;
export const BT = BANDAS.reduce((a, b) => a + b.h, 0); // espessura total
export const topoBanda = (i: number) => BANDAS.slice(0, i).reduce((a, b) => a + b.h, 0);

/** o corte (frente ou lado): cada banda revela da esquerda para a direita com `rev[i]` 0→1; `nervo` 0→1 acende os ramos */
export const Corte: React.FC<{ w: number; rev: number[]; nervo: number; escuro?: number; destaque?: number }> = ({ w, rev, nervo, escuro = 0, destaque = -1 }) => {
  const yLig = topoBanda(3), yOsso = topoBanda(4), ySmas = topoBanda(2), yGord = topoBanda(1);
  return (
    <svg width={w} height={BT} style={{ display: "block", filter: escuro ? `brightness(${1 - escuro})` : undefined }}>
      <defs>
        {BANDAS.map((b, i) => (
          <clipPath key={b.id} id={`rev-${b.id}-${w}`}>
            <rect x={0} y={topoBanda(i)} width={w * rev[i]} height={b.h} />
          </clipPath>
        ))}
      </defs>
      {/* o que ainda não foi revelado é mármore */}
      <rect width={w} height={BT} fill="#E9C7B4" />
      {Array.from({ length: 40 }, (_, i) => <path key={i} d={`M${rnd(i) * w},${rnd(i + 3) * BT} q40,${(rnd(i + 5) - 0.5) * 40} 90,${(rnd(i + 7) - 0.5) * 30}`} stroke="#D9A994" strokeWidth={3} fill="none" opacity={0.5} />)}
      {/* pele: epiderme (linha clara) + derme */}
      <g clipPath={`url(#rev-pele-${w})`}>
        <rect y={0} width={w} height={BANDAS[0].h} fill="#EFA88C" />
        <rect y={0} width={w} height={10} fill="#F9DCCB" />
        {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={rnd(i + 11) * w} cy={14 + rnd(i + 12) * 38} r={2.5} fill="#D98A70" />)}
      </g>
      {/* gordura: lóbulos */}
      <g clipPath={`url(#rev-gordura-${w})`}>
        <rect y={yGord} width={w} height={BANDAS[1].h} fill="#F6D9A8" />
        {Array.from({ length: Math.ceil(w / 44) * 4 }, (_, i) => {
          const col = i % Math.ceil(w / 44), row = Math.floor(i / Math.ceil(w / 44));
          const x = col * 44 + (row % 2) * 22, y = yGord + 20 + row * 36;
          return <ellipse key={i} cx={x} cy={y} rx={21} ry={17} fill="#FBE7C8" stroke="#E2B77F" strokeWidth={3} />;
        })}
      </g>
      {/* SMAS: fibras (músculo e aponeurose) */}
      <g clipPath={`url(#rev-smas-${w})`}>
        <rect y={ySmas} width={w} height={BANDAS[2].h} fill="#C9603F" />
        {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M0,${ySmas + 8 + i * 8} C${w * 0.3},${ySmas + 2 + i * 8} ${w * 0.6},${ySmas + 14 + i * 8} ${w},${ySmas + 6 + i * 8}`} stroke={i % 2 ? "#E88C6A" : "#A84A2E"} strokeWidth={4} fill="none" />)}
      </g>
      {/* ligamentos e espaços: tecido frouxo claro */}
      <g clipPath={`url(#rev-ligamentos-${w})`}>
        <rect y={yLig} width={w} height={BANDAS[3].h} fill="#F4E4D6" />
        {Array.from({ length: 24 }, (_, i) => <path key={i} d={`M${rnd(i + 20) * w},${yLig + rnd(i + 21) * 120} q20,-10 40,0`} stroke="#E3CDBB" strokeWidth={2} fill="none" />)}
      </g>
      {/* osso: periósteo + cortical com poros */}
      <g clipPath={`url(#rev-osso-${w})`}>
        <rect y={yOsso} width={w} height={BANDAS[4].h} fill="#F1E6CF" />
        <rect y={yOsso} width={w} height={8} fill="#C9B391" />
        {Array.from({ length: 50 }, (_, i) => <circle key={i} cx={rnd(i + 40) * w} cy={yOsso + 18 + rnd(i + 41) * 86} r={2 + rnd(i + 42) * 4} fill="#D9C8A5" />)}
      </g>
      {/* os ligamentos de retenção: colunas fibrosas do osso até a derme (aparecem com a banda deles) */}
      {rev[3] > 0 && [0.18, 0.46, 0.76].map((u, i) => (
        <g key={i} opacity={Math.min(1, rev[3] * 1.4)}>
          <path d={`M${u * w},${yOsso} C${u * w - 8},${yLig + 40} ${u * w + 10},${ySmas} ${u * w - 4},${yGord + 40} L${u * w - 2},${16}`} stroke="#FFF9F1" strokeWidth={destaque === 3 ? 12 : 8} fill="none" strokeLinecap="round" />
          <path d={`M${u * w},${yOsso} C${u * w - 8},${yLig + 40} ${u * w + 10},${ySmas} ${u * w - 4},${yGord + 40} L${u * w - 2},${16}`} stroke="#D8C3A6" strokeWidth={2} fill="none" />
        </g>
      ))}
      {/* os ramos do nervo facial: logo abaixo do SMAS, cortados (círculos) e correndo no plano */}
      {nervo > 0 && (
        <g opacity={nervo} style={{ filter: "drop-shadow(0 0 8px rgba(242,199,92,.95))" }}>
          <path d={`M0,${yLig + 22} C${w * 0.3},${yLig + 14} ${w * 0.6},${yLig + 30} ${w * nervo},${yLig + 20}`} stroke="#F2C75C" strokeWidth={7} fill="none" strokeLinecap="round" />
          {[0.32, 0.62, 0.88].map((u, i) => <circle key={i} cx={u * w} cy={yLig + 22 + (i % 2) * 8} r={11 * Math.min(1, nervo * 1.5)} fill="#F2C75C" stroke="#B8872A" strokeWidth={3} />)}
        </g>
      )}
      {/* realce da banda dita agora */}
      {destaque >= 0 && destaque < BANDAS.length && <rect x={2} y={topoBanda(destaque) + 2} width={w - 4} height={BANDAS[destaque].h - 4} fill="none" stroke="#FFF3E0" strokeWidth={5} />}
    </svg>
  );
};

/** a caixa em 3D. `ax`/`ay` giram o bloco; o topo recebe `topo` (a arte da Vênus alinhada por quem chama). */
export const Bloco: React.FC<{ x: number; y: number; ax: number; ay: number; esc?: number; topo: React.ReactNode; rev: number[]; nervo: number; destaque?: number; persp?: number }> = ({
  x, y, ax, ay, esc = 1, topo, rev, nervo, destaque = -1, persp = 1600,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, perspective: persp }}>
    <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: `scale(${esc}) rotateX(${ax}deg) rotateY(${ay}deg)` }}>
      {/* topo: a superfície da bochecha */}
      <div style={{ position: "absolute", left: -BW / 2, top: -BD / 2, width: BW, height: BD, transform: `translateY(${-BT / 2}px) rotateX(90deg)`, overflow: "hidden", backfaceVisibility: "hidden" }}>{topo}</div>
      {/* frente: o corte */}
      <div style={{ position: "absolute", left: -BW / 2, top: -BT / 2, width: BW, height: BT, transform: `translateZ(${BD / 2}px)`, backfaceVisibility: "hidden" }}>
        <Corte w={BW} rev={rev} nervo={nervo} destaque={destaque} />
      </div>
      {/* lado direito: o mesmo corte, mais escuro */}
      <div style={{ position: "absolute", left: -BD / 2, top: -BT / 2, width: BD, height: BT, transform: `translateX(${BW / 2}px) rotateY(90deg)`, backfaceVisibility: "hidden" }}>
        <Corte w={BD} rev={rev} nervo={nervo} escuro={0.22} />
      </div>
    </div>
  </div>
);
