// Janelas das cenas no tempo global (derivadas da narração). Um projeto novo reescreve só isto.
import { cut, TOTAL } from "../engine/timeline";

export const SC = {
  abertura: [0, cut("relogio", "dado")],
  dado: [cut("relogio", "dado"), cut("dado", "fecho")],
  fecho: [cut("dado", "fecho"), TOTAL],
} as const satisfies Record<string, readonly [number, number]>;
