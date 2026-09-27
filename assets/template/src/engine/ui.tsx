// Componentes do motor (independem de marca e de tema).
import React, { createContext, useContext, useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BRAND, C, F, fontsReady, H, SAFE, W } from "../brand/brand";

// ── tempo ─────────────────────────────────────────────────────────────────
/** início da cena atual no tempo global. Dentro de <Scene>, useG() devolve o quadro ABSOLUTO do vídeo,
 *  que é o que os tempos de palavra (wf/wfind) usam. Não compare quadro local com quadro global. */
export const StartCtx = createContext(0);
export const useG = () => useCurrentFrame() + useContext(StartCtx);

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
/** 0→1 entre `from` e `from+dur` (quadros absolutos), com easing */
export const prog = (frame: number, from: number, dur: number, e = easeOut) =>
  interpolate(frame, [from, from + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

/** segura a renderização até as fontes carregarem (medidas de texto corretas desde o 1º quadro) */
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("fontes da marca"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fontsReady.then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready ? <>{children}</> : null;
};

/** cena montada no tempo global: [from, to) absolutos, `pre`/`post` = sobreposição para transições,
 *  `fadeIn` = quadros de dissolução na entrada (match cut entre formas iguais) */
export const Scene: React.FC<{
  from: number;
  to: number;
  pre?: number;
  post?: number;
  fadeIn?: number;
  name?: string;
  children: (start: number) => React.ReactNode;
}> = ({ from, to, pre = 0, post = 0, fadeIn = 0, name, children }) => {
  const start = from - pre;
  return (
    <Sequence from={start} durationInFrames={to + post - start} name={name}>
      <StartCtx.Provider value={start}>
        <FadeIn frames={fadeIn}>{children(start)}</FadeIn>
      </StartCtx.Provider>
    </Sequence>
  );
};
const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const o = frames ? interpolate(f, [0, frames], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// ── tipografia de cena ───────────────────────────────────────────────────
/** palavra que aparece em corte seco no quadro `f` (pop de 3 quadros). Reserva o espaço antes de aparecer. */
export const At: React.FC<{ f: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, children, style }) => {
  const frame = useG();
  if (frame < f) return <span style={{ ...style, visibility: "hidden" }}>{children}</span>;
  const k = frame - f >= 3 ? 1 : 1.07 - 0.023 * (frame - f);
  return <span style={{ display: "inline-block", ...style, transform: `${style?.transform ?? ""} scale(${k})` }}>{children}</span>;
};

export const heavy = (size: number, color: string = C.texto): React.CSSProperties => ({
  fontFamily: F.impacto,
  fontWeight: 900,
  fontSize: size,
  letterSpacing: "-0.045em",
  lineHeight: 0.86,
  color,
});
export const italic = (size: number, color: string = C.texto): React.CSSProperties => ({
  fontFamily: F.editorial,
  fontStyle: "italic",
  fontWeight: 600,
  fontSize: size,
  color,
});
export const script = (size: number, color: string = C.acento): React.CSSProperties => ({
  fontFamily: F.manuscrita,
  fontSize: size,
  color,
  transform: "rotate(-6deg)",
  lineHeight: 1.05,
});
export const monoStyle = (size = 26, color: string = C.tinta): React.CSSProperties => ({
  fontFamily: F.tecnica,
  fontWeight: 600,
  fontSize: size,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color,
});
export const SHADOW = "0 8px 24px rgba(20,10,5,.4)";

/** <DataCounter/> · número que sobe até o valor (vírgula decimal pt-BR) */
export const DataCounter: React.FC<{ value: number; dec: number; from: number; dur?: number; prefix?: string; suffix?: string; style: React.CSSProperties }> = ({
  value,
  dec,
  from,
  dur = 22,
  prefix = "",
  suffix = "",
  style,
}) => {
  const frame = useG();
  if (frame < from) return null;
  const v = (value * prog(frame, from, dur)).toFixed(dec).replace(".", ",");
  return (
    <div style={style}>
      {prefix}
      {v}
      {suffix}
    </div>
  );
};

/** <MonoLabel/> · rótulo técnico com linha-guia até um ponto (ex.: projetado do 3D com project()) */
export const MonoLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  from: number;
  to?: number;
  align?: "left" | "right" | "center";
  point?: [number, number];
  size?: number;
  tone?: "dark" | "light";
}> = ({ text, x, y, from, to = 1e9, align = "left", point, size = 27, tone = "dark" }) => {
  const frame = useG();
  if (frame < from || frame >= to) return null;
  const p = prog(frame, from, 10);
  const out = to < 1e9 ? 1 - prog(frame, to - 6, 6) : 1;
  const bg = tone === "dark" ? "rgba(20,12,8,.72)" : "rgba(255,250,244,.9)";
  const fg = tone === "dark" ? C.texto : C.tinta;
  const line = tone === "dark" ? C.texto : C.tinta;
  const tx = align === "left" ? 0 : align === "right" ? -100 : -50;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: out }}>
      {point && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <line x1={x} y1={y} x2={x + (point[0] - x) * p} y2={y + (point[1] - y) * p} stroke={line} strokeWidth={2.2} strokeDasharray="7 7" />
          <circle cx={point[0]} cy={point[1]} r={7 * p} fill="none" stroke={line} strokeWidth={2.2} />
        </svg>
      )}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(${tx}%, -50%)`,
          ...monoStyle(size, fg),
          background: bg,
          padding: "10px 16px 9px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** <PaperCard/> · papel com fitas adesivas, levemente girado, cai no lugar */
export const PaperCard: React.FC<{ children: React.ReactNode; x: number; y: number; w: number; rot?: number; from: number; tape?: string }> = ({
  children,
  x,
  y,
  w,
  rot = -2,
  from,
  tape = "rgba(233,184,114,.75)",
}) => {
  const frame = useG();
  const p = prog(frame, from, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        transform: `translate(-50%, -50%) translateY(${-(1 - p) * 90}px) rotate(${rot + (1 - p) * -4}deg) scale(${1 + (1 - p) * 0.06})`,
        opacity: p,
        background: C.papel,
        padding: "70px 64px 64px",
        boxShadow: "0 30px 60px rgba(20,8,4,.45), 0 4px 10px rgba(20,8,4,.25)",
        borderRadius: 4,
      }}
    >
      {[
        { left: -30, top: -18, r: -34 },
        { right: -30, top: -18, r: 32 },
      ].map((t, i) => (
        <div key={i} style={{ position: "absolute", width: 170, height: 50, background: tape, left: t.left, right: t.right, top: t.top, transform: `rotate(${t.r}deg)` }} />
      ))}
      {children}
    </div>
  );
};

/** <SealCorner/> · selo da marca fixo no canto superior direito (se a marca tiver um) */
export const SealCorner: React.FC<{ src?: string | null; size?: number }> = ({ src = BRAND.selo, size = 150 }) =>
  src ? (
    <Img
      src={staticFile(src)}
      style={{ position: "absolute", top: 118, right: 52, width: size, transform: "rotate(9deg)", filter: "drop-shadow(0 8px 14px rgba(20,8,4,.45))" }}
    />
  ) : null;

/** <SceneTag/> · rótulo de capítulo no alto à esquerda: "01 · o problema" */
export const SceneTag: React.FC<{ n: string; label: string; from: number; to: number; tone?: "light" | "dark" }> = ({ n, label, from, to, tone = "light" }) => {
  const frame = useG();
  if (frame < from || frame >= to) return null;
  const p = prog(frame, from, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left + 12,
        top: 168,
        fontFamily: F.tecnica,
        fontSize: 25,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: tone === "light" ? C.texto : C.tinta,
        opacity: 0.86 * p,
        transform: `translateX(${(1 - p) * -20}px)`,
      }}
    >
      {n} · {label}
    </div>
  );
};

/** <Grain/> · grão de papel/filme trocado a cada 2 quadros e borrado (não explode o bitrate) */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useG();
  const seed = Math.floor(frame / 2) % 97;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width={W} height={H}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feGaussianBlur stdDeviation="0.6" />
          <feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.6 -.3" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.45 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,5,2,${strength}) 100%)` }} />
);

export const BgGradient: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 15% 0%, ${C.fundoA} 0%, ${C.fundoB} 45%, ${C.fundoC} 100%)` }} />
);

/** <SafeZoneGuide/> · só no preview (props { guides: true }): áreas cobertas pela interface do Reels */
export const SafeZoneGuide: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: SAFE.top, background: "rgba(0,120,255,.18)" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: SAFE.bottom, background: "rgba(0,120,255,.18)" }} />
    <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: SAFE.right, background: "rgba(255,0,120,.14)" }} />
  </AbsoluteFill>
);
