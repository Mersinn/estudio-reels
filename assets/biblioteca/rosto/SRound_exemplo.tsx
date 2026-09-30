// 3–5 · Os três rounds. Mesma máquina, conteúdo próprio:
//  A · arena (locutor): gongo, "ROUND N", a luva azul acelera (curva de velocidade) e o corte cai no pico: no quadro
//      seguinte a Vênus já está deformando (mola com sobra), anel do impacto, tremida de 3 quadros com semente.
//  B · replay (médica): o quadro congela, vira P&B e recua até virar uma foto impressa na mesa do comentarista
//      (recuo até a moldura); a caneta dela desenha por cima (telestração) e as provas reais pousam.
// O dano é cumulativo (o round 2 começa com o lábio do round 1): o placar mostra os três juntos.
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { H, W } from "../../brand/brand";
import { ls } from "../../engine/timeline";
import { useG } from "../../engine/ui";
import { CameraRig } from "../../three/CameraRig";
import { SC } from "../cenas";
import { Arena } from "../Arena";
import { Luva3D } from "../Luva3D";
import { BULLHORN, CIANO, Malha, Marcas } from "../Malha";
import { FiltroFx, L, naTela, RostoFx, Vista } from "../RostoFx";
import { NarizPerfil, OlhoFecha } from "../Diagramas";
import { SeloComentarista } from "../Medica";
import { we, wn } from "./comum";
import { curva, dPath, easeIn, easeInOut, Foto, lerp, P, Papel, pouso, pp, rnd, T, trecho, twos } from "../kit";

type Rect = { x: number; y: number; w: number; h: number };
type Cfg = {
  n: 1 | 2 | 3; win: "r1" | "r2" | "r3"; loc: string; alvo: string; nome: string; impC: [number, number];
  antes: FiltroFx; golpe: (k: number) => FiltroFx; print: Rect; zoomPrint: number; meds: string[];
};

const vA: Vista = { cx: 300, cy: 400, zoom: 1.25, x: 560, y: 1000 };
const mola = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-t / 3) * Math.cos(t * 0.55));
const lerpV = (a: Vista, b: Vista, t: number): Vista => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), zoom: lerp(a.zoom, b.zoom, t), x: lerp(a.x ?? W / 2, b.x ?? W / 2, t), y: lerp(a.y ?? H / 2, b.y ?? H / 2, t) });
const PX = 1920 / (2 * 10 * Math.tan((20 * Math.PI) / 180)); // px por unidade no plano z=0 (câmera z=10, fov 40)

/** o traço da caneta do comentarista (telestração), em progresso, na cor coral */
export const Caneta: React.FC<{ pts: [number, number][]; p: number; cor?: string; esp?: number; seed?: number }> = ({ pts, p, cor = P.coral, esp = 7, seed = 1 }) => {
  if (p <= 0) return null;
  const c = curva(pts, 10).map(([x, y], i) => [x + (rnd(seed + i) - 0.5) * 2, y + (rnd(seed * 3 + i) - 0.5) * 2] as [number, number]);
  const t = trecho(c, p);
  return <path d={dPath(t.pts)} fill="none" stroke={cor} strokeWidth={esp} strokeLinecap="round" strokeLinejoin="round" />;
};
const circuloPts = (cx: number, cy: number, rx: number, ry: number, n = 40): [number, number][] =>
  Array.from({ length: n + 4 }, (_, i) => { const a = -2 + (i / n) * Math.PI * 2; return [cx + rx * Math.cos(a) * (1 + 0.04 * Math.sin(i)), cy + ry * Math.sin(a)]; });

// ── o conteúdo de cada replay ─────────────────────────────────────────────────────────────
const Replay1: React.FC<{ g: number; v: Vista }> = ({ g, v }) => {
  const fLip = wn("med3", "lip"), fFaixa = wn("med3", "pele"), fNariz = we("med3", "nariz"), fTres = wn("med3", "tres"), fMm = wn("med3", "milimetros"), fCic = wn("med3", "cicatriz"), fQuer = wn("med3", "filtro");
  const a = naTela(v, BULLHORN.cima[6]), sub = naTela(v, L.subnasal), lab = naTela(v, L.labioSup);
  const cic = pp(g, fCic - 2, 12);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* a régua da medida real: base do nariz → lábio */}
        {g >= fMm - 4 && (
          <g opacity={pp(g, fMm - 4, 6)}>
            <line x1={a[0] + 80} y1={sub[1]} x2={a[0] + 80} y2={lab[1]} stroke={P.coral} strokeWidth={6} />
            <line x1={a[0] + 62} y1={sub[1]} x2={a[0] + 98} y2={sub[1]} stroke={P.coral} strokeWidth={6} />
            <line x1={a[0] + 62} y1={lab[1]} x2={a[0] + 98} y2={lab[1]} stroke={P.coral} strokeWidth={6} />
          </g>
        )}
        {/* "não o que o filtro quer": a medida do filtro (ciano, bem maior) aparece e é riscada */}
        {g >= fQuer - 2 && (
          <g opacity={pp(g, fQuer - 2, 6)}>
            <line x1={a[0] + 150} y1={sub[1]} x2={a[0] + 150} y2={lab[1] + 110} stroke="#5FD4FF" strokeWidth={6} strokeDasharray="12 8" />
            <line x1={a[0] + 132} y1={sub[1]} x2={a[0] + 168} y2={sub[1]} stroke="#5FD4FF" strokeWidth={6} />
            <line x1={a[0] + 132} y1={lab[1] + 110} x2={a[0] + 168} y2={lab[1] + 110} stroke="#5FD4FF" strokeWidth={6} />
            <line x1={a[0] + 118} y1={sub[1] + 20} x2={a[0] + 184} y2={lab[1] + 90} stroke={P.coral} strokeWidth={8} opacity={pp(g, fQuer + 6, 6)} />
          </g>
        )}
        {/* a cicatriz: a linha na base do nariz acende */}
        {cic > 0 && <path d={dPath(curva(BULLHORN.cima.map((q) => naTela(v, q)) as [number, number][], 10))} fill="none" stroke="#FFB08A" strokeWidth={9} opacity={cic} style={{ filter: "drop-shadow(0 0 8px rgba(255,140,90,.9))" }} />}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, pointerEvents: "none" }}>
        <Marcas v={v} lip={pp(g, fFaixa, fNariz - fFaixa, easeInOut)} cor={P.coral} />
      </div>
      {g >= fMm && <div style={{ position: "absolute", left: a[0] + 20, top: lab[1] + 20, ...T.manuscrita(66, P.coral), opacity: pp(g, fMm, 6) }}>~3 mm</div>}
      {g >= fQuer && <div style={{ position: "absolute", left: a[0] + 176, top: sub[1] + 10, ...T.manuscrita(56, "#2F9BD6"), opacity: pp(g, fQuer, 6) }}>filtro</div>}
      {cic > 0 && <div style={{ position: "absolute", left: sub[0] - 250, top: sub[1] - 110, ...T.manuscrita(64, "#FFB08A"), opacity: cic }}>cicatriz</div>}
      {g >= fLip && <div style={{ position: "absolute", left: 70, top: 225, ...T.mono(28, P.ink2), background: P.marca, padding: "6px 12px", opacity: pp(g, fLip, 5) }}>na vida real: lip lift</div>}
      <Foto id="lip_lift" x={790} y={1260} w={460} f={fLip + 8} rot={4} legenda="lip lift real · antes | depois · CC BY-SA" seed={3} />
      {g >= fTres && (
        <div style={{ position: "absolute", left: 70, top: 1120, width: 330, opacity: pp(g, fTres, 8) }}>
          <div style={{ ...T.mono(22, P.ink2) }}>filtro do lábio</div>
          <div style={{ ...T.serifa(92, P.ink) }}>14 → 11 <span style={{ ...T.mono(34, P.ink) }}>mm</span></div>
          <div style={{ ...T.mono(19, P.cinza), marginTop: 8 }}>revisão sistemática · 1.754 pacientes · komisarek 2026</div>
        </div>
      )}
    </>
  );
};

const Replay2: React.FC<{ g: number }> = ({ g }) => {
  const fOsso = wn("med4", "osso"), fCart = wn("med4", "cartilagem"), fPele = wn("med4", "pele"), fAfina = wn("med4", "afina"), fEsq = wn("med4", "esqueleto"), fSoz = wn("med4", "sozinha");
  const fGrossa = wn("med5", "grossa"), fEsp = wn("med5", "espaco"), fCic = wn("med5", "cicatriz"), fBico = wn("med5", "bico"), fPap = wn("med5", "papagaio");
  const fRegra = wn("med5b", "regra"), fPrev = wn("med5b", "previne"), fPeleB = wn("med5b", "pele"), fMede = wn("med5b", "mede");
  const sai = pp(g, fRegra - 6, 10); // a arara e a prancha saem para as cartas do contexto entrarem
  const pinca = pp(g, fPeleB - 2, 10, easeInOut); // o paquímetro mede a espessura da pele no desenho
  return (
    <>
      {sai < 1 && <div style={{ opacity: 1 - sai }}><Foto id="gray_nariz_lado" x={830} y={470} w={250} f={fCart} rot={5} legenda="cartilagens · gray" seed={6} cor /></div>}
      <NarizPerfil
        x={420} y={700} esc={1.05}
        osso={pp(g, fOsso - 2, 8)} cart={pp(g, fCart - 2, 8)} pele={pp(g, fPele - 2, 8)}
        reduz={pp(g, fEsq - 2, 14, easeInOut)} espaco={pp(g, fEsp - 2, 10)} cicatriz={pp(g, fCic, 14, easeInOut)} bico={pp(g, fBico - 4, 12, pouso)}
        rotulos={1 - pp(g, fEsp - 6, 6)}
      />
      {/* "o filtro afina tudo": a silhueta afinada do app, em ciano, passa por cima e some (ela ignora as camadas) */}
      {g >= fAfina - 2 && g < fSoz + 10 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: pp(g, fAfina - 2, 6) * (1 - pp(g, fEsq, 10)) }}>
          <path d="M600,760 C660,860 760,990 880,1120 C905,1150 900,1190 860,1195 C830,1198 800,1190 780,1200" fill="none" stroke="#5FD4FF" strokeWidth={8} strokeDasharray="14 10" />
          <text x={900} y={1080} fontFamily="Mono" fontWeight={600} fontSize={26} fill="#2F9BD6">FILTRO</text>
        </svg>
      )}
      {g >= fGrossa - 2 && g < fEsp && <div style={{ position: "absolute", left: 470, top: 700, ...T.manuscrita(58, P.coralLo), opacity: pp(g, fGrossa - 2, 6) }}>pele grossa</div>}
      {g >= fEsp && <div style={{ position: "absolute", left: 470, top: 700, ...T.manuscrita(58, "#C99A2E"), opacity: pp(g, fEsp, 6) * (1 - pp(g, fCic, 8)) }}>espaço morto</div>}
      {g >= fCic && <div style={{ position: "absolute", left: 470, top: 700, ...T.manuscrita(58, P.coralLo), opacity: pp(g, fCic, 6) * (1 - sai) }}>cicatriz</div>}
      {sai < 1 && <div style={{ opacity: 1 - sai }}><Foto id="papagaio" x={290} y={560} w={380} f={fPap} rot={-6} seed={8} legenda="bico de papagaio · CC BY-SA" cor /></div>}
      {/* o contexto: complicação, não regra (causas) · o que o cirurgião faz (prevenção) */}
      {g >= fRegra - 2 && (
        <div style={{ position: "absolute", left: 60, top: 250, width: 470, background: P.cream, padding: "20px 22px", boxShadow: "10px 20px 34px rgba(60,24,10,.25)", transform: `rotate(-2deg) translateY(${(1 - pp(g, fRegra - 2, 10, pouso)) * -60}px)`, opacity: pp(g, fRegra - 2, 6) }}>
          <div style={{ ...T.mono(20, P.coralLo) }}>pollybeak · complicação, não regra</div>
          <div style={{ ...T.pesada(34, P.ink), marginTop: 8 }}>por que acontece</div>
          {["cicatriz no espaço morto (pele grossa)", "cartilagem que ficou alta", "ponta que perdeu apoio"].map((t, i) => (
            <div key={i} style={{ ...T.italica(30, P.ink2, 600), marginTop: 6, opacity: pp(g, fRegra + 4 + i * 5, 6) }}>· {t}</div>
          ))}
          <div style={{ ...T.mono(17, P.cinza), marginTop: 10 }}>aldosari 2023 · conrad 2003</div>
        </div>
      )}
      {g >= fPrev - 2 && (
        <div style={{ position: "absolute", left: 560, top: 290, width: 460, background: "#F7EDE4", padding: "20px 22px", boxShadow: "10px 20px 34px rgba(60,24,10,.25)", transform: `rotate(2deg) translateY(${(1 - pp(g, fPrev - 2, 10, pouso)) * -60}px)`, opacity: pp(g, fPrev - 2, 6) }}>
          <div style={{ ...T.mono(20, P.coralLo) }}>o que o cirurgião faz</div>
          {["avalia a espessura da pele", "fecha o espaço morto", "corticoide se começar cedo"].map((t, i) => (
            <div key={i} style={{ ...T.pesada(30, P.ink), marginTop: 8, opacity: pp(g, fPrev + 3 + i * 5, 6) }}>{t}</div>
          ))}
        </div>
      )}
      {/* "avaliando a sua pele": o paquímetro mede o envelope no desenho · "filtro nenhum mede" */}
      {pinca > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g opacity={pinca} stroke={P.ink} strokeWidth={5} fill="none">
            <line x1={lerp(760, 720, pinca)} y1={1020} x2={lerp(760, 720, pinca)} y2={1140} />
            <line x1={lerp(860, 805, pinca)} y1={1020} x2={lerp(860, 805, pinca)} y2={1140} />
            <line x1={lerp(760, 720, pinca)} y1={1040} x2={lerp(860, 805, pinca)} y2={1040} />
          </g>
        </svg>
      )}
      {g >= fMede - 2 && <div style={{ position: "absolute", left: 640, top: 1170, ...T.manuscrita(54, P.coralLo), opacity: pp(g, fMede - 2, 6) }}>espessura da pele</div>}
    </>
  );
};

const Replay3: React.FC<{ g: number; v: Vista }> = ({ g, v }) => {
  const fGlobo = wn("med6", "globo"), fPalp = wn("med6", "palpebra"), fDemais = wn("med6", "demais"), fTire = wn("med6", "tire"), fFecha = wn("med6", "fecha");
  const e = naTela(v, L.olhoA), s = naTela(v, L.sobA);
  const r = 50 * v.zoom;
  const lid = naTela(v, [182, 252]);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <Caneta pts={circuloPts(e[0], e[1], r, r * 0.8)} p={pp(g, fGlobo - 2, 12, easeInOut)} seed={3} />
        {/* ≥ 20 mm entre a sobrancelha e os cílios */}
        {g >= fPalp + 4 && (
          <g opacity={pp(g, fPalp + 4, 6)} stroke={P.coral} strokeWidth={5}>
            <line x1={s[0] - 70} y1={s[1]} x2={s[0] - 70} y2={lid[1]} />
            <line x1={s[0] - 86} y1={s[1]} x2={s[0] - 54} y2={s[1]} />
            <line x1={s[0] - 86} y1={lid[1]} x2={s[0] - 54} y2={lid[1]} />
          </g>
        )}
        {/* o excesso: uma faixa grande demais de pele marcada */}
        {g >= fDemais - 4 && (
          <path d={`M${lid[0] - 60},${lid[1] + 4} Q${lid[0]},${s[1] + 6} ${lid[0] + 60},${lid[1] + 4} Q${lid[0]},${lid[1] + 26} ${lid[0] - 60},${lid[1] + 4}Z`} fill="rgba(238,133,96,.55)" stroke={P.coralLo} strokeWidth={4} opacity={pp(g, fDemais - 4, 8)} />
        )}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
        <Marcas v={v} olho={pp(g, fPalp, 12, easeInOut)} cor={P.coral} />
      </div>
      {g >= fGlobo && <div style={{ position: "absolute", left: e[0] + r + 10, top: e[1] - 60, ...T.manuscrita(72, P.coral), opacity: pp(g, fGlobo + 4, 6) }}>24 mm</div>}
      {g >= fPalp + 4 && <div style={{ position: "absolute", left: s[0] - 250, top: (s[1] + lid[1]) / 2 - 36, ...T.manuscrita(56, P.coral), opacity: pp(g, fPalp + 4, 6) }}>≥ 20 mm</div>}
      {g >= fGlobo && (
        <div style={{ position: "absolute", left: 760, top: 400, width: 280, opacity: pp(g, fGlobo, 8) }}>
          <div style={{ ...T.mono(22, P.ink2) }}>globo ocular</div>
          <div style={{ ...T.serifa(92, P.ink) }}>~24 <span style={{ ...T.mono(34, P.ink) }}>mm</span></div>
          <div style={{ ...T.mono(19, P.cinza), marginTop: 8 }}>em quase todo adulto · bekerman 2014</div>
        </div>
      )}
      {g >= fTire && <OlhoFecha x={30} y={1070} esc={1.35} p={pp(g, fFecha - 10, 18, easeInOut)} />}
    </>
  );
};

export const CFG: Record<"r1" | "r2" | "r3", Cfg> = {
  r1: { n: 1, win: "r1", loc: "loc3", alvo: "labio", nome: "LÁBIO", impC: [340, 470], antes: {}, golpe: (k) => ({ lip: k, gloss: 0.3 * k }), print: { x: 70, y: 300, w: 640, h: 720 }, zoomPrint: 1.2, meds: ["med3"] },
  r2: { n: 2, win: "r2", loc: "loc4", alvo: "nariz", nome: "NARIZ", impC: [360, 360], antes: { lip: 1, gloss: 0.3 }, golpe: (k) => ({ lip: 1, nose: k, gloss: 0.3 + 0.3 * k }), print: { x: 60, y: 250, w: 420, h: 500 }, zoomPrint: 0.95, meds: ["med4", "med5", "med5b"] },
  r3: { n: 3, win: "r3", loc: "loc5", alvo: "olho", nome: "OLHAR", impC: [182, 262], antes: { lip: 1, nose: 1, gloss: 0.6 }, golpe: (k) => ({ lip: 1, nose: 1, eye: k, brow: k, gloss: 0.6 + 0.4 * k }), print: { x: 70, y: 300, w: 640, h: 720 }, zoomPrint: 1.45, meds: ["med6"] },
};

export const SRound: React.FC<{ r: "r1" | "r2" | "r3" }> = ({ r }) => {
  const g = useG();
  const c = CFG[r];
  const f0 = SC[c.win][0];
  const fBell = wn(c.loc, "Round"), fImp = wn(c.loc, c.alvo), fReplay = ls(c.meds[0]) - 8;
  // ── A · o golpe ──
  const k = mola(g - fImp);
  const fxGolpe = c.golpe(Math.max(0, Math.min(1.12, k)));
  const vB: Vista = { cx: c.impC[0], cy: c.impC[1], zoom: 1.6, x: 640, y: 930 };
  const tight = g >= fImp;
  const treme = g >= fImp && g < fImp + 4 ? [(rnd(g) - 0.5) * 36, (rnd(g * 3) - 0.5) * 36] : [0, 0];
  // ── B · replay → foto na mesa ──
  const rec = pp(g, fReplay, 16, easeInOut);
  const pr = c.print;
  const vP: Vista = { cx: c.impC[0], cy: c.impC[1], zoom: c.zoomPrint, x: pr.x + pr.w / 2, y: pr.y + pr.h / 2 };
  const v = g < fReplay ? (tight ? vB : lerpV(vA, { ...vA, zoom: 1.32 }, pp(g, f0, fImp - f0))) : lerpV(vB, vP, rec);
  // no replay o lábio mostra o que a cirurgia faz de verdade (r1) · o olho volta ao tamanho real (r3)
  let fx: FiltroFx = { ...fxGolpe, impacto: g >= fImp ? pp(g, fImp, 14) : 0, impC: c.impC, pb: rec * 0.7 };
  if (r === "r1" && g >= fReplay) fx = { ...fx, lip: lerp(1, 0.32, pp(g, wn("med3", "sobe"), 16, easeInOut)) };
  if (r === "r3" && g >= fReplay) fx = { ...fx, eye: lerp(1, 0, pp(g, wn("med6", "cresce"), 14, easeInOut)), brow: lerp(1, 0, pp(g, wn("med6", "cresce"), 14, easeInOut)) };
  const clip = { x: lerp(0, pr.x, rec), y: lerp(0, pr.y, rec), w: lerp(W, pr.w, rec), h: lerp(H, pr.h, rec) };
  // a luva: acelera nos 12 quadros antes do impacto, some no corte, recua depois
  const ida = pp(g, fImp - 12, 12, easeIn);
  const imp = naTela(tight ? vB : v, c.impC);
  const hx = (imp[0] - 540) / PX - (tight ? 1.15 : 0.9), hy = -(imp[1] - 960) / PX;
  const volta = pp(g, fImp + 1, 7, easeInOut);
  const lx = g < fImp ? lerp(-9, hx, ida) : lerp(hx + 0.25, -9, volta);
  const mostraLuva = g >= fImp - 12 && g < fImp + 8 && rec === 0;
  const tag = pp(twos(g - fBell), 0, 6);
  return (
    <AbsoluteFill style={{ background: "#120807" }}>
      {rec > 0 && <AbsoluteFill style={{ opacity: rec }}><Papel grade /></AbsoluteFill>}
      {rec < 1 && (
        <AbsoluteFill style={{ opacity: 1 - rec }}>
          <Arena g={g} luz={{ azul: 0.4, coral: 0.6, centro: 0.7 }} agito={g >= fImp ? 1 : 0.5} chao={1800} plateiaTopo={1650} ringue={false} />
        </AbsoluteFill>
      )}
      {/* sombra e borda branca da foto do replay */}
      {rec > 0 && <div style={{ position: "absolute", left: clip.x - 18, top: clip.y - 18, width: clip.w + 36, height: clip.h + 36, background: "#F7F1E8", boxShadow: `12px 22px 40px rgba(40,15,5,${0.35 * rec})`, transform: `rotate(${-2 * rec}deg)` }} />}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(${clip.y}px ${W - clip.x - clip.w}px ${H - clip.y - clip.h}px ${clip.x}px)`, transform: `translate(${treme[0]}px, ${treme[1]}px) rotate(${-2 * rec}deg)`, transformOrigin: `${clip.x + clip.w / 2}px ${clip.y + clip.h / 2}px` }}>
        <AbsoluteFill style={{ background: rec > 0 ? "#1d1210" : "transparent" }} />
        <RostoFx fx={fx} v={v} />
        <Malha v={v} fx={fx} on={1} op={0.35 * (1 - rec)} t={g} />
        {/* anel do impacto */}
        {g >= fImp && g < fImp + 14 && rec === 0 && (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <circle cx={imp[0]} cy={imp[1]} r={60 + (g - fImp) * 26} fill="none" stroke={CIANO} strokeWidth={14 * (1 - (g - fImp) / 14)} opacity={1 - (g - fImp) / 14} />
          </svg>
        )}
      </div>
      {/* linhas de velocidade na ida do golpe */}
      {g >= fImp - 8 && g < fImp && (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 16 }, (_, i) => {
            const y = imp[1] + (rnd(i) - 0.5) * 520, x1 = -40, x2 = imp[0] - 240 - rnd(i * 3) * 200;
            return <line key={i} x1={x1} y1={y} x2={x2} y2={y + (rnd(i * 5) - 0.5) * 30} stroke={CIANO} strokeWidth={3 + rnd(i * 7) * 4} opacity={0.5} strokeLinecap="round" />;
          })}
        </svg>
      )}
      {mostraLuva && (
        <AbsoluteFill>
          <ThreeCanvas width={W} height={H}>
            <ambientLight intensity={0.45} />
            <directionalLight position={[-4, 3, 6]} intensity={2.4} color="#DDEBFF" />
            <directionalLight position={[3, -2, 3]} intensity={1.4} color="#FF9A6E" />
            <CameraRig pos={[0, 0, 10]} target={[0, 0, 0]} fov={40} />
            <group rotation={[0, 0, 0.35]} position={[lx, hy, 1.2]}>
              <Luva3D rot={[0, -1.57, 0]} escala={tight ? 0.5 : 0.5} brilho={1.3} />
            </group>
          </ThreeCanvas>
        </AbsoluteFill>
      )}
      {/* a etiqueta do round (ouro) · e "REPLAY" (estilo transmissão) */}
      {rec < 1 && g >= fBell && (
        <div style={{ position: "absolute", left: 60, top: 240, background: P.gold, padding: "10px 22px", borderRadius: 6, transform: `rotate(-3deg) scale(${lerp(1.5, 1, tag)})`, opacity: tag * (1 - rec) }}>
          <span style={{ ...T.pesada(60, "#2A1410") }}>ROUND {c.n}</span>
          <span style={{ ...T.mono(26, "#2A1410"), marginLeft: 16 }}>{c.nome.toLowerCase()}</span>
        </div>
      )}
      {g >= fReplay - 4 && g < fReplay + 26 && (
        <div style={{ position: "absolute", left: clip.x + 24, top: clip.y + 24, ...T.mono(30, "#9FE4FF"), background: "rgba(10,10,20,.8)", padding: "6px 14px", borderRadius: 6, opacity: Math.floor((g - fReplay) / 6) % 2 === 0 ? 1 : 0.35 }}>● replay</div>
      )}
      {rec >= 1 && (
        <>
          {r === "r1" && <Replay1 g={g} v={vP} />}
          {r === "r2" && <Replay2 g={g} />}
          {r === "r3" && <Replay3 g={g} v={vP} />}
          <SeloComentarista x={40} y={1370} tom="escuro" />
        </>
      )}
    </AbsoluteFill>
  );
};
