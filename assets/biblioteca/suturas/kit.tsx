// Kit visual do reel "Qual ponto fecha melhor?"
// A síntese das referências, na identidade da LACP:
//   Kurzgesagt → o micro-mundo limpo (pele em corte, cores chapadas com degradê suave, rótulos em pílula)
//   Vox        → material honesto (papel quente, nunca branco puro, grão, meio-tom nas sombras,
//                animação "em dois" nos elementos de papel, fontes na tela com marca-texto)
//   pins       → tipografia com contraste extremo (itálico editorial pequeno + palavra pesada gigante),
//                entrada com desfoque, palavras que dividem o espaço com os objetos
//   LACP       → coral/terra/ink/creme + ouro, Montserrat 900 + Playfair + Plex Mono, selo dourado,
//                a Vênus como paciente-modelo, o círculo (foco → lente → anel da logo)
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { F, H, W } from "../brand/brand";
import { useG } from "../engine/ui";

export const P = {
  paper: "#F4E8DD", // papel quente (nunca branco puro)
  paper2: "#EAD7C6",
  paperLine: "#E2CDBA",
  night: "#150A07",
  night2: "#24130D",
  ink: "#2A1510",
  ink2: "#3A1E16",
  coral: "#EE8560",
  coralHi: "#F29470",
  coralLo: "#CF6C46",
  terra: "#C1633F",
  deep: "#86391F",
  peach: "#F3C3AC",
  blush: "#F7E4DA",
  cream: "#FBF5F0",
  gold: "#C9A45C",
  goldHi: "#E6C886",
  // pele em corte
  epi: "#F7CDB5",
  epiTop: "#D48A6C",
  derme: "#EE8560",
  dermeFibra: "#F7A889",
  hipo: "#F8DFBE",
  hipoLinha: "#EBC393",
  parede: "#C75A3E",
  fio: "#21120D",
  fioLuz: "#FFE9D6",
} as const;

export const ease = Easing.bezier(0.16, 1, 0.3, 1); // saída explosiva, parada macia (Vox)
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 entre from e from+dur (quadros absolutos) */
export const pp = (f: number, from: number, dur: number, e: (t: number) => number = ease) =>
  interpolate(f, [from, from + Math.max(1, dur)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
/** animação "em dois" (12 fps dentro dos 30): elementos de papel e colagem */
export const twos = (f: number, n = 2) => Math.floor(f / n) * n;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── acabamento comum (homogeneização Vox): meio-tom + vinheta + grão ────────
export const Halftone: React.FC<{ opacity?: number; size?: number; color?: string; mask?: string }> = ({
  opacity = 0.1,
  size = 9,
  color = "#2a1510",
  mask = "radial-gradient(90% 70% at 50% 45%, transparent 40%, black 100%)",
}) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      opacity,
      mixBlendMode: "multiply",
      backgroundImage: `radial-gradient(${color} 28%, transparent 30%)`,
      backgroundSize: `${size}px ${size}px`,
      WebkitMaskImage: mask,
      maskImage: mask,
    }}
  />
);

export const Vinheta: React.FC<{ strength?: number; tint?: string }> = ({ strength = 0.4, tint = "20,8,4" }) => (
  <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(115% 80% at 50% 46%, rgba(${tint},0) 52%, rgba(${tint},${strength}) 100%)` }} />
);

// ── tipografia ─────────────────────────────────────────────────────────────
export const T = {
  pesada: (size: number, color: string = P.cream): React.CSSProperties => ({
    fontFamily: F.impacto, fontWeight: 900, fontSize: size, color, letterSpacing: "-0.045em", lineHeight: 0.92,
  }),
  italica: (size: number, color: string = P.cream, weight = 800): React.CSSProperties => ({
    fontFamily: F.editorial, fontStyle: "italic", fontWeight: weight, fontSize: size, color, letterSpacing: "-0.01em", lineHeight: 1,
  }),
  mono: (size: number, color: string = P.ink): React.CSSProperties => ({
    fontFamily: F.tecnica, fontWeight: 600, fontSize: size, color, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.15,
  }),
  espacada: (size: number, color: string = P.cream): React.CSSProperties => ({
    fontFamily: F.espacada, fontWeight: 500, fontSize: size, color, letterSpacing: "0.32em", textTransform: "uppercase",
  }),
};

/** palavra que entra com desfoque no quadro f (5 quadros, em dois) e pode sair com desfoque em `out` */
export const Borra: React.FC<{ f: number; out?: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number; blur?: number }> = ({
  f,
  out,
  children,
  style,
  dy = 22,
  blur = 16,
}) => {
  const g = useG();
  if (g < f || (out !== undefined && g >= out + 6)) return null;
  const a = pp(twos(g - f), 0, 6);
  const o = out !== undefined ? 1 - pp(g, out, 6) : 1;
  return (
    <div
      style={{
        ...style,
        opacity: a * o,
        filter: `blur(${(1 - a) * blur + (1 - o) * blur}px)`,
        transform: `${style?.transform ?? ""} translateY(${(1 - a) * dy}px) scale(${1 + (1 - a) * 0.06})`,
      }}
    >
      {children}
    </div>
  );
};

/** marca-texto (Vox): faixa que corre por trás do texto a partir do quadro f */
export const Marca: React.FC<{ f: number; dur?: number; color?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  f,
  dur = 9,
  color = "rgba(230,200,134,.85)",
  children,
  style,
}) => {
  const g = useG();
  const p = pp(g, f, dur, easeInOut);
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <span
        style={{
          position: "absolute", left: "-3%", right: "-3%", top: "18%", bottom: "6%", background: color, mixBlendMode: "multiply",
          transform: "rotate(-1deg) skewX(-6deg)", clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 4px)`,
        }}
      />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
};

/** pílula de rótulo (Kurzgesagt/Albornoz) com linha-guia opcional até um ponto */
export const Pilula: React.FC<{
  x: number; y: number; from: number; to?: number; texto: string; ponto?: [number, number];
  tom?: "ink" | "cream" | "gold" | "coral"; size?: number; align?: "left" | "center" | "right";
}> = ({ x, y, from, to = 1e9, texto, ponto, tom = "ink", size = 26, align = "center" }) => {
  const g = useG();
  if (g < from || g >= to + 6) return null;
  const a = pp(twos(g - from), 0, 8);
  const o = 1 - pp(g, to, 6);
  const bg = { ink: P.ink, cream: P.cream, gold: P.gold, coral: P.coralLo }[tom];
  const fg = tom === "cream" || tom === "gold" ? P.ink : P.cream;
  const line = tom === "cream" ? P.cream : P.ink;
  const tx = align === "left" ? 0 : align === "right" ? -100 : -50;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      {ponto && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <line x1={x} y1={y} x2={lerp(x, ponto[0], a)} y2={lerp(y, ponto[1], a)} stroke={line} strokeWidth={2.4} />
          <circle cx={ponto[0]} cy={ponto[1]} r={8 * a} fill={P.cream} stroke={line} strokeWidth={3} />
        </svg>
      )}
      <div
        style={{
          position: "absolute", left: x, top: y, transform: `translate(${tx}%, -50%) scale(${0.85 + 0.15 * a})`,
          ...T.mono(size, fg), background: bg, padding: "12px 20px 11px", borderRadius: 999, whiteSpace: "nowrap", opacity: a,
          boxShadow: "0 10px 24px rgba(30,12,6,.28)",
        }}
      >
        {texto}
      </div>
    </AbsoluteFill>
  );
};

// ── geometria de caminhos (fio e agulha) ─────────────────────────────────────
export type Pt = [number, number];
/** Catmull-Rom denso por uma lista de pontos */
export function curva(pts: Pt[], n = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
/** pedaço inicial de uma polilinha (fração 0..1 do comprimento) + ponta e direção */
export function trecho(pts: Pt[], frac: number): { pts: Pt[]; head: Pt; ang: number } {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const target = L[L.length - 1] * Math.max(0, Math.min(1, frac));
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] >= target) {
      const t = (target - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
      const head: Pt = [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)];
      out.push(head);
      return { pts: out, head, ang: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) };
    }
    out.push(pts[i]);
  }
  const n = pts.length;
  return { pts: out, head: pts[n - 1], ang: Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) };
}
export const d = (pts: Pt[]) => (pts.length ? "M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L") : "");

/** agulha curva (3/8 de círculo) com a ponta em (0,0) apontando para +x */
export const Agulha: React.FC<{ x: number; y: number; ang: number; r?: number; op?: number }> = ({ x, y, ang, r = 44, op = 1 }) => {
  // arco atrás da ponta: a agulha "segue" o caminho
  const a0 = Math.PI * 0.62;
  const pts: Pt[] = [];
  for (let k = 0; k <= 16; k++) {
    const t = (k / 16) * a0;
    pts.push([-r * Math.sin(t), -r + r * Math.cos(t)]);
  }
  return (
    <g transform={`translate(${x},${y}) rotate(${(ang * 180) / Math.PI})`} opacity={op}>
      <path d={d(pts)} fill="none" stroke="#5b5550" strokeWidth={8.5} strokeLinecap="round" />
      <path d={d(pts)} fill="none" stroke="#d9d4cf" strokeWidth={5} strokeLinecap="round" />
      <path d={d(pts.slice(0, 7))} fill="none" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};
