// Utilitários das cenas deste reel: palavra exata (com ocorrência), a boca da médica no ritmo da voz, a pilha do
// título (a pergunta que abre e volta no fim) e o celular com a selfie filtrada.
import React from "react";
import { AbsoluteFill } from "remotion";
import { fr, line, LINES } from "../../engine/timeline";
import { useG } from "../../engine/ui";
import { FiltroFx, RostoFx, Vista } from "../RostoFx";
import { Malha } from "../Malha";
import { P, pp, rnd, T, twos } from "../kit";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
/** quadro em que começa a n-ésima (0 = primeira) palavra IGUAL a `palavra` na fala `id` (sem acento e pontuação) */
export function wn(id: string, palavra: string, n = 0): number {
  const ws = line(id).words.filter((w) => norm(w.w) === norm(palavra));
  if (!ws[n]) throw new Error(`palavra "${palavra}" (#${n}) não está em ${id}`);
  return fr(ws[n].s);
}
/** quadro em que termina a n-ésima palavra igual a `palavra` */
export function we(id: string, palavra: string, n = 0): number {
  const ws = line(id).words.filter((w) => norm(w.w) === norm(palavra));
  if (!ws[n]) throw new Error(`palavra "${palavra}" (#${n}) não está em ${id}`);
  return fr(ws[n].e);
}

/** a boca da médica: 0 fechada · 1 aberta · 2 "oh". Abre dentro das palavras dela, alternando em três quadros. */
export function bocaMedica(g: number): number {
  for (const l of LINES) {
    if (!l.id.startsWith("med")) continue;
    if (g < fr(l.start) - 2 || g > fr(l.end) + 2) continue;
    for (const w of l.words) {
      const s = fr(w.s), e = fr(w.e);
      if (g >= s && g < e) {
        const fase = Math.floor((g - s) / 3) % 3;
        const temO = /[oóôu]/i.test(w.w);
        return fase === 2 ? 0 : fase === 1 && temO ? 2 : 1;
      }
    }
  }
  return 0;
}
/** a médica está falando neste quadro? (para o selo aparecer) */
export function medicaFala(g: number, folga = 10): boolean {
  return LINES.some((l) => l.id.startsWith("med") && g >= fr(l.start) - folga && g <= fr(l.end) + folga);
}

/** a pilha da pergunta: "dá pra operar / um rosto / QUE NÃO EXISTE?", montada palavra a palavra */
export const PilhaTitulo: React.FC<{ fOperar: number; fRosto: number; fExiste: number; top?: number; sub?: number; tom?: "claro" | "escuro" }> = ({
  fOperar, fRosto, fExiste, top = 225, sub, tom = "claro",
}) => {
  const g = useG();
  const cor = tom === "claro" ? P.cream : P.ink;
  const entra = (f: number) => {
    const a = g < f ? 0 : pp(twos(g - f), 0, 8);
    return { opacity: a, transform: `translateY(${(1 - a) * 26}px)`, filter: `blur(${(1 - a) * 10}px)` };
  };
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center" }}>
      <div style={{ ...T.espacada(46, cor), ...entra(fOperar) }}>dá pra operar</div>
      <div style={{ ...T.italica(188, P.coral, 800), lineHeight: 0.9, marginTop: -6, marginBottom: 22, textShadow: tom === "claro" ? "0 14px 36px rgba(20,8,4,.5)" : "none", ...entra(fRosto) }}>um rosto</div>
      <div style={{ ...T.pesada(118, cor), textShadow: tom === "claro" ? "0 12px 30px rgba(20,8,4,.5)" : "none", ...entra(fExiste) }}>QUE NÃO EXISTE?</div>
      {sub !== undefined && (
        <div style={{ marginTop: 40, ...entra(sub) }}>
          <div style={{ ...T.pesada(58, P.peach) }}>ANATOMIA HUMANA</div>
          <div style={{ ...T.italica(84, P.coral, 700), lineHeight: 0.8, margin: "4px 0 6px" }}>×</div>
          <div style={{ ...T.pesada(58, P.peach) }}>FILTRO DO INSTAGRAM</div>
        </div>
      )}
    </div>
  );
};

/** a tela do celular: a selfie da paciente com filtro (a Vênus), brilhinhos e interface genérica de câmera (sem marca) */
export const TelaSelfie: React.FC<{ w: number; h: number; fx: FiltroFx; malha?: number; g: number; ui?: boolean }> = ({ w, h, fx, malha = 0.14, g, ui = true }) => {
  const v: Vista = { cx: 285, cy: 390, zoom: (w / 470) * 1.08, x: w / 2 - 10, y: h / 2 - 60 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(80% 60% at 60% 30%, #f3c9d6 0%, #b98fb8 55%, #6d5a8a 100%)", overflow: "hidden" }}>
      <RostoFx fx={fx} v={v} w={w} h={h} />
      <Malha v={v} fx={fx} on={1} op={malha} t={g} />
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }, (_, i) => {
          const x = rnd(i * 3) * w, y = 100 + rnd(i * 7) * h * 0.6, s = (7 + rnd(i) * 12) * (0.6 + 0.4 * Math.abs(Math.sin(twos(g) * 0.12 + i)));
          return <path key={i} d={`M${x},${y - s} L${x + s * 0.25},${y - s * 0.25} L${x + s},${y} L${x + s * 0.25},${y + s * 0.25} L${x},${y + s} L${x - s * 0.25},${y + s * 0.25} L${x - s},${y} L${x - s * 0.25},${y - s * 0.25}Z`} fill="#fff" opacity={0.7} />;
        })}
      </svg>
      {ui && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: h * 0.04, display: "flex", justifyContent: "center", gap: w * 0.04, alignItems: "center" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: i === 2 ? w * 0.22 : w * 0.14, height: i === 2 ? w * 0.22 : w * 0.14, borderRadius: "50%", border: `${i === 2 ? 6 : 3}px solid #fff`, background: i === 2 ? "transparent" : `rgba(${120 + i * 20},${160 + i * 10},255,.35)` }} />
            ))}
          </div>
          <div style={{ position: "absolute", left: w * 0.12, right: w * 0.12, bottom: h * 0.2, height: 5, borderRadius: 3, background: "rgba(255,255,255,.35)" }}>
            <div style={{ position: "absolute", left: 0, width: "92%", height: 5, borderRadius: 3, background: "#fff" }} />
            <div style={{ position: "absolute", left: "92%", top: -11, width: 26, height: 26, marginLeft: -13, borderRadius: "50%", background: "#fff" }} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

/** o celular (corpo preto arredondado) com a tela dentro */
export const Celular: React.FC<{ x: number; y: number; w: number; h: number; rot?: number; children: React.ReactNode; sombra?: number }> = ({ x, y, w, h, rot = 0, children, sombra = 1 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg)`, borderRadius: w * 0.15, background: "#0d0d10", boxShadow: `0 ${60 * sombra}px ${90 * sombra}px rgba(0,0,0,.6), 0 0 0 3px #2a2a30 inset` }}>
    <div style={{ position: "absolute", left: w * 0.038, top: w * 0.038, width: w * 0.924, height: h - w * 0.076, borderRadius: w * 0.115, overflow: "hidden" }}>{children}</div>
  </div>
);
