// Cartas do "jogo" (a escolha do estudante) e cartões de fonte (o jeito Vox de mostrar a evidência).
// Os atributos são um RESUMO DIDÁTICO das fontes do dossiê (não uma nota científica):
//   everte:  donati > simples > intradérmico   (F3: indicação principal do colchoeiro é everter)
//   tensão:  donati > simples > intradérmico   (F3: fecha sob tensão · F2: intradérmico pede ausência de tensão)
//   some:    intradérmico > simples > donati   (F2: sem pontos visíveis · F3: colchoeiro marca mais)
import React from "react";
import { useG } from "../engine/ui";
import { d, Marca, P, Pt, pp, T, twos } from "./kit";
import type { Tipo } from "./Pele";

export const NOME: Record<Tipo, string> = { simples: "simples", donati: "donati", intra: "intradérmico" };
export const SUB: Record<Tipo, string> = { simples: "separado · nó a nó", donati: "colchoeiro vertical", intra: "contínuo · na derme" };
export const STATS: Record<Tipo, [number, number, number]> = { simples: [2, 2, 1], donati: [3, 3, 0], intra: [1, 1, 3] };
export const ROTULOS = ["everte a borda", "aguenta tensão", "some na pele"];

/** mini corte com o trajeto do fio (ícone da carta) */
export const Icone: React.FC<{ tipo: Tipo; w?: number }> = ({ tipo, w = 220 }) => {
  const paths: Record<Tipo, Pt[]> = {
    simples: [[-26, -18], [-20, 0], [-30, 22], [-22, 44], [0, 52], [22, 44], [30, 22], [20, 0], [26, -18]],
    donati: [[-50, -16], [-44, 0], [-52, 30], [-36, 56], [0, 62], [36, 56], [52, 30], [44, 0], [30, -10], [12, 0], [0, 12], [-12, 0], [-26, -14]],
    intra: [[-64, 20], [-10, 20], [-10, 30], [10, 30], [10, 20], [64, 20]],
  };
  const pts = paths[tipo];
  return (
    <svg width={w} height={w * 0.5} viewBox="-80 -30 160 80">
      <rect x={-76} y={0} width={152} height={8} fill={P.epi} />
      <rect x={-76} y={8} width={152} height={30} fill={P.derme} />
      <rect x={-76} y={38} width={152} height={30} fill={P.hipo} />
      <line x1={0} y1={0} x2={0} y2={60} stroke={P.parede} strokeWidth={2} />
      <path d={d(pts)} fill="none" stroke={P.fio} strokeWidth={3.4} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export const Carta: React.FC<{
  tipo: Tipo;
  x: number;
  y: number;
  rot?: number;
  escala?: number;
  from: number; // entrada (distribuída como carta)
  revela?: [number, number, number]; // quadros em que cada atributo aparece (Infinity = "?")
  brilho?: number; // 0..1 carta escolhida
  op?: number;
  n: number;
  veredito?: { f: number; texto: string; ok: boolean | null };
}> = ({ tipo, x, y, rot = 0, escala = 1, from, revela = [Infinity, Infinity, Infinity], brilho = 0, op = 1, n, veredito }) => {
  const g = useG();
  if (g < from) return null;
  const a = pp(twos(g - from), 0, 10);
  const st = STATS[tipo];
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width: 300, height: 450, marginLeft: -150, marginTop: -225, opacity: a * op,
        transform: `translateY(${(1 - a) * 260}px) rotate(${rot + (1 - a) * 18}deg) scale(${escala * (0.8 + 0.2 * a)})`,
        background: `linear-gradient(160deg, ${P.cream} 0%, #F3E4D6 100%)`, borderRadius: 26,
        boxShadow: `0 0 0 5px ${P.gold}, 0 0 0 9px rgba(42,21,16,.85), 0 30px 60px rgba(10,4,2,.55)${brilho ? `, 0 0 ${60 * brilho}px ${20 * brilho}px rgba(230,200,134,${0.55 * brilho})` : ""}`,
        padding: "22px 22px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", ...T.mono(17, P.terra) }}>
        <span>ponto 0{n}</span>
        <span style={{ color: P.gold }}>◆</span>
      </div>
      <div style={{ background: P.blush, borderRadius: 14, marginTop: 12, display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
        <Icone tipo={tipo} w={236} />
      </div>
      <div style={{ ...T.pesada(tipo === "intra" ? 39 : 58, P.ink), marginTop: 14, whiteSpace: "nowrap" }}>{NOME[tipo]}</div>
      <div style={{ ...T.mono(15, P.terra), marginTop: 6 }}>{SUB[tipo]}</div>
      {veredito && g >= veredito.f && (
        <div
          style={{
            position: "absolute", left: "50%", top: "30%", transform: `translate(-50%,-50%) rotate(-12deg) scale(${1.6 - 0.6 * pp(twos(g - veredito.f), 0, 6)})`,
            opacity: pp(twos(g - veredito.f), 0, 4), border: `6px solid ${veredito.ok === true ? P.gold : veredito.ok === false ? P.coralLo : P.ink}`,
            color: veredito.ok === true ? P.ink : veredito.ok === false ? P.coralLo : P.ink, background: veredito.ok === true ? "rgba(230,200,134,.92)" : "rgba(251,245,240,.9)",
            borderRadius: 12, padding: "10px 16px 8px", ...T.mono(26, "inherit"), fontWeight: 700, whiteSpace: "nowrap", zIndex: 3,
          }}
        >
          {veredito.texto}
        </div>
      )}
      <div style={{ marginTop: "auto" }}>
        {ROTULOS.map((r, i) => {
          const on = g >= revela[i];
          const k = on ? pp(g, revela[i], 8) : 0;
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7 }}>
              <span style={{ ...T.mono(14, P.ink2), letterSpacing: "0.06em" }}>{r}</span>
              <span style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map((j) =>
                  on ? (
                    <span key={j} style={{ width: 15, height: 15, borderRadius: 8, background: j < st[i] ? P.coralLo : "rgba(42,21,16,.14)", transform: `scale(${j < st[i] ? 0.4 + 0.6 * k : 1})` }} />
                  ) : (
                    <span key={j} style={{ ...T.mono(15, "rgba(42,21,16,.45)"), width: 15, textAlign: "center" }}>?</span>
                  ),
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** cartão de fonte (Vox): o documento aparece, a frase que sustenta a fala ganha marca-texto */
export const Fonte: React.FC<{
  x: number; y: number; w?: number; rot?: number; from: number; to: number;
  origem: string; antes?: string; marca: string; depois?: string; nota?: string;
}> = ({ x, y, w = 560, rot = 2, from, to, origem, antes = "", marca, depois = "", nota }) => {
  const g = useG();
  if (g < from || g > to + 8) return null;
  const a = pp(twos(g - from), 0, 10);
  const o = 1 - pp(twos(g), to, 8);
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width: w, opacity: Math.min(a, o),
        transform: `translateY(${(1 - a) * -60 + (1 - o) * -40}px) rotate(${rot + (1 - a) * 5}deg)`,
        background: "#FFF9F2", padding: "26px 30px 24px", borderRadius: 6,
        boxShadow: "0 24px 50px rgba(20,8,4,.35), 0 3px 8px rgba(20,8,4,.2)",
        backgroundImage: "repeating-linear-gradient(0deg, rgba(120,70,40,.05) 0 1px, transparent 1px 38px)",
      }}
    >
      <div style={{ position: "absolute", top: -16, left: w / 2 - 70, width: 140, height: 34, background: "rgba(233,190,120,.8)", transform: "rotate(-3deg)" }} />
      <div style={{ ...T.mono(16, P.terra) }}>{origem}</div>
      <div style={{ ...T.italica(34, P.ink, 600), lineHeight: 1.28, marginTop: 12 }}>
        “{antes}
        <Marca f={from + 12}>{marca}</Marca>
        {depois}”
      </div>
      {nota && <div style={{ ...T.mono(14, P.ink2), marginTop: 12, opacity: 0.8 }}>{nota}</div>}
    </div>
  );
};
