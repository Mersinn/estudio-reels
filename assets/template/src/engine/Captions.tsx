// <Captions/> · legenda queimada em PILHA TIPOGRÁFICA, no tempo exato de cada palavra.
//
// Sintaxe da decupagem (src/projeto/legendas.ts):
//   blocos separados por "||", linhas por " / ", e o papel de cada palavra pelo prefixo:
//     palavra   corpo       Montserrat 900 minúscula
//     *palavra  chave       gigante: a palavra que carrega o sentido (1 por bloco)
//     ~palavra  manuscrita  Great Vibes girada, cor de acento (no máximo 1 por fala)
//     _palavra  editorial   Playfair itálico
//     ^palavra  espaçada    CAIXA ALTA com tracking largo
//     #palavra  pesada      CAIXA ALTA 900 (padrão de título)
//   As palavras têm de estar na MESMA ORDEM da fala: o tempo vem de vo.json.
//
// Regras (medidas, não gosto): corte seco por palavra (a fluidez vem do ritmo, não de easing longo),
// uma palavra-chave gigante por bloco, entrelinha colada, centralizada na área segura, bloco nunca
// atravessa fala. Fundo claro? use tone: "dark". Cena com tipografia própria? não legende essa fala.
import React from "react";
import { AbsoluteFill } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { fr, line, LINES } from "./timeline";
import { useG } from "./ui";
import { C, F, H, SAFE, W } from "../brand/brand";

export type CapPos = "top" | "center" | "low";
export type CaptionSpec = Record<string, { spec: string; pos?: CapPos; tone?: "light" | "dark" }>;

type Style = "b" | "k" | "s" | "i" | "w" | "h";
type Tok = { text: string; style: Style; s: number };
type Block = { rows: Tok[][]; from: number; to: number; pos: CapPos; dark: boolean };

const STY: Record<Style, { family: string; weight: number; size: number; italic?: boolean; upper?: boolean; ls?: number; color: string }> = {
  b: { family: F.impacto, weight: 900, size: 92, color: C.texto },
  k: { family: F.impacto, weight: 900, size: 182, color: C.texto },
  s: { family: F.manuscrita, weight: 400, size: 170, color: C.acento },
  i: { family: F.editorial, weight: 600, size: 112, italic: true, color: C.texto },
  w: { family: F.espacada, weight: 500, size: 50, upper: true, ls: 0.32, color: C.texto },
  h: { family: F.impacto, weight: 900, size: 150, upper: true, color: C.texto },
};
const PREFIX: Record<string, Style> = { "*": "k", "~": "s", _: "i", "^": "w", "#": "h" };
const MAX_W = W - SAFE.left - SAFE.right - 60;
const POS_Y: Record<CapPos, number> = { top: 520, center: 900, low: 1230 };
const H_LIMIT = H - SAFE.bottom - 20;

const clean = (t: string) => (t.includes("...") ? t.replace("...", "…") : t.replace(/[,.:;]+$/g, ""));

const cache = new Map<CaptionSpec, Block[]>();
function parse(specs: CaptionSpec): Block[] {
  if (cache.has(specs)) return cache.get(specs)!;
  const out: Block[] = [];
  for (const [id, { spec, pos = "low", tone = "light" }] of Object.entries(specs)) {
    const ln = line(id);
    let wi = 0;
    const blocks: Block[] = spec.split("||").map((chunk) => {
      const rows = chunk
        .trim()
        .split(" / ")
        .map((r) =>
          r
            .trim()
            .split(/\s+/)
            .map((raw) => {
              const st = PREFIX[raw[0]] ?? "b";
              const text = PREFIX[raw[0]] ? raw.slice(1) : raw;
              const w = ln.words[wi++];
              if (!w) throw new Error(`legenda de "${id}" tem mais palavras que a fala`);
              return { text: clean(text), style: st, s: fr(w.s) };
            }),
        );
      return { rows, from: rows[0][0].s, to: 0, pos, dark: tone === "dark" };
    });
    if (wi !== ln.words.length) throw new Error(`legenda de "${id}": ${wi} palavras, a fala tem ${ln.words.length}`);
    const next = LINES[LINES.findIndex((l) => l.id === id) + 1];
    const lineEnd = fr(ln.end) + 8;
    const hardEnd = next ? Math.min(fr(next.start) - 2, lineEnd + 10) : lineEnd + 20;
    blocks.forEach((b, i) => (b.to = i < blocks.length - 1 ? blocks[i + 1].from : Math.max(lineEnd, Math.min(hardEnd, lineEnd + 12))));
    out.push(...blocks);
  }
  cache.set(specs, out);
  return out;
}

const display = (t: Tok) => (STY[t.style].upper ? t.text.toUpperCase() : t.style === "s" ? t.text : t.text.toLowerCase());

const font = (st: (typeof STY)[Style], scale: number, style: Style, dark: boolean): React.CSSProperties => {
  const color = dark ? (style === "s" ? C.destaque : C.tinta) : st.color;
  return {
    fontFamily: st.family,
    fontWeight: st.weight,
    fontStyle: st.italic ? "italic" : "normal",
    fontSize: st.size * scale,
    letterSpacing: st.ls ? `${st.ls}em` : style === "b" || style === "k" || style === "h" ? "-0.035em" : undefined,
    color,
    lineHeight: 1,
    whiteSpace: "pre",
    textShadow: dark ? "0 2px 16px rgba(255,250,244,.7)" : "0 6px 18px rgba(20,10,5,.55), 0 2px 3px rgba(20,10,5,.35)",
  };
};

const Word: React.FC<{ t: Tok; frame: number; scale: number; dark: boolean }> = ({ t, frame, scale, dark }) => {
  const st = STY[t.style];
  const age = frame - t.s;
  if (age < 0) return <span style={{ visibility: "hidden", ...font(st, scale, t.style, dark) }}>{display(t)}</span>;
  const k = age >= 3 ? 1 : 1.06 - 0.02 * age; // "pop" de 3 quadros
  return (
    <span
      style={{
        ...font(st, scale, t.style, dark),
        display: "inline-block",
        transform: `scale(${k}) ${t.style === "s" ? "rotate(-6deg) translateY(4%)" : ""}`,
        transformOrigin: "50% 70%",
      }}
    >
      {display(t)}
    </span>
  );
};

export const Captions: React.FC<{ spec: CaptionSpec; mute?: (frame: number) => boolean }> = ({ spec, mute }) => {
  const frame = useG();
  const b = parse(spec).find((x) => frame >= x.from && frame < x.to);
  if (!b || mute?.(frame)) return null;
  const rows = b.rows.map((r) => {
    const ms = r.map((t) => {
      const st = STY[t.style];
      const m = measureText({ text: display(t), fontFamily: st.family, fontSize: st.size, fontWeight: String(st.weight), letterSpacing: st.ls ? `${st.ls}em` : undefined });
      return { w: m.width, h: st.size * (t.style === "h" || t.style === "w" ? 1.12 : 1) };
    });
    const w = ms.reduce((a, m) => a + m.w, 0) + 22 * (r.length - 1);
    const scale = Math.min(1, MAX_W / w);
    return { r, scale, h: Math.max(...ms.map((m) => m.h)) * scale };
  });
  const total = rows.reduce((a, r) => a + r.h * 0.86, 0);
  const top = Math.min(POS_Y[b.pos] - total / 2, H_LIMIT - total);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top, left: SAFE.left, width: W - SAFE.left - SAFE.right, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {rows.map(({ r, scale, h }, i) => (
          <div key={i} style={{ height: h * 0.86, display: "flex", alignItems: "flex-end", gap: 22 * scale }}>
            {r.map((t, j) => (
              <Word key={j} t={t} frame={frame} scale={scale} dark={b.dark} />
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
