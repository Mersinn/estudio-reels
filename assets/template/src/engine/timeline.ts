// A NARRAÇÃO É O RELÓGIO. Todo corte, legenda e efeito se prende a uma palavra de src/data/vo.json
// (gerado por scripts/tts.py ou scripts/align_recording.py). Trocar a voz re-temporiza o vídeo inteiro.
import vo from "../data/vo.json";
import { FPS } from "../brand/brand";

export type Word = { w: string; s: number; e: number };
export type Line = { id: string; scene: string; start: number; end: number; audioStart: number; audioDur: number; text: string; words: Word[] };

export const LINES = vo.lines as Line[];
const byId = Object.fromEntries(LINES.map((l) => [l.id, l])) as Record<string, Line>;

export const line = (id: string): Line => {
  const l = byId[id];
  if (!l) throw new Error(`fala desconhecida: ${id}`);
  return l;
};
export const fr = (sec: number) => Math.round(sec * FPS);
/** quadro em que a palavra de índice i da fala começa */
export const wf = (id: string, i: number) => fr(line(id).words[i].s);
/** quadro em que a primeira palavra que contém `needle` começa */
export const wfind = (id: string, needle: string) => {
  const w = line(id).words.find((x) => x.w.toLowerCase().includes(needle.toLowerCase()));
  if (!w) throw new Error(`palavra "${needle}" não está em ${id}`);
  return fr(w.s);
};
export const ls = (id: string) => fr(line(id).start);
export const le = (id: string) => fr(line(id).end);
/** corte no meio do silêncio entre duas falas (o melhor ponto de corte é o silêncio) */
export const cut = (a: string, b: string) => Math.round((le(a) + ls(b)) / 2);
export const TOTAL = fr(vo.total);
