// 7 · "O cirurgião começa pelo tato: pele, gordura, SMAS, ligamentos, osso." / "E entre elas, os ramos do nervo que
// move o seu sorriso."
// Transição própria deste reel: O BLOCO DA BOCHECHA. A caneta marca um quadrado na bochecha da Vênus e os dedos
// pressionam (o tato). Em "pele", esse pedaço sai do rosto como um bloco de mármore cortado por um escultor, sobe e
// gira em 3D: por dentro não é mármore, são as camadas vivas, que se revelam uma a uma no tempo de cada palavra (pele ·
// gordura · SMAS · ligamentos de retenção, colunas que vão do osso à derme · osso). Em "E entre elas" os ramos do
// nervo facial acendem em ouro no lugar onde passam: logo abaixo do SMAS. Em "que move o seu sorriso" o bloco volta e
// se encaixa no rosto, e os ramos se desenham sobre a face (zigomático e bucal brilham: o sorriso).
// Camadas: Alghoul & Codner 2013 (modelo de Mendelson). Sobotta 1909 como prova.
import React from "react";
import { AbsoluteFill } from "remotion";
import { H, W } from "../../brand/brand";
import { useG } from "../../engine/ui";
import { SC } from "../cenas";
import { naTela, RostoFx, Vista } from "../RostoFx";
import { SeloComentarista } from "../Medica";
import { Bloco, BD, BW } from "../BlocoFace";
import { Caneta } from "./SRound";
import { wn } from "./comum";
import { curva, dPath, easeInOut, Foto, lerp, P, pp, T, trecho, twos, Vinheta } from "../kit";

const BOCHECHA: [number, number] = [248, 420]; // px do recorte do rosto
const v: Vista = { cx: BOCHECHA[0], cy: BOCHECHA[1], zoom: 1.45, x: 560, y: 1010 };
const ESC0 = 0.86; // o bloco, visto de cima, cobre exatamente o quadrado marcado

// ramos do nervo facial (lado esquerdo do rosto em 3/4; saem da frente da orelha, dentro da parótida)
const RAMOS: { nome: string; pts: [number, number][]; sorriso?: boolean }[] = [
  { nome: "temporal", pts: [[70, 420], [92, 340], [118, 240], [140, 130]] },
  { nome: "zigomático", pts: [[70, 420], [128, 372], [186, 330], [236, 306]], sorriso: true },
  { nome: "bucal", pts: [[70, 420], [160, 432], [248, 452], [312, 470]], sorriso: true },
  { nome: "marginal", pts: [[70, 420], [118, 516], [196, 584], [278, 606]] },
  { nome: "cervical", pts: [[70, 420], [80, 540], [96, 660]] },
];
const ROTULOS = ["pele", "gordura", "SMAS · músculo e aponeurose", "ligamentos · prendem a pele ao osso", "osso · o zigomático"];

export const SCamadas: React.FC = () => {
  const g = useG();
  const f0 = SC.camadas[0];
  const fTato = wn("med7", "tato"), fEntre = wn("med8", "entre"), fQue = wn("med8", "que"), fSorriso = wn("med8", "sorriso");
  const tempos = ["pele", "gordura", "SMAS", "ligamentos", "osso"].map((p) => wn("med7", p));
  const [tPele] = tempos;
  // a marcação e o tato
  const marca = pp(g, f0 + 4, Math.max(8, fTato - f0), easeInOut);
  // o bloco sai (antes de "pele") e volta (em "que move o seu sorriso")
  const sai = pp(g, tPele - 12, 18, easeInOut);
  const volta = pp(g, fQue - 6, 16, easeInOut);
  const t = sai * (1 - volta);
  const ax = lerp(-90, -32, t), ay = lerp(0, -24, t);
  const [cx, cy] = naTela(v, BOCHECHA);
  const by = lerp(cy, cy - 140, t);
  const esc = lerp(ESC0, 1.02, t);
  const rev = tempos.map((f) => pp(g, f - 2, 10, easeInOut));
  const atual = tempos.reduce((a, f, i) => (g >= f - 2 ? i : a), -1);
  const destaque = g < fEntre - 4 ? atual : -1;
  const nervo = pp(g, fEntre - 2, 16);
  const buraco = t > 0.02 ? Math.min(1, t * 3) : 0;
  const lado = (BW * ESC0) / 2, altura = (BD * ESC0) / 2;
  // o topo do bloco: a mesma arte, alinhada ao quadrado marcado (1 px do topo = ESC0 px da tela)
  const vTopo: Vista = { cx: BOCHECHA[0], cy: BOCHECHA[1], zoom: v.zoom / ESC0, x: BW / 2, y: BD / 2 };
  return (
    <AbsoluteFill style={{ backgroundColor: "#1F0F0B", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(52% 38% at 50% 50%, rgba(255,236,220,.18) 0%, rgba(0,0,0,0) 70%)" }} />
      <AbsoluteFill style={{ opacity: 1 - 0.55 * t }}>
        <RostoFx fx={{}} v={v} />
        {/* o vão que o bloco deixa no rosto */}
        {buraco > 0 && <div style={{ position: "absolute", left: cx - lado, top: cy - altura, width: lado * 2, height: altura * 2, background: "#2A120C", boxShadow: "inset 0 0 40px rgba(0,0,0,.8)", opacity: buraco }} />}
        {/* a marcação (caneta) e o tato (ondas sob os dedos) */}
        {g < tPele + 2 && (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <Caneta pts={[[cx - lado, cy - altura], [cx + lado, cy - altura], [cx + lado, cy + altura], [cx - lado, cy + altura], [cx - lado, cy - altura - 2]]} p={marca} cor="#2A1410" esp={6} seed={5} />
            {g >= fTato - 4 &&
              [0, 1, 2].map((q) => {
                const a = pp(g, fTato - 4 + q * 5, 16);
                return <circle key={q} cx={cx} cy={cy} r={30 + a * 170} fill="none" stroke={P.cream} strokeWidth={6 * (1 - a)} opacity={1 - a} />;
              })}
          </svg>
        )}
        {/* os ramos do nervo facial sobre o rosto, depois que o bloco volta */}
        {volta > 0.8 && (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {RAMOS.map((r, i) => {
              const p = pp(g, fQue + 8 + i * 2, 14, easeInOut);
              const pts = curva(r.pts.map((q) => naTela(v, q)) as [number, number][], 12);
              const brilha = r.sorriso ? pp(g, fSorriso - 2, 8) : 0;
              return <path key={r.nome} d={dPath(trecho(pts, p).pts)} fill="none" stroke="#F2C75C" strokeWidth={7 + brilha * 6} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${6 + brilha * 12}px rgba(242,199,92,.9))` }} />;
            })}
          </svg>
        )}
      </AbsoluteFill>
      {/* o bloco da bochecha */}
      {g >= tPele - 14 && volta < 1 && (
        <Bloco x={cx} y={by} ax={ax} ay={ay} esc={esc} rev={rev} nervo={nervo} destaque={destaque}
          topo={<div style={{ position: "relative", width: BW, height: BD }}><RostoFx fx={{}} v={vTopo} w={BW} h={BD} /></div>} />
      )}
      {/* rótulo da camada dita agora (pílula mono, em dois) */}
      {tempos.map((f, i) => {
        const fim = i + 1 < tempos.length ? tempos[i + 1] : fEntre - 4;
        if (g < f || g > fim + 4) return null;
        const a = pp(twos(g - f), 0, 6);
        return (
          <div key={i} style={{ position: "absolute", left: W / 2, top: 330, transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * a})`, opacity: a * (1 - pp(g, fim - 2, 6)) }}>
            <div style={{ ...T.mono(36, P.ink), background: P.cream, padding: "14px 26px 12px", borderRadius: 999, boxShadow: "0 12px 28px rgba(30,12,6,.35)", whiteSpace: "nowrap" }}>
              {String(i + 1).padStart(2, "0")} · {ROTULOS[i]}
            </div>
          </div>
        );
      })}
      {g >= fEntre - 2 && volta < 0.5 && (
        <div style={{ position: "absolute", left: W / 2, top: 330, transform: "translate(-50%, -50%)", opacity: pp(g, fEntre - 2, 8) * (1 - pp(g, fQue - 8, 6)) }}>
          <div style={{ ...T.mono(34, "#2A1410"), background: "#F2C75C", padding: "14px 26px 12px", borderRadius: 999, whiteSpace: "nowrap" }}>nervo facial · logo abaixo do SMAS</div>
        </div>
      )}
      {g >= fSorriso - 4 && (
        <div style={{ position: "absolute", left: 60, top: 300, opacity: pp(g, fSorriso - 4, 8) }}>
          <div style={{ ...T.mono(24, "#F2C75C") }}>nervo facial</div>
          <div style={{ ...T.pesada(46, P.cream) }}>ramos zigomático e bucal</div>
          <div style={{ ...T.italica(40, P.peach, 700) }}>movem o sorriso</div>
        </div>
      )}
      <Foto id="sobotta_face" x={840} y={560} w={330} f={fQue + 12} rot={4} seed={5} legenda="músculos da face · sobotta 1909" cor />
      <Vinheta forca={0.4} />
      <SeloComentarista x={40} y={1370} tom="escuro" op={pp(g, f0, 8)} />
    </AbsoluteFill>
  );
};
