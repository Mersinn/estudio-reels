// A médica comentarista: a personagem que o Emerson gerou no ChatGPT, levada a um meio-termo com o preceptor da
// sutura (scripts/estilizar_medica.py: sombreado de render achatado, paleta quente, luz de borda) e ANIMADA:
//  · o corpo respira e oscila de leve (nunca parado);
//  · no selo de comentarista a cabeça é SEMPRE a mesma (nada de trocar tomadas diferentes, que parecia robô):
//    a boca é desenhada por cima e abre pela força real da voz (src/data/boca.json, scripts/boca.py), ela pisca a
//    cada poucos segundos e a cabeça acompanha a fala com um balanço pequeno.
import React from "react";
import { Img, staticFile } from "remotion";
import { useG } from "../engine/ui";
import BOCA from "../data/boca.json";
import TAMS from "../data/medica_tam.json";
import { P, T } from "./kit";

export type Tomada = "mesa" | "explica" | "pensa" | "tablet" | "aponta" | "f_sorri" | "f_fala" | "f_neutra" | "f_oh" | "f_pisca" | "f_34" | "corpo" | "sentada";
export const TAM = TAMS as unknown as Record<Tomada, [number, number]>;
const ENV = BOCA as number[];
export const boca = (g: number) => ENV[Math.max(0, Math.min(ENV.length - 1, g))] ?? 0;

/** uma tomada da médica, com a base em (x, y) e altura h; respira e oscila (semente própria por tomada) */
export const MedicaImg: React.FC<{ t: Tomada; x: number; y: number; h: number; espelho?: boolean; op?: number; sombra?: boolean; fala?: boolean }> = ({
  t, x, y, h, espelho, op = 1, sombra = true, fala = false,
}) => {
  const g = useG();
  const [tw, th] = TAM[t];
  const w = (h * tw) / th;
  const resp = Math.sin(g * 0.11 + t.length);
  const osc = Math.sin(g * 0.043 + t.length * 2);
  const b = fala ? boca(g) : 0;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, opacity: op, transformOrigin: "50% 100%", transform: `${espelho ? "scaleX(-1) " : ""}rotate(${osc * 1.1 + b * 0.8}deg) scale(${1 + resp * 0.006}, ${1 + resp * 0.011})` }}>
      {sombra && <div style={{ position: "absolute", left: "10%", right: "10%", bottom: -14, height: 28, borderRadius: "50%", background: "rgba(10,4,2,.45)", filter: "blur(10px)" }} />}
      <Img src={staticFile(`personagem/gravura/${t}.png`)} style={{ width: "100%", height: "100%", filter: "drop-shadow(0 18px 30px rgba(20,8,4,.35))" }} />
    </div>
  );
};

// a cabeça do selo (f_sorri estilizada, 660×792): boca e olhos medidos na própria imagem
const BOCA_C = { x: 395, y: 530 };
const OLHOS = [{ x: 330, y: 380, rx: 30, ry: 44 }, { x: 495, y: 382, rx: 28, ry: 44 }];
const PELE = "#EFAE8A";

/** a cabeça animada: boca pela voz, piscada, balanço */
export const CabecaFalando: React.FC<{ w: number }> = ({ w }) => {
  const g = useG();
  const b = boca(g);
  const k = w / 660;
  const ab = Math.min(1, b) * 46; // abertura da boca (px da imagem)
  const ciclo = (g + 17) % 97; // pisca ~ a cada 3 s, 4 quadros
  const pisca = ciclo < 2 ? ciclo / 2 : ciclo < 4 ? (4 - ciclo) / 2 : 0;
  const bal = Math.sin(g * 0.07) * 1.5 + b * 2;
  return (
    <div style={{ position: "relative", width: w, height: 792 * k, transform: `rotate(${bal}deg) translateY(${-b * 3}px)`, transformOrigin: "50% 80%" }}>
      <Img src={staticFile("personagem/gravura/f_sorri.png")} style={{ width: w, height: 792 * k }} />
      <svg width={w} height={792 * k} viewBox="0 0 660 792" style={{ position: "absolute", inset: 0 }}>
        {ab > 3 && (
          <g>
            {/* a boca aberta cobre o sorriso pintado: lábio de cima segue o sorriso, o de baixo desce com a voz */}
            <path d={`M${BOCA_C.x - 58},${BOCA_C.y - 12} Q${BOCA_C.x},${BOCA_C.y + 12} ${BOCA_C.x + 56},${BOCA_C.y + 2} Q${BOCA_C.x + 4},${BOCA_C.y + 12 + ab * 1.6} ${BOCA_C.x - 58},${BOCA_C.y - 12} Z`} fill="#5A1E14" stroke="#3A1410" strokeWidth={5} />
            <path d={`M${BOCA_C.x - 30},${BOCA_C.y + 8 + ab * 0.7} Q${BOCA_C.x + 6},${BOCA_C.y + 2 + ab * 1.1} ${BOCA_C.x + 34},${BOCA_C.y + 6 + ab * 0.6} Q${BOCA_C.x + 4},${BOCA_C.y + 10 + ab * 1.45} ${BOCA_C.x - 30},${BOCA_C.y + 8 + ab * 0.7} Z`} fill="#E07A63" opacity={Math.min(1, ab / 20)} />
          </g>
        )}
        {pisca > 0 &&
          OLHOS.map((o, i) => (
            <g key={i}>
              <ellipse cx={o.x} cy={o.y - o.ry * (1 - pisca)} rx={o.rx + 6} ry={o.ry * pisca + 4} fill={PELE} />
              <path d={`M${o.x - o.rx - 4},${o.y - o.ry * (1 - pisca) * 2 + o.ry * pisca} q${o.rx + 4},${10} ${o.rx * 2 + 8},0`} stroke="#2A1410" strokeWidth={7} fill="none" strokeLinecap="round" opacity={pisca} />
            </g>
          ))}
      </svg>
    </div>
  );
};

/** o selo de comentarista (estilo transmissão): a cabeça animada num círculo + o papel */
export const SeloComentarista: React.FC<{ x: number; y: number; op?: number; tom?: "claro" | "escuro"; boca?: number }> = ({ x, y, op = 1, tom = "escuro" }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 16, opacity: op }}>
    <div style={{ width: 170, height: 170, borderRadius: "50%", overflow: "hidden", background: "radial-gradient(circle at 50% 35%, #F29470, #86391F)", border: `5px solid ${P.cream}`, boxShadow: "0 10px 26px rgba(20,8,4,.4)", position: "relative" }}>
      {/* o rosto centrado no círculo (olhos, nariz e boca da f_sorri ficam em ~420,440 da imagem) */}
      <div style={{ position: "absolute", left: 85 - 400 * (196 / 660), top: 92 - 400 * (196 / 660) }}>
        <CabecaFalando w={196} />
      </div>
    </div>
    <div style={{ background: tom === "escuro" ? "rgba(20,10,8,.88)" : P.cream, padding: "10px 18px", borderRadius: 10 }}>
      <div style={{ ...T.pesada(36, tom === "escuro" ? P.cream : P.ink) }}>A MÉDICA</div>
      <div style={{ ...T.italica(30, P.coral, 600) }}>comentarista técnica</div>
    </div>
  </div>
);
