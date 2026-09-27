// Personagens no molde Kurzgesagt (formas geométricas, cabeça grande, olhos expressivos, degradê suave
// e luz de borda), na paleta da LACP. Meio corpo: a mesa cobre o resto.
// Coordenadas locais: (0,0) = cintura, a cabeça fica por volta de y = -300.
import React from "react";
import { P } from "./kit";

export type Olhos = "normal" | "arregalado" | "baixo" | "fechado";
export type PersProps = {
  tipo: "preceptor" | "estudante";
  x: number;
  y: number;
  escala?: number;
  virado?: 1 | -1; // 1 = olhando para a direita
  cabeca?: number; // rotação da cabeça (graus)
  olhos?: Olhos;
  suor?: number; // 0..1 gota de suor (nervoso)
  fala?: number; // 0..1 máscara mexendo (falando)
  sobrancelha?: number; // -1 (franzida) .. 1 (levantada)
  maos?: number; // 0..1 mãos levantadas (em posição cirúrgica)
  op?: number;
  blur?: number;
};

const COR = {
  preceptor: { avental: "#7E3620", aventalLuz: "#9A4428", gorro: "#3A1E16", gorroDet: "#5A2E20", pele: "#E7A583", peleSombra: "#C98567" },
  estudante: { avental: "#C1633F", aventalLuz: "#D9774F", gorro: "#EE8560", gorroDet: "#F6A585", pele: "#EDB292", peleSombra: "#D3926F" },
};

export const Personagem: React.FC<PersProps> = ({
  tipo, x, y, escala = 1, virado = 1, cabeca = 0, olhos = "normal", suor = 0, fala = 0, sobrancelha = 0, maos = 0, op = 1, blur = 0,
}) => {
  const c = COR[tipo];
  const alto = tipo === "preceptor";
  const ombro = alto ? 150 : 130;
  const hy = alto ? -318 : -290; // centro da cabeça
  const r = alto ? 86 : 82;
  const eyeY = hy + 6;
  const eyeR = olhos === "arregalado" ? 15 : 11;
  const lift = sobrancelha * 10;
  const id = `${tipo}${x}${y}`.replace(/[^a-z0-9]/gi, "");
  return (
    <g transform={`translate(${x},${y}) scale(${escala * virado},${escala})`} opacity={op} style={blur ? { filter: `blur(${blur}px)` } : undefined}>
      <defs>
        <linearGradient id={`av${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={c.aventalLuz} />
          <stop offset="0.55" stopColor={c.avental} />
          <stop offset="1" stopColor="#5a2415" />
        </linearGradient>
        <radialGradient id={`pl${id}`} cx="0.62" cy="0.38" r="0.75">
          <stop offset="0" stopColor={c.pele} />
          <stop offset="1" stopColor={c.peleSombra} />
        </radialGradient>
      </defs>
      {/* tronco (avental) */}
      <path d={`M${-ombro},-150 Q${-ombro - 10},-205 ${-ombro + 50},-222 L${ombro - 50},-222 Q${ombro + 10},-205 ${ombro},-150 L${ombro - 12},40 L${-ombro + 12},40 Z`} fill={`url(#av${id})`} />
      {/* gola em V */}
      <path d="M-44,-222 L0,-160 L44,-222" fill="none" stroke="rgba(20,8,4,.35)" strokeWidth={8} strokeLinejoin="round" />
      {/* braços: de relaxados a mãos em posição (acima da cintura, luvas) */}
      {[-1, 1].map((s) => {
        const hx = s * (ombro - 20 - maos * 70);
        const hyy = -40 - maos * 120;
        return (
          <g key={s}>
            <path d={`M${s * (ombro - 16)},-196 Q${s * (ombro + 24)},-90 ${hx},${hyy}`} fill="none" stroke={c.avental} strokeWidth={62} strokeLinecap="round" />
            <circle cx={hx} cy={hyy} r={30} fill="#F1DCCB" />
            <circle cx={hx - s * 8} cy={hyy - 8} r={10} fill="rgba(255,255,255,.5)" />
          </g>
        );
      })}
      {/* pescoço */}
      <rect x={-30} y={hy + r - 30} width={60} height={60} rx={20} fill={c.peleSombra} />
      {/* cabeça */}
      <g transform={`rotate(${cabeca}, 0, ${hy + 40})`}>
        <circle cx={0} cy={hy} r={r} fill={`url(#pl${id})`} />
        {/* orelha */}
        <ellipse cx={-r + 6} cy={hy + 10} rx={16} ry={22} fill={c.peleSombra} />
        {/* gorro cirúrgico */}
        <path d={`M${-r - 6},${hy - 6} Q${-r},${hy - r - 38} 0,${hy - r - 30} Q${r},${hy - r - 38} ${r + 6},${hy - 6} Q0,${hy - 28} ${-r - 6},${hy - 6} Z`} fill={c.gorro} />
        {[-40, -8, 26, 56].map((dx, i) => <circle key={i} cx={dx} cy={hy - r + 2 + (i % 2) * 14} r={6} fill={c.gorroDet} />)}
        {tipo === "estudante" && <circle cx={-r + 4} cy={hy - 40} r={26} fill={c.gorro} />}
        {/* máscara */}
        <path
          d={`M${-r + 10},${hy + 24} Q0,${hy + 10 - fala * 6} ${r - 10},${hy + 24} Q${r - 14},${hy + 74 + fala * 4} 0,${hy + 84 + fala * 6} Q${-r + 14},${hy + 74 + fala * 4} ${-r + 10},${hy + 24} Z`}
          fill={P.cream}
        />
        <path d={`M${-r + 18},${hy + 44} Q0,${hy + 38 - fala * 3} ${r - 18},${hy + 44}`} stroke="rgba(120,70,50,.25)" strokeWidth={4} fill="none" />
        <line x1={-r + 12} y1={hy + 26} x2={-r - 2} y2={hy + 10} stroke={P.cream} strokeWidth={5} />
        {/* olhos */}
        {[-1, 1].map((s) => (
          <g key={s}>
            {olhos === "fechado" ? (
              <path d={`M${s * 30 - 12},${eyeY} q12,8 24,0`} stroke={P.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
            ) : (
              <>
                {olhos === "arregalado" && <circle cx={s * 30 + 6} cy={eyeY} r={eyeR + 6} fill="#FFF6EE" />}
                <circle cx={s * 30 + (olhos === "baixo" ? 4 : 8)} cy={eyeY + (olhos === "baixo" ? 6 : 0)} r={eyeR} fill={P.ink} />
                <circle cx={s * 30 + 12} cy={eyeY - 4} r={3.5} fill="#fff" />
              </>
            )}
            <path
              d={`M${s * 30 - 14},${eyeY - 26 - lift - (s === 1 && sobrancelha < 0 ? 0 : 0)} Q${s * 30 + 4},${eyeY - 34 - lift + (sobrancelha < 0 ? s * 6 : 0)} ${s * 30 + 20},${eyeY - 26 - lift}`}
              stroke={P.ink} strokeWidth={6} fill="none" strokeLinecap="round"
            />
          </g>
        ))}
        {tipo === "preceptor" && (
          <g stroke={P.ink} strokeWidth={4} fill="none" opacity={0.85}>
            <circle cx={-22} cy={eyeY} r={24} />
            <circle cx={38} cy={eyeY} r={24} />
            <line x1={2} y1={eyeY - 2} x2={14} y2={eyeY - 2} />
          </g>
        )}
        {/* gota de suor */}
        {suor > 0 && (
          <path
            d={`M${r - 10},${hy - 34 + (1 - suor) * -10} q-14,24 0,34 q14,-10 0,-34 Z`}
            fill="#FFF3E8" stroke="rgba(120,70,50,.35)" strokeWidth={2} opacity={suor}
          />
        )}
        {/* luz de borda */}
        <path d={`M${r - 8},${hy - 40} A${r - 6},${r - 6} 0 0 1 ${r - 20},${hy + 50}`} stroke="rgba(255,236,210,.45)" strokeWidth={6} fill="none" />
      </g>
    </g>
  );
};
