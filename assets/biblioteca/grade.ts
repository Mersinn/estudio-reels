// Gradação de cor do rio. "bronze" era a v1 (reprovada: laranja-bronze apagado).
// Para comparar variações sem editar código: REMOTION_GRADE=coral|petroleo|bronze
export type Grade = {
  deep: [number, number, number]; // fundo, abaixo
  mid: [number, number, number]; // horizonte (casa com a névoa)
  hi: [number, number, number]; // perto da superfície
  fog: string;
  rays: [number, number, number];
  sandA: [number, number, number];
  sandB: [number, number, number];
  caustic: [number, number, number];
  weedA: [number, number, number];
  weedB: [number, number, number];
  rock: string;
  amb: [number, number, number];
  sun: [number, number, number];
  fish: [string, string, string, string, string];
};

export const GRADES: Record<string, Grade> = {
  bronze: {
    deep: [0.3, 0.15, 0.07], mid: [0.54, 0.29, 0.14], hi: [0.86, 0.52, 0.28], fog: "#8a4a24",
    rays: [1.0, 0.82, 0.58], sandA: [0.42, 0.24, 0.12], sandB: [0.62, 0.38, 0.2], caustic: [1.0, 0.85, 0.6],
    weedA: [0.16, 0.12, 0.05], weedB: [0.46, 0.36, 0.16], rock: "#3a2414",
    amb: [0.42, 0.3, 0.22], sun: [1.0, 0.86, 0.66], fish: ["#2e231e", "#665649", "#a39282", "#d6c7b8", "#f8f0e7"],
  },
  // coral luminoso: a água no tom da marca, saturada e clara; o peixe prata-frio contrasta e salta
  coral: {
    deep: [0.56, 0.2, 0.18], mid: [0.86, 0.46, 0.36], hi: [1.0, 0.85, 0.7], fog: "#db755c",
    rays: [1.0, 0.94, 0.82], sandA: [0.74, 0.4, 0.33], sandB: [0.98, 0.73, 0.6], caustic: [1.0, 0.96, 0.88],
    weedA: [0.46, 0.17, 0.15], weedB: [0.84, 0.5, 0.4], rock: "#8e3f30",
    amb: [0.6, 0.42, 0.38], sun: [1.0, 0.94, 0.84], fish: ["#1d2226", "#4c575e", "#8c989f", "#cdd5d8", "#f7f9f8"],
  },
  // petróleo com luz dourada: profundidade fria, sol quente (contraste complementar)
  petroleo: {
    deep: [0.04, 0.13, 0.16], mid: [0.12, 0.34, 0.38], hi: [0.98, 0.83, 0.6], fog: "#1c4e57",
    rays: [1.0, 0.86, 0.6], sandA: [0.18, 0.25, 0.22], sandB: [0.45, 0.45, 0.35], caustic: [1.0, 0.86, 0.58],
    weedA: [0.05, 0.13, 0.1], weedB: [0.3, 0.42, 0.26], rock: "#1c2828",
    amb: [0.32, 0.42, 0.44], sun: [1.0, 0.9, 0.72], fish: ["#2a2622", "#6a6158", "#aa9d8f", "#ded3c5", "#fbf5ec"],
  },
};

export const GRADE: Grade = GRADES[(process.env.REMOTION_GRADE as string) || "coral"] ?? GRADES.coral;
