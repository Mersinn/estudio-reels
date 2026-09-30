// O FIO do vídeo (como a régua do tempo no reel da história): um único número que rola e costura os mundos.
// altitude (10.668 m) → profundidade (2 mm → 3 cm) → escala (12 cm → 20 µm) → cabine (2.438 m) → órbita (400 km).
import React from "react";
import { interpolate } from "remotion";
import { P, pp, T } from "./kit";

export const Fio: React.FC<{ rotulo: string; valor: string; g: number; f: number; out?: number; claro?: boolean }> = ({ rotulo, valor, g, f, out, claro = true }) => {
  if (g < f || (out !== undefined && g > out + 6)) return null;
  const a = pp(g, f, 6) * (out !== undefined ? 1 - pp(g, out, 6) : 1);
  return (
    <div style={{ position: "absolute", left: 60, top: 230, opacity: a }}>
      <div style={{ ...T.mono(24, claro ? P.peach : P.cinza) }}>{rotulo}</div>
      <div style={{ ...T.italica(84, claro ? P.cream : P.ink, 800) }}>{valor}</div>
    </div>
  );
};

/** número que rola entre marcos (quadro → valor), formatado em pt-BR */
export const rola = (g: number, marcos: [number, number][], casas = 0) => {
  const v = interpolate(g, marcos.map((m) => m[0]), marcos.map((m) => m[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
};
