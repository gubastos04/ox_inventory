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
  id: string;
  type: string;
  slots: number;
  items: Slot[];
  maxWeight?: number;
  label?: string;
  groups?: Record<string, number>;
  // Sent by the client for container inventories — true when there's a
  // previous inventory (the ground, an outer bag, etc.) to go back to.
  canGoBack?: boolean;
  // Sent by the client when this is the personal 3x3 crafting stash — see
  // modules/workbench/server.lua and components/inventory/WorkbenchGrid.tsx
  isWorkbench?: boolean;
  recipes?: WorkbenchRecipe[];
};
