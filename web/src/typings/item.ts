export type ItemData = {
  name: string;
  label: string;
  stack: boolean;
  usable: boolean;
  close: boolean;
  count: number;
  description?: string;
  buttons?: string[];
  ammoName?: string;
  image?: string;
  rarity?: Rarity;
  type?: ComponentType;
  grid?: { width?: number; height?: number };
};

export type Rarity =
  | "comum"
  | "incomum"
  | "raro"
  | "epico"
  | "lendario"
  | "mitico";

export type ComponentType =
  | "flashlight"
  | "muzzle"
  | "barrel"
  | "grip"
  | "magazine"
  | "sight"
  | "skin";
