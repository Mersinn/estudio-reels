import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { FPS, H, W } from "./brand/brand";
import { TOTAL } from "./engine/timeline";
import { Reel } from "./projeto/Reel";
import { Capa } from "./projeto/Capa";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ guides: false, audio: "vo" as const, mixFile: "audio/mix_sfx.wav" }}
    />
    <Composition id="CapaReel" component={Capa} durationInFrames={1} fps={FPS} width={W} height={H} defaultProps={{ format: "reel" as const }} />
    <Composition id="CapaGrid" component={Capa} durationInFrames={1} fps={FPS} width={W} height={1350} defaultProps={{ format: "grid" as const }} />
  </>
);
