// A composição principal: cenas no tempo da narração + legenda + selo + áudio.
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { LINES, fr } from "../engine/timeline";
import { Captions } from "../engine/Captions";
import { FontGate, Grain, SafeZoneGuide, SceneTag, SealCorner, Scene } from "../engine/ui";
import { SC } from "./cenas";
import { LEGENDAS } from "./legendas";
import { SAbertura } from "./cenas/SAbertura";
import { SDado } from "./cenas/SDado";
import { SFecho } from "./cenas/SFecho";

export type ReelProps = { guides?: boolean; audio?: "mix" | "vo" | "none"; mixFile?: string };

export const Reel: React.FC<ReelProps> = ({ guides = false, audio = "vo", mixFile = "audio/mix_sfx.wav" }) => (
  <FontGate>
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      <Scene from={SC.abertura[0]} to={SC.abertura[1]} post={12} name="abertura">
        {() => <SAbertura />}
      </Scene>
      {/* pre = a prancha começa 10 quadros antes, subindo por cima da cena anterior */}
      <Scene from={SC.dado[0]} to={SC.dado[1]} pre={10} name="dado">
        {() => <SDado />}
      </Scene>
      <Scene from={SC.fecho[0]} to={SC.fecho[1]} name="fecho">
        {() => <SFecho />}
      </Scene>

      <Captions spec={LEGENDAS} />
      <SceneTag n="01" label="exemplo" from={fr(0.4)} to={SC.abertura[1]} />
      <SealCorner />
      <Grain opacity={0.04} />
      {guides && <SafeZoneGuide />}

      {audio === "mix" && <Audio src={staticFile(mixFile)} />}
      {audio === "vo" &&
        LINES.map((l) => (
          <Sequence key={l.id} from={fr(l.audioStart)} name={`vo:${l.id}`}>
            <Audio src={staticFile(`vo/${l.id}.mp3`)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  </FontGate>
);
