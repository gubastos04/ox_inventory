import { ComponentType } from '../typings';

export const COMPONENT_SLOTS: { type: ComponentType; label: string }[] = [
  { type: 'flashlight', label: 'Lanterna' },
  { type: 'muzzle', label: 'Silenciador' },
  { type: 'barrel', label: 'Cano' },
  { type: 'grip', label: 'Grip' },
  { type: 'magazine', label: 'Carregador' },
  { type: 'sight', label: 'Mira' },
  { type: 'skin', label: 'Skin' },
];