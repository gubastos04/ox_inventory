import { Rarity } from "../typings";

export const RARITY_COLORS: Record<Rarity, string> = {
  comum: "#c6c6c6",
  incomum: "#59d36d",
  raro: "#4fa7ff",
  epico: "#9b5dff",
  lendario: "#ffb547",
  mitico: "#ff315e",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  comum: "rgba(198, 198, 198, 0.3)",
  incomum: "rgba(89, 211, 109, 0.35)",
  raro: "rgba(79, 167, 255, 0.38)",
  epico: "rgba(155, 93, 255, 0.4)",
  lendario: "rgba(255, 181, 71, 0.42)",
  mitico: "rgba(255, 49, 94, 0.45)",
};

// TODO: move into locale files if this needs to support languages other than pt-BR
export const RARITY_LABELS: Record<Rarity, string> = {
  comum: "Comum",
  incomum: "Incomum",
  raro: "Raro",
  epico: "Épico",
  lendario: "Lendário",
  mitico: "Mítico",
};
