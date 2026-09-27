// DECUPAGEM DA LEGENDA (sintaxe em src/engine/Captions.tsx).
// Falas ausentes daqui ficam sem legenda porque a cena já tem tipografia própria (dado, fecho).
import type { CaptionSpec } from "../engine/Captions";

export const LEGENDAS: CaptionSpec = {
  abre: { spec: "todo vídeo / deste estúdio / começa pela / *voz." },
  relogio: { spec: "ela vira o / *relógio: || cada corte cai / numa ~palavra." },
};
