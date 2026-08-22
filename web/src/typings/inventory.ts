import { Slot } from "./slot";

export enum InventoryType {
  PLAYER = "player",
  SHOP = "shop",
  CONTAINER = "container",
  CRAFTING = "crafting",
  DROP = "drop",
}

export type WorkbenchRecipe = {
  name: string;
  label: string;
  // 9 entries, left-to-right then top-to-bottom; false/undefined = empty cell
  grid: (string | false)[];
  result: {
    name: string;
    count: number | [number, number];
  };
};

export type Inventory = {
  id: string | number;
  type: string;
  slots: number;
  items: Slot[];
  maxWeight?: number;
  label?: string;
  groups?: Record<string, number>;
  canGoBack?: boolean;
  isWorkbench?: boolean;
  recipes?: WorkbenchRecipe[];
};
