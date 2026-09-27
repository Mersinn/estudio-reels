// MARCA DO PROJETO · o único arquivo que muda quando a marca muda.
// O motor (src/engine) só conhece estes nomes semânticos. Uma marca nova = trocar valores, fontes e imagens.
// (Esta é a marca neutra do template. Pacotes de marca, como o da LACP, substituem este arquivo inteiro.)
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const BRAND = {
  nome: "Estúdio",
  handle: "@seu.perfil",
  selo: null as string | null, // ex.: "img/selo.png" (fica fixo no canto superior direito)
  logo: null as string | null, // ex.: "img/logo.png" (usado no fecho)
};

// Paleta por FUNÇÃO (não por nome de cor)
export const C = {
  fundoA: "#2E2925", // gradiente do fundo principal (claro → escuro)
  fundoB: "#241F1C",
  fundoC: "#171412",
  profundo: "#110E0C", // fundo "sério" (alertas, honestidade)
  papel: "#F6F1EA", // cartões e pranchas claras
  texto: "#F6F1EA", // texto sobre fundo escuro/colorido
  tinta: "#1B1714", // texto sobre fundo claro
  acento: "#E9B872", // manuscrita e realces sobre escuro (use pouco)
  destaque: "#D1603D", // números e realces sobre claro
  apoio: "#8A7F74", // barras de comparação, elementos secundários
} as const;

// Papéis tipográficos
export const F = {
  impacto: "Mont", // palavra-gancho, legenda (Montserrat 900)
  espacada: "Mont", // CAIXA ALTA com tracking largo (Montserrat 500)
  manuscrita: "Script", // 1–3 palavras emocionais (Great Vibes)
  editorial: "Playfair", // frases de peso, itálico (Playfair Display)
  corpo: "Pop", // texto corrido (Poppins)
  tecnica: "Mono", // rótulos, fontes, contadores (IBM Plex Mono)
} as const;

const font = (family: string, file: string, weight: string, style: "normal" | "italic" = "normal") =>
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, style });

export const fontsReady = Promise.all([
  font("Mont", "montserrat-latin-500-normal.woff2", "500"),
  font("Mont", "montserrat-latin-700-normal.woff2", "700"),
  font("Mont", "montserrat-latin-800-normal.woff2", "800"),
  font("Mont", "montserrat-latin-900-normal.woff2", "900"),
  font("Script", "great-vibes-latin-400-normal.woff2", "400"),
  font("Playfair", "playfair-display-latin-400-normal.woff2", "400"),
  font("Playfair", "playfair-display-latin-700-normal.woff2", "700"),
  font("Playfair", "playfair-display-latin-900-normal.woff2", "900"),
  font("Playfair", "playfair-display-latin-400-italic.woff2", "400", "italic"),
  font("Playfair", "playfair-display-latin-600-italic.woff2", "600", "italic"),
  font("Pop", "poppins-latin-400-normal.woff2", "400"),
  font("Pop", "poppins-latin-600-normal.woff2", "600"),
  font("Mono", "ibm-plex-mono-latin-400-normal.woff2", "400"),
  font("Mono", "ibm-plex-mono-latin-600-normal.woff2", "600"),
]);

// Formato Reels/Stories e área segura (interface do Instagram cobre topo, base e coluna direita)
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const SAFE = { top: 220, bottom: 380, right: 140, left: 60 } as const;
