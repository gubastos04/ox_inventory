import { Rarity } from "../typings";

export const RARITY_COLORS: Record<Rarity, string> = {
  comum: "#7a7a82",
  incomum: "#3ddc84",
  raro: "#3b9eff",
  epico: "#a970ff",
  lendario: "#f5a623",
  mitico: "#ff3d68",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  comum: "rgba(122, 122, 130, 0.32)",
  incomum: "rgba(61, 220, 132, 0.35)",
  raro: "rgba(59, 158, 255, 0.38)",
  epico: "rgba(169, 112, 255, 0.4)",
  lendario: "rgba(245, 166, 35, 0.42)",
  mitico: "rgba(255, 61, 104, 0.48)",
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
