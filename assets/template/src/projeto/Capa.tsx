// Capa (1080×1920) e recorte do grid (1080×1350): título-pergunta + visual-assinatura + selo.
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { BgGradient, FontGate, Grain, heavy, SealCorner, script, SHADOW } from "../engine/ui";
import { C, F } from "../brand/brand";

export const Capa: React.FC<{ format: "reel" | "grid" }> = ({ format }) => {
  const { width } = useVideoConfig();
  const grid = format === "grid";
  return (
    <FontGate>
      <AbsoluteFill>
        <BgGradient />
        <div style={{ position: "absolute", top: grid ? 380 : 620, width: width - (grid ? 0 : 80), textAlign: "center" }}>
          <div style={{ fontFamily: F.espacada, fontWeight: 500, fontSize: 54, letterSpacing: "0.32em", color: C.texto }}>TÍTULO</div>
          <div style={{ ...heavy(150), textShadow: SHADOW, marginTop: 10 }}>EM PERGUNTA</div>
          <div style={{ ...script(190), marginTop: -20 }}>aqui?</div>
        </div>
        <SealCorner size={grid ? 140 : 150} />
        <Grain />
      </AbsoluteFill>
    </FontGate>
  );
};
