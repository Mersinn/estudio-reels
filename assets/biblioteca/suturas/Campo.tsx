// <Campo/> · a visão do estudante (primeira pessoa) no campo cirúrgico.
// A paciente é a Vênus de mármore (paciente-modelo ética da liga): pelo recorte do campo aparece o
// ombro dela, com uma incisão reta. Foco cirúrgico no alto (o círculo, motivo que termina na logo).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useG } from "../engine/ui";
import { d, lerp, P, Pt, T } from "./kit";
import { Personagem } from "./Personagens";

export const INC: { a: Pt; b: Pt; c: Pt } = { a: [372, 1062], b: [708, 984], c: [540, 1023] }; // incisão na tela

/** tremor determinístico (soma de senos) */
const tremor = (g: number, k: number, amp: number): Pt => [
  amp * (Math.sin(g * 0.9 + k) * 0.6 + Math.sin(g * 2.3 + k * 1.7) * 0.4),
  amp * (Math.sin(g * 1.1 + k * 2.1) * 0.6 + Math.sin(g * 2.9 + k * 0.7) * 0.4),
];

export const Campo: React.FC<{
  nervoso?: number; // 0..1 tremor + pulsação + túnel
  bpm?: number;
  fechado?: number; // 0..1 incisão fechando (intradérmico: some a linha)
  zoom?: number; // 1 = normal
  foco?: Pt; // centro do zoom
  instrumentos?: number; // 0..1 presença dos instrumentos
  hud?: number; // 0..1
  desfoque?: number; // px
  entre?: React.ReactNode; // camada entre a paciente e os instrumentos (tipografia que os instrumentos cobrem)
  preceptor?: { fala: number; cabeca?: number; op?: number }; // do outro lado da mesa, desfocado
}> = ({ nervoso = 0, bpm = 96, fechado = 0, zoom = 1, foco = INC.c, instrumentos = 1, hud = 1, desfoque = 0, entre, preceptor }) => {
  const g = useG();
  // batimento: pulso curto a cada batida
  const beat = (g / 30) * (bpm / 60);
  const ph = beat - Math.floor(beat);
  const pulse = Math.exp(-ph * 9) * nervoso;
  const sway: Pt = [Math.sin(g / 41) * 6, Math.sin(g / 53) * 5];
  const sc = zoom * (1 + pulse * 0.014);
  const tr = tremor(g, 1, 2 + nervoso * 5);
  const tl = tremor(g, 4, 2 + nervoso * 4);
  const open = 1 - fechado;
  const lip = 7 * open + 1.5;
  return (
    <AbsoluteFill style={{ background: P.night, overflow: "hidden", filter: desfoque ? `blur(${desfoque}px)` : undefined }}>
      <AbsoluteFill style={{ transform: `translate(${sway[0]}px, ${sway[1]}px) scale(${sc})`, transformOrigin: `${foco[0]}px ${foco[1]}px` }}>
        {/* do outro lado da mesa: o preceptor (desfocado, em segundo plano) */}
        {preceptor && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, filter: "blur(3.5px)", opacity: preceptor.op ?? 1 }}>
            <Personagem tipo="preceptor" x={780} y={760} escala={1.05} virado={-1} cabeca={preceptor.cabeca ?? 14} olhos="baixo" fala={preceptor.fala} maos={0.9} />
          </svg>
        )}
        {/* campo (tecido): começa na borda de lá da mesa */}
        <div
          style={{
            position: "absolute", left: -60, right: -60, top: preceptor ? 600 : -200, bottom: -200, borderRadius: "60px 60px 0 0",
            boxShadow: "0 -20px 40px rgba(10,4,2,.5)",
            background: `repeating-linear-gradient(104deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 90px, rgba(255,220,200,.035) 120px, rgba(0,0,0,.08) 170px, rgba(255,255,255,0) 210px), radial-gradient(90% 70% at 50% 40%, #5a2a1c 0%, #3a1a11 55%, #1d0d08 100%)`,
          }}
        />
        {/* janela do campo com a paciente-modelo */}
        <div
          style={{
            position: "absolute", left: 130, top: 700, width: 820, height: 640, borderRadius: 44, overflow: "hidden",
            boxShadow: "inset 0 0 0 10px rgba(255,235,220,.10), inset 0 30px 60px rgba(20,8,4,.55), 0 0 0 3px rgba(20,8,4,.4)",
          }}
        >
          <Img src={staticFile("img/venus_hq.png")} style={{ position: "absolute", width: 2600, left: -700, top: -1480, filter: "saturate(1.05) contrast(1.02)" }} />
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 24px 50px rgba(20,8,4,.5), inset 0 -20px 40px rgba(20,8,4,.35)" }} />
        </div>
        {/* incisão */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="inc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6b2616" stopOpacity={0} />
              <stop offset="0.1" stopColor="#6b2616" />
              <stop offset="0.9" stopColor="#6b2616" />
              <stop offset="1" stopColor="#6b2616" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={d([INC.a, INC.b])} stroke="url(#inc)" strokeWidth={lip * 2.2} strokeLinecap="round" opacity={0.25 + 0.75 * open} />
          <path d={d([INC.a, INC.b])} stroke="#3e130a" strokeWidth={lip * 0.9} strokeLinecap="round" opacity={open} />
          {/* bordas da incisão (lábios claros) */}
          {[-1, 1].map((s) => (
            <path key={s} d={d([[INC.a[0], INC.a[1] + s * lip], [INC.b[0], INC.b[1] + s * lip]])} stroke="rgba(255,225,205,.55)" strokeWidth={2.4} strokeLinecap="round" opacity={open} />
          ))}
          {/* linha fechada: fina e clara */}
          <path d={d([INC.a, INC.b])} stroke={P.goldHi} strokeWidth={3} strokeLinecap="round" opacity={fechado * 0.9} />
        </svg>
        {entre}
        {/* instrumentos: pinça (esq.) e porta-agulha com agulha e fio (dir.) */}
        {instrumentos > 0 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: instrumentos }}>
            <defs>
              <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f3efe9" />
                <stop offset="0.45" stopColor="#a9a39c" />
                <stop offset="0.55" stopColor="#d8d2cb" />
                <stop offset="1" stopColor="#6f6861" />
              </linearGradient>
            </defs>
            <g transform={`translate(${tl[0]},${tl[1]})`}>
              <path d="M-40,1980 L420,1086 L438,1094 L10,2000 Z" fill="url(#metal)" stroke="#4a4540" strokeWidth={2} />
              <path d="M-10,1990 L436,1100 L446,1112 L30,2000 Z" fill="url(#metal)" stroke="#4a4540" strokeWidth={2} opacity={0.9} />
            </g>
            <g transform={`translate(${tr[0]},${tr[1]})`}>
              {/* fio saindo da agulha até fora do quadro */}
              <path d={`M662,1046 C720,1150 860,1210 980,1330 S1110,1560 1140,1700`} fill="none" stroke={P.fio} strokeWidth={4} />
              <path d="M1160,1960 L668,1070 L690,1058 L1210,1930 Z" fill="url(#metal)" stroke="#4a4540" strokeWidth={2} />
              <path d="M668,1070 L650,1040 L676,1030 L690,1058 Z" fill="#8d867f" />
              {/* agulha curva presa na ponta */}
              <path d="M612,1000 A44,44 0 0 0 694,1046" fill="none" stroke="#5b5550" strokeWidth={8} strokeLinecap="round" />
              <path d="M612,1000 A44,44 0 0 0 694,1046" fill="none" stroke="#e2ddd8" strokeWidth={4.5} strokeLinecap="round" />
            </g>
          </svg>
        )}
      </AbsoluteFill>
      {/* foco cirúrgico: o círculo */}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(60% 34% at 50% 44%, rgba(255,236,210,.26) 0%, rgba(255,236,210,.08) 45%, rgba(0,0,0,0) 70%)", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", left: 540 - 300, top: -380, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,246,230,.95) 0%, rgba(255,226,190,.55) 30%, rgba(255,200,150,0) 70%)", filter: "blur(4px)" }} />
      <div style={{ position: "absolute", left: 540 - 250, top: -330, width: 500, height: 500, borderRadius: "50%", border: "6px solid rgba(255,240,220,.35)" }} />
      {/* túnel do nervosismo */}
      <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(${lerp(95, 62, nervoso)}% ${lerp(70, 44, nervoso)}% at 50% 54%, rgba(10,4,2,0) 55%, rgba(10,4,2,${0.35 + nervoso * 0.45 + pulse * 0.2}) 100%)` }} />
      {hud > 0 && <Hud g={g} bpm={bpm} op={hud} nervoso={nervoso} />}
    </AbsoluteFill>
  );
};

/** HUD de jogo: missão + frequência cardíaca com traçado de ECG */
const Hud: React.FC<{ g: number; bpm: number; op: number; nervoso: number }> = ({ g, bpm, op, nervoso }) => {
  const pts: Pt[] = [];
  const period = (60 / bpm) * 30; // quadros por batida
  for (let i = 0; i <= 90; i++) {
    const t = (g - 90 + i) / period;
    const ph = t - Math.floor(t);
    let y = 0;
    if (ph > 0.1 && ph < 0.14) y = -8;
    else if (ph >= 0.18 && ph < 0.2) y = 10;
    else if (ph >= 0.2 && ph < 0.23) y = -42;
    else if (ph >= 0.23 && ph < 0.26) y = 16;
    else if (ph > 0.42 && ph < 0.52) y = -9 * Math.sin(((ph - 0.42) / 0.1) * Math.PI);
    pts.push([i * 3.2, y]);
  }
  const red = nervoso > 0.5;
  return (
    <div style={{ position: "absolute", left: 72, top: 236, opacity: op }}>
      <div style={{ ...T.mono(22, P.ink), background: P.gold, display: "inline-block", padding: "9px 16px 8px", borderRadius: 999 }}>missão · fechar a pele</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 18 }}>
        <svg width={290} height={70} viewBox="0 -45 290 70">
          <path d={d(pts)} fill="none" stroke={red ? "#FF9A7A" : P.goldHi} strokeWidth={3.4} strokeLinejoin="round" />
        </svg>
        <div style={{ ...T.mono(24, P.cream), opacity: 0.9 }}>
          FC <span style={{ ...T.pesada(46, red ? "#FFB39A" : P.cream), letterSpacing: "-0.02em" }}>{Math.round(bpm)}</span>
        </div>
      </div>
    </div>
  );
};
