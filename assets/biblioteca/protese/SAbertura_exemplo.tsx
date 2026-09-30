// 1 · A pergunta (v2b). O avião passa no pôr do sol (3D); a câmera acelera até uma janela e corta no pico. Dentro,
// ela (em relevo 2.5D, com a luz coral do celular no rosto) DIGITA a pergunta: a busca é a própria legenda, grande e
// composta como uma tela. Em "explode", a palavra estoura na barra (som de estouro colado na fala). Depois a luz coral
// do celular cresce, cobre a tela e se recolhe no disco coral da prancha da Vênus (a próxima cena).
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { H, W } from "../../brand/brand";
import { fr, le, line, ls, wfind } from "../../engine/timeline";
import { useG } from "../../engine/ui";
import { CameraRig } from "../../three/CameraRig";
import { Aviao3D } from "../Aviao3D";
import { TomadaRelief } from "../TomadaRelief";
import { SC } from "../cenas";
import { easeIn, easeInOut, lerp, P, pp, rnd, T, twos } from "../kit";

export const DENTRO = 44; // corte do avião para dentro da cabine (no pico do empurrão até a janela)

/** o céu do fim de tarde, com o sol baixo e nuvens em duas camadas (paralaxe) */
const Ceu: React.FC<{ g: number; frente?: boolean }> = ({ g, frente }) => {
  const nuvens = Array.from({ length: frente ? 5 : 9 }, (_, i) => {
    const vel = frente ? 26 : 7;
    const x = ((rnd(i + (frente ? 40 : 3)) * 1600 - g * vel) % 1700 + 1700) % 1700 - 300;
    const y = frente ? 1350 + rnd(i + 7) * 500 : 700 + rnd(i + 11) * 900;
    const w = (frente ? 700 : 420) + rnd(i + 5) * 300;
    return { x, y, w };
  });
  return (
    <>
      {!frente && (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(#F4A283 0%, #F7B58F 38%, #F9CBA7 62%, #EE8560 100%)" }} />
          <div style={{ position: "absolute", left: 540 - 230, top: 1180, width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, #FFF1DE 0%, #FFD6B0 45%, rgba(255,214,176,0) 70%)" }} />
        </>
      )}
      {nuvens.map((n, i) => (
        <div key={i} style={{ position: "absolute", left: n.x, top: n.y, width: n.w, height: n.w * 0.32, borderRadius: "50%", background: frente ? "rgba(255,236,222,.92)" : "rgba(255,226,206,.55)", filter: `blur(${frente ? 10 : 6}px)`, boxShadow: frente ? "0 30px 60px rgba(207,108,70,.25)" : undefined }} />
      ))}
    </>
  );
};

/** texto digitado no ritmo da fala: cada palavra aparece letra a letra no tempo em que é dita */
const digitado = (g: number, id: string) => {
  const out: { w: string; parcial: string; explode: boolean }[] = [];
  for (const w of line(id).words) {
    const s = fr(w.s), e = Math.max(s + 3, fr(w.e));
    if (g < s) break;
    const k = Math.min(1, (g - s) / (e - s));
    out.push({ w: w.w, parcial: w.w.slice(0, Math.ceil(w.w.length * k)), explode: w.w.toLowerCase().startsWith("explode") });
  }
  return out;
};

/** a tela de busca do celular dela, trazida para o quadro: grande, centrada, legível (é a legenda da pergunta) */
const Busca: React.FC<{ g: number; fExp: number; op: number }> = ({ g, fExp, op }) => {
  const palavras = digitado(g, "g1");
  const estouro = g >= fExp ? pp(g, fExp, 10) : 0;
  const tremor = g >= fExp && g < fExp + 6 ? [10, -8, 6, -4, 2, 0][g - fExp] : 0;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1210, opacity: op, transform: `translateX(${tremor}px)` }}>
      <div style={{ background: "rgba(252,246,240,.97)", borderRadius: 48, padding: "34px 44px 40px", boxShadow: "0 30px 80px rgba(20,8,4,.5), 0 0 120px rgba(242,148,112,.45)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <svg width={38} height={38} viewBox="0 0 44 44"><circle cx={18} cy={18} r={13} fill="none" stroke={P.coralLo} strokeWidth={5} /><line x1={28} y1={28} x2={40} y2={40} stroke={P.coralLo} strokeWidth={6} strokeLinecap="round" /></svg>
          <div style={{ ...T.mono(26, P.cinza) }}>pesquisar</div>
        </div>
        <div style={{ fontFamily: "Mont", fontWeight: 900, fontSize: 74, lineHeight: 1.04, letterSpacing: "-0.035em", color: P.ink, minHeight: 154 }}>
          {palavras.map((p, i) => (
            <span key={i}>
              {i > 0 ? " " : ""}
              {p.explode ? (
                <span style={{ position: "relative", display: "inline-block", color: estouro > 0 ? P.coralLo : P.ink, transform: `scale(${1 + 0.18 * Math.sin(Math.min(1, estouro) * Math.PI)})`, transformOrigin: "50% 60%" }}>
                  <span style={{ position: "absolute", left: "-3%", right: "-3%", top: "18%", bottom: "4%", background: "rgba(242,148,112,.28)", borderRadius: 8, transform: `scaleX(${estouro})`, transformOrigin: "0 50%", zIndex: -1 }} />
                  {p.parcial}
                </span>
              ) : p.parcial}
            </span>
          ))}
          <span style={{ display: "inline-block", width: 6, height: 70, marginLeft: 6, background: P.coralLo, verticalAlign: "-10px", opacity: Math.floor(g / 7) % 2 === 0 || palavras.length < line("g1").words.length ? 1 : 0 }} />
        </div>
      </div>
      {/* linhas de impacto do estouro, saindo da barra */}
      {g >= fExp && g < fExp + 8 && (
        <svg width={960} height={400} style={{ position: "absolute", left: 0, top: -120, overflow: "visible" }}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2, r0 = 250 + twos(g - fExp) * 40, r1 = r0 + 80;
            return <line key={i} x1={480 + Math.cos(a) * r0} y1={250 + Math.sin(a) * r0 * 0.55} x2={480 + Math.cos(a) * r1} y2={250 + Math.sin(a) * r1 * 0.55} stroke={P.coralHi} strokeWidth={10} strokeLinecap="round" opacity={1 - (g - fExp) / 8} />;
          })}
        </svg>
      )}
    </div>
  );
};

export const SAbertura: React.FC = () => {
  const g = useG();
  const fG1 = ls("g1"), fExp = wfind("g1", "explode"), fimG1 = le("g1");
  const fim = SC.abertura[1];
  // ── A · o avião passa (e a câmera acelera até uma janela, cortando no pico) ──
  const passa = interpolate(g, [0, DENTRO], [-5.2, 2.2], { extrapolateRight: "clamp" }); // cruza o centro por volta do quadro 26
  const empurra = pp(g, 28, DENTRO - 28, easeIn);
  // ── B · ela digita (relevo 2.5D, câmera dolly lenta, luz coral do celular) ──
  const pB = pp(g, DENTRO, fim - DENTRO, easeInOut);
  const luz = pp(g, DENTRO, 10) * (0.85 + 0.15 * Math.sin(g * 0.6));
  // ── C · a luz coral cresce e se recolhe no disco da Vênus ──
  const cobre = pp(g, fimG1 + 2, 10, easeIn);
  const recolhe = pp(g, fimG1 + 14, fim - fimG1 - 14, easeInOut);
  const R = lerp(lerp(60, 2300, cobre), 470, recolhe);
  const cy = lerp(1060, 820, recolhe);
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1210" }}>
      {g < DENTRO && (
        <AbsoluteFill>
          <Ceu g={g} />
          <AbsoluteFill style={{ transform: `scale(${1 + empurra * 1.8})`, transformOrigin: "560px 900px" }}>
            <ThreeCanvas width={W} height={H}>
              <ambientLight intensity={0.75} />
              <directionalLight position={[3, 1, 5]} intensity={2.3} color="#FFE3CC" />
              <directionalLight position={[-4, -1, -3]} intensity={1.0} color="#F29470" />
              <CameraRig pos={[passa * 0.25, 0.9, 11]} target={[passa * 0.35, 0, 0]} fov={34} />
              <Aviao3D pos={[passa, 0, 0]} rot={[0.03, 0.42, -0.06]} escala={0.58} />
            </ThreeCanvas>
          </AbsoluteFill>
          <Ceu g={g} frente />
          {/* o fio: altitude */}
          <div style={{ position: "absolute", left: 60, top: 230 }}>
            <div style={{ ...T.mono(24, P.ink2) }}>altitude</div>
            <div style={{ ...T.italica(84, P.ink, 800) }}>10.668 m</div>
          </div>
        </AbsoluteFill>
      )}
      {g >= DENTRO && (
        <AbsoluteFill>
          <TomadaRelief n={7} foco={[858, lerp(560, 600, pB)]} esc={lerp(1.9, 2.1, pB)} orbita={[lerp(-0.05, 0.05, pB), lerp(0.02, -0.02, pB)]} amt={0.18} glowUv={[0.5, 0.52]} glow={luz} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,10,8,0) 50%, rgba(20,10,8,.55) 80%)" }} />
          <Busca g={g} fExp={fExp} op={pp(g, fG1 - 8, 8) * (1 - cobre)} />
        </AbsoluteFill>
      )}
      {cobre > 0 && (
        <AbsoluteFill style={{ backgroundColor: recolhe > 0 ? `rgba(244,232,219,${recolhe})` : "transparent" }}>
          <div style={{ position: "absolute", left: 540 - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: "50%", background: `radial-gradient(circle at 50% 30%, ${P.coralHi}, ${P.coral} 45%, ${P.coralLo})` }} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
