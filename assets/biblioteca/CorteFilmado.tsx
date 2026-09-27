// Modo FILMAGEM: o corte vertical (vindo da corte-viral) como fundo, com o áudio dele.
// Use no lugar das cenas narradas; legenda, rótulos, selo e cenas de motion vão por cima,
// presos às palavras do vo.json gerado por scripts/filmagem_para_vo.py.
//
//   <CorteFilmado />                                  vídeo cheio, tocando o áudio
//   <CorteFilmado escurecer={0.25} />                 escurece para a legenda respirar
//   <Scene from={wfind("f04","colágeno")} ...>        cena de motion por cima de um trecho
//
// No Reel, use audio="none": quem toca a voz é o próprio vídeo.
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate } from "remotion";

export const CorteFilmado: React.FC<{
  src?: string;
  escurecer?: number; // 0..1, véu escuro de baixo para cima (área da legenda)
  zoom?: [number, number, number, number]; // [de, até, escala inicial, escala final] em quadros: punch-in lento
  mudo?: boolean;
}> = ({ src = "filmagem/corte.mp4", escurecer = 0.18, zoom, mudo = false }) => {
  const f = useCurrentFrame();
  const s = zoom ? interpolate(f, [zoom[0], zoom[1]], [zoom[2], zoom[3]], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${s})` }}>
        <OffthreadVideo src={staticFile(src)} muted={mudo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {escurecer > 0 && (
        <AbsoluteFill style={{ background: `linear-gradient(to top, rgba(0,0,0,${escurecer * 2.4}) 0%, rgba(0,0,0,${escurecer}) 30%, rgba(0,0,0,0) 55%)` }} />
      )}
    </AbsoluteFill>
  );
};
