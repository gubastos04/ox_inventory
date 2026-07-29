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
  /** only present on weapon-component items — which slot they attach to */
  type?: ComponentType;
};

export type Rarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'mitico';

export type ComponentType = 'flashlight' | 'muzzle' | 'barrel' | 'grip' | 'magazine' | 'sight' | 'skin';