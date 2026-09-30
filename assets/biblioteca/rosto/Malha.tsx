// Os dois verbos da Vênus neste reel, desenhados por cima do RostoFx (mesma Vista):
//  · Malha  = ESCANEADA: a malha de rastreio facial do filtro (ciano, a cor do antagonista), que acompanha o liquify;
//  · Marcas = MARCADA: a caneta dermográfica do cirurgião no rosto verdadeiro (as marcas que cada round ensinou).
import React from "react";
import MALHA from "../data/malha.json";
import { destino, FiltroFx, L, naTela, Vista } from "./RostoFx";
import { curva, dPath, Pt, rnd, trecho } from "./kit";

export const CIANO = "#5FD4FF";
export const AZUL = "#2F6BFF";
const PTS = MALHA.pts as unknown as [number, number][];
const TRI = MALHA.tri as unknown as [number, number, number][];

/** malha facial. `on` 0→1 revela (linhas nascem do centro para fora); `racha` 0→1 os triângulos se soltam e caem */
export const Malha: React.FC<{ v: Vista; fx: FiltroFx; on: number; racha?: number; cor?: string; op?: number; t?: number }> = ({
  v, fx, on, racha = 0, cor = CIANO, op = 1, t = 0,
}) => {
  if (on <= 0) return null;
  const tela = PTS.map((p) => naTela(v, destino(p, fx)));
  const centro: Pt = naTela(v, [300, 380]);
  const maxD = 420 * v.zoom;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: op, overflow: "visible" }}>
      <defs>
        <filter id="brilhoMalha" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter="url(#brilhoMalha)">
        {TRI.map((tr, i) => {
          const [a, b, c] = tr.map((k) => tela[k]);
          const m: Pt = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
          const d = Math.hypot(m[0] - centro[0], m[1] - centro[1]) / maxD;
          const vis = Math.max(0, Math.min(1, (on * 1.4 - d) * 5));
          if (vis <= 0) return null;
          // rachar: cada triângulo cai com giro e atraso próprios (semente = índice)
          const atraso = rnd(i * 3.1) * 0.5;
          const q = Math.max(0, Math.min(1, (racha - atraso) / 0.5));
          const tx = (rnd(i * 7.7) - 0.5) * 160 * q, ty = q * q * 900 + (rnd(i) - 0.5) * 40 * q, rot = (rnd(i * 2.3) - 0.5) * 220 * q;
          const opq = vis * (1 - q);
          if (opq <= 0.01) return null;
          return (
            <g key={i} transform={`translate(${tx} ${ty}) rotate(${rot} ${m[0]} ${m[1]})`} opacity={opq}>
              <polygon points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`} fill={cor} fillOpacity={0.05 + 0.12 * q} stroke={cor} strokeWidth={1.6} strokeOpacity={0.75} />
            </g>
          );
        })}
        {racha < 0.3 &&
          tela.map((p, i) => {
            const d = Math.hypot(p[0] - centro[0], p[1] - centro[1]) / maxD;
            const vis = Math.max(0, Math.min(1, (on * 1.4 - d) * 5)) * (1 - racha / 0.3);
            const pisca = 0.6 + 0.4 * Math.sin(t * 0.4 + i * 1.7);
            return vis > 0 ? <circle key={i} cx={p[0]} cy={p[1]} r={3.2} fill="#E9FBFF" opacity={vis * pisca} /> : null;
          })}
      </g>
    </svg>
  );
};

// ── as marcas do cirurgião (px do recorte) ─────────────────────────────────────────────────
/** o "bullhorn" do lip lift: faixa em asa de gaivota logo abaixo do nariz (round 1) */
export const BULLHORN: { cima: Pt[]; baixo: Pt[] } = {
  cima: [[300, 424], [318, 418], [338, 424], [356, 428], [376, 422], [398, 414], [414, 420]],
  baixo: [[300, 424], [320, 440], [340, 448], [358, 450], [378, 446], [400, 432], [414, 420]],
};
/** a linha do dorso e da ponta do nariz (round 2) */
export const DORSO: Pt[] = [[300, 232], [318, 262], [338, 300], [360, 338], [382, 368], [398, 384]];
/** prega da pálpebra superior do olho A e a medida até a sobrancelha (round 3) */
export const PALPEBRA: Pt[] = [[150, 258], [166, 250], [182, 247], [198, 250], [214, 258]];

const Traco: React.FC<{ pts: Pt[]; v: Vista; p: number; cor: string; esp: number; tracejado?: boolean; seed: number }> = ({ pts, v, p, cor, esp, tracejado, seed }) => {
  if (p <= 0) return null;
  const tela = curva(pts.map((q) => naTela(v, q)) as Pt[], 10).map(([x, y], i) => [x + (rnd(seed + i) - 0.5) * 1.5, y + (rnd(seed * 2 + i) - 0.5) * 1.5] as Pt);
  const tr = trecho(tela, p);
  return <path d={dPath(tr.pts)} fill="none" stroke={cor} strokeWidth={esp} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={tracejado ? `${esp * 2.2} ${esp * 1.8}` : undefined} />;
};

/** a caneta dermográfica no rosto verdadeiro. Cada marca 0→1 é desenhada em progresso (a ordem da mão). */
export const Marcas: React.FC<{ v: Vista; lip?: number; nariz?: number; olho?: number; linhaMedia?: number; cor?: string }> = ({
  v, lip = 0, nariz = 0, olho = 0, linhaMedia = 0, cor = "#5B2A7A",
}) => {
  const esp = Math.max(2.5, 2.2 * v.zoom);
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Traco pts={[[292, 60], [296, 200], [300, 232]]} v={v} p={linhaMedia} cor={cor} esp={esp * 0.8} tracejado seed={3} />
      <Traco pts={BULLHORN.cima} v={v} p={Math.min(1, lip * 2)} cor={cor} esp={esp} seed={11} />
      <Traco pts={BULLHORN.baixo} v={v} p={Math.max(0, lip * 2 - 1)} cor={cor} esp={esp} seed={17} />
      <Traco pts={DORSO} v={v} p={nariz} cor={cor} esp={esp} tracejado seed={23} />
      <Traco pts={PALPEBRA} v={v} p={olho} cor={cor} esp={esp} seed={29} />
    </svg>
  );
};

export const marcaNaTela = (v: Vista, p: Pt) => naTela(v, p);
export { L };
