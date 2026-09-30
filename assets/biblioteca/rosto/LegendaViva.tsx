// <LegendaViva/> · a legenda deste reel (evolução da pilha tipográfica, a partir dos pins de referência):
//   contraste extremo: itálico editorial pequeno (Playfair 800) contra palavra pesada (Montserrat 900)
//   entrada com desfoque "em dois" (papel/colagem), palavra-chave com marca-texto dourado (Vox)
// Sintaxe: blocos "||" ("!" no começo do bloco inverte o tom), linhas " / ", prefixos por palavra:
//   palavra  corpo (pesada 76)   *palavra chave (pesada 124)   _palavra itálico (Playfair 800 64)
//   =palavra marca-texto (combina: "=*sobe")
// As palavras seguem a ordem da fala (tempo de vo.json).
import React from "react";
import { AbsoluteFill } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { fr, line, LINES } from "../engine/timeline";
import { useG } from "../engine/ui";
import { F, SAFE, W } from "../brand/brand";
import { P, pp, twos } from "./kit";

type Sty = "b" | "k" | "i";
type Tok = { text: string; st: Sty; hl: boolean; s: number };
type Block = { rows: Tok[][]; from: number; to: number; y: number; dark: boolean; quem?: string };
// quem: etiqueta de quem fala (molde "PRECEPTOR ▸" da sutura), quando há diálogo
export type LegSpec = Record<string, { spec: string; y?: number; tom?: "claro" | "escuro"; quem?: string }>;

const STY: Record<Sty, { family: string; weight: number; size: number; italic?: boolean }> = {
  b: { family: F.impacto, weight: 900, size: 76 },
  k: { family: F.impacto, weight: 900, size: 124 },
  i: { family: F.editorial, weight: 800, size: 66, italic: true },
};
const MAXW = W - SAFE.left - SAFE.right - 40;
const clean = (t: string) => t.replace(/[,.:;]+$/g, "").replace(/~/g, " ");

const cache = new Map<LegSpec, Block[]>();
function parse(specs: LegSpec): Block[] {
  if (cache.has(specs)) return cache.get(specs)!;
  const out: Block[] = [];
  for (const [id, { spec, y = 1455, tom = "claro", quem }] of Object.entries(specs)) {
    const ln = line(id);
    let wi = 0;
    const blocks = spec.split("||").map((chunk0) => {
      // "!" no começo do bloco inverte o tom só nele (a cena troca de fundo no meio da fala)
      const inv = chunk0.trim().startsWith("!");
      const chunk = inv ? chunk0.trim().slice(1) : chunk0;
      const rows = chunk.trim().split(" / ").map((r) =>
        r.trim().split(/\s+/).map((raw) => {
          let t = raw, hl = false, st: Sty = "b";
          if (t.startsWith("=")) { hl = true; t = t.slice(1); }
          if (t.startsWith("*")) { st = "k"; t = t.slice(1); } else if (t.startsWith("_")) { st = "i"; t = t.slice(1); }
          const w = ln.words[wi++];
          if (!w) throw new Error(`legenda de "${id}" tem mais palavras que a fala`);
          return { text: clean(t), st, hl, s: fr(w.s) };
        }),
      );
      return { rows, from: rows[0][0].s, to: 0, y, dark: (tom === "escuro") !== inv, quem };
    });
    if (wi !== ln.words.length) throw new Error(`legenda de "${id}": ${wi} palavras, a fala tem ${ln.words.length}`);
    const next = LINES[LINES.findIndex((l) => l.id === id) + 1];
    const end = fr(ln.end) + 8;
    const hard = next ? Math.min(fr(next.start) - 2, end + 10) : end + 20;
    blocks.forEach((b, i) => (b.to = i < blocks.length - 1 ? blocks[i + 1].from : Math.max(end, Math.min(hard, end + 12))));
    out.push(...blocks);
  }
  cache.set(specs, out);
  return out;
}

const Palavra: React.FC<{ t: Tok; g: number; k: number; dark: boolean }> = ({ t, g, k, dark }) => {
  const s = STY[t.st];
  const age = g - t.s;
  const a = age < 0 ? 0 : pp(twos(age), 0, 6);
  const color = dark ? (t.st === "i" ? P.terra : P.ink) : t.st === "i" ? P.peach : P.cream;
  const hl = t.hl ? pp(g, t.s + 3, 8) : 0;
  return (
    <span
      style={{
        position: "relative", display: "inline-block", fontFamily: s.family, fontWeight: s.weight, fontStyle: s.italic ? "italic" : "normal",
        fontSize: s.size * k, lineHeight: 1, letterSpacing: t.st === "i" ? "-0.01em" : "-0.04em", color, whiteSpace: "pre",
        opacity: a, filter: `blur(${(1 - a) * 12}px)`, transform: `translateY(${(1 - a) * 16}px)`,
        textShadow: dark ? "none" : "0 6px 20px rgba(15,6,3,.55)",
      }}
    >
      {t.hl && (
        <span style={{ position: "absolute", left: "-4%", right: "-4%", top: "30%", bottom: "2%", background: dark ? "rgba(230,200,134,.9)" : "rgba(201,164,92,.75)", mixBlendMode: dark ? "multiply" : "normal", transform: "skewX(-8deg) rotate(-1.5deg)", clipPath: `inset(0 ${(1 - hl) * 100}% 0 0 round 4px)`, zIndex: -1 }} />
      )}
      <span style={{ position: "relative" }}>{t.text.toLowerCase()}</span>
    </span>
  );
};

export const LegendaViva: React.FC<{ spec: LegSpec }> = ({ spec }) => {
  const g = useG();
  const b = parse(spec).find((x) => g >= x.from && g < x.to);
  if (!b) return null;
  const out = pp(g, b.to - 4, 4);
  const rows = b.rows.map((r) => {
    const w = r.reduce((acc, t) => {
      const s = STY[t.st];
      return acc + measureText({ text: t.text.toLowerCase(), fontFamily: s.family, fontSize: s.size, fontWeight: String(s.weight), fontStyle: s.italic ? "italic" : "normal" } as never).width + 20;
    }, -20);
    const k = Math.min(1, MAXW / w);
    const h = Math.max(...r.map((t) => STY[t.st].size)) * k;
    return { r, k, h };
  });
  const total = rows.reduce((a, r) => a + r.h * 0.95, 0);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 1 - out, isolation: "isolate" }}>
      <div style={{ position: "absolute", left: SAFE.left, width: W - SAFE.left - SAFE.right, top: b.y - total / 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {b.quem && (
          <div style={{ marginBottom: 14, background: P.cream, borderRadius: 999, padding: "8px 20px 6px", fontFamily: F.tecnica, fontWeight: 600, fontSize: 26, letterSpacing: "0.12em", textTransform: "uppercase", color: P.ink, boxShadow: "0 8px 20px rgba(15,6,3,.35)" }}>
            {b.quem} ▸
          </div>
        )}
        {rows.map(({ r, k, h }, i) => (
          <div key={i} style={{ height: h * 0.95, display: "flex", alignItems: "flex-end", gap: 20 * k, isolation: "isolate" }}>
            {r.map((t, j) => <Palavra key={j} t={t} g={g} k={k} dark={b.dark} />)}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
