// <Dialogo/> · a fala de um personagem (preceptor, paciente) como legenda de cena: rótulo com o nome e
// as palavras entrando no tempo da voz, perto de quem fala. Não é narração nem fala para a câmera:
// é o som da sala, legendado.
import React from "react";
import { fr, line } from "../engine/timeline";
import { useG } from "../engine/ui";
import { P, pp, T, twos } from "./kit";

export const Dialogo: React.FC<{
  quem: "preceptor" | "paciente";
  id: string;
  x: number;
  y: number;
  w?: number;
  ate?: number;
  tamanho?: number;
  alinhar?: "left" | "right";
}> = ({ quem, id, x, y, w = 760, ate, tamanho = 62, alinhar = "left" }) => {
  const g = useG();
  const ln = line(id);
  const f0 = fr(ln.start) - 5;
  const fim = ate ?? fr(ln.end) + 26;
  if (g < f0 || g > fim + 6) return null;
  const a = pp(twos(g - f0), 0, 6);
  const o = 1 - pp(g, fim, 6);
  return (
    <div style={{ position: "absolute", left: alinhar === "left" ? x : undefined, right: alinhar === "right" ? 1080 - x : undefined, top: y, width: w, opacity: a * o, textAlign: alinhar }}>
      <span style={{ ...T.mono(21, quem === "preceptor" ? P.ink : P.cream), background: quem === "preceptor" ? P.cream : P.coralLo, padding: "8px 16px 7px", borderRadius: 999 }}>
        {quem === "preceptor" ? "preceptor" : "paciente"} ▸
      </span>
      <div style={{ marginTop: 16, lineHeight: 1.08 }}>
        {ln.words.map((wd, i) => {
          const s = fr(wd.s);
          const k = g < s ? 0 : pp(twos(g - s), 0, 6);
          return (
            <span
              key={i}
              style={{
                ...T.italica(tamanho, P.cream, 700), display: "inline-block", marginRight: tamanho * 0.26, opacity: k,
                filter: `blur(${(1 - k) * 10}px)`, transform: `translateY(${(1 - k) * 12}px)`, textShadow: "0 8px 26px rgba(10,4,2,.7)",
              }}
            >
              {wd.w.toLowerCase()}
            </span>
          );
        })}
      </div>
    </div>
  );
};
