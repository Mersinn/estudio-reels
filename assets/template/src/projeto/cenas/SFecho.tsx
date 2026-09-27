// Cena de exemplo: pilha tipográfica "espaçada / PESADA / manuscrita" + assinatura da marca.
import React from "react";
import { AbsoluteFill } from "remotion";
import { wf, fr, line } from "../../engine/timeline";
import { At, BgGradient, Grain, heavy, monoStyle, prog, script, SHADOW, useG } from "../../engine/ui";
import { BRAND, C, F, W } from "../../brand/brand";

export const SFecho: React.FC = () => {
  const g = useG();
  const cta = fr(line("fecho").end) + 6;
  return (
    <AbsoluteFill>
      <BgGradient />
      <div style={{ position: "absolute", top: 600, width: W - 80, textAlign: "center" }}>
        <div style={{ fontFamily: F.espacada, fontWeight: 500, fontSize: 52, letterSpacing: "0.32em", color: C.texto }}>
          <At f={wf("fecho", 0)}>AGORA&nbsp;</At>
          <At f={wf("fecho", 1)}>É&nbsp;</At>
          <At f={wf("fecho", 2)}>SÓ</At>
        </div>
        <div style={{ ...heavy(170), textShadow: SHADOW, marginTop: 20 }}>
          <At f={wf("fecho", 3)}>trocar&nbsp;</At>
          <At f={wf("fecho", 4)}>o</At>
        </div>
        <At f={wf("fecho", 5)} style={{ ...script(230) }}>
          roteiro.
        </At>
      </div>
      <div style={{ position: "absolute", top: 1330, width: W - 80, textAlign: "center", ...monoStyle(24, C.texto), opacity: prog(g, cta, 10) }}>
        {BRAND.handle}
      </div>
      <Grain />
    </AbsoluteFill>
  );
};
