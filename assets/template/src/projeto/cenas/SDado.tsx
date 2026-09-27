// Cena de exemplo: prancha em papel com um número que sobe na palavra dita (mostrar a prova).
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { wfind } from "../../engine/timeline";
import { DataCounter, Grain, heavy, italic, monoStyle, useG } from "../../engine/ui";
import { C } from "../../brand/brand";
import { SC } from "../cenas";

export const SDado: React.FC = () => {
  const g = useG();
  const [a] = SC.dado;
  // entrada "folha de papel": sobe e cobre a cena anterior
  const enter = interpolate(g, [a - 10, a + 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => x * x });
  return (
    <AbsoluteFill style={{ transform: `translateY(${enter * 100}%)`, background: C.papel }}>
      <div style={{ position: "absolute", left: 110, top: 240, ...monoStyle(24), opacity: 0.75 }}>exemplo · prancha de dado</div>
      <DataCounter value={100} dec={0} from={wfind("dado", "100%")} suffix="%" style={{ position: "absolute", left: 100, top: 520, ...heavy(300, C.destaque) }} />
      <div style={{ position: "absolute", left: 110, top: 820, ...italic(96, C.tinta) }}>das cenas</div>
      <div style={{ position: "absolute", left: 110, top: 1460, ...monoStyle(20), opacity: 0.6 }}>fonte: sempre no quadro, em mono pequeno</div>
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
