import { Items } from "../store/items";
import { Slot } from "../typings";

/*
  Tetris-style grid placement — mirrors modules/inventory/grid.lua exactly.
  Used to render items spanning multiple cells and to preview whether a
  drag would fit *before* dropping — this file is UX only. The server
  (modules/inventory/grid.lua) is what actually decides whether a move is
  allowed; nothing here should be treated as authoritative.

  IMPORTANT: GRID_COLS and HOTBAR_SIZE must stay in sync with both
  InventoryGrid.tsx and modules/inventory/grid.lua.
*/

export const GRID_COLS = 7;
export const HOTBAR_SIZE = 7;

const TETRIS_TYPES = new Set([
  "player",
  "drop",
  "newdrop",
  "container",
  "stash",
  "trunk",
  "glovebox",
]);

// The 3x3 crafting workbench is, under the hood, a personal 'stash' named
// 'workbench:<identifier>' — it must stay a plain 1-slot-per-cell grid
// regardless of that, so it's excluded here by id prefix rather than type.
const isExcludedStash = (invId: string) => invId.startsWith("workbench:");

export const isTetrisType = (invType: string, invId: string) =>
  TETRIS_TYPES.has(invType) && !isExcludedStash(invId);

export const isTetrisSlot = (invType: string, invId: string, slot: number) => {
  if (!isTetrisType(invType, invId)) return false;
  if (invType === "player" && slot <= HOTBAR_SIZE) return false;
  return true;
};

export const getItemSize = (
  itemName: string | undefined,
): [width: number, height: number] => {
  const grid = itemName ? Items[itemName]?.grid : undefined;
  return [grid?.width || 1, grid?.height || 1];
};

// Cells (slot numbers) an item of size w x h anchored at `slot` would
// occupy. Returns null if that footprint would run off the right edge of
// the row it starts on.
export const getOccupiedCells = (
  slot: number,
  w: number,
  h: number,
): number[] | null => {
  if (w <= 1 && h <= 1) return [slot];

  const col = (slot - 1) % GRID_COLS;
  const row = (slot - 1 - col) / GRID_COLS;

  if (col + w > GRID_COLS) return null;

  const cells: number[] = [];

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      cells.push((row + dy) * GRID_COLS + (col + dx) + 1);
    }
  }

  return cells;
};

// Every cell currently claimed by any item's footprint in `items`, keyed
// by slot number -> the anchor slot of the item covering it. Build this
// once per render/hover check rather than recomputing per-cell.
export const buildOccupancyMap = (
  items: Slot[],
  invType: string,
  invId: string,
  ignoreAnchor?: number,
): Map<number, number> => {
  const occupancy = new Map<number, number>();

  for (const item of items) {
    if (!item.name || item.slot === ignoreAnchor) continue;
    if (!isTetrisSlot(invType, invId, item.slot)) continue;

    const [w, h] = getItemSize(item.name);
    const cells = getOccupiedCells(item.slot, w, h);
    if (!cells) continue;

    for (const cell of cells) occupancy.set(cell, item.slot);
  }

  return occupancy;
};

// Whether an item of size w x h can be placed at `anchorSlot`, given a
// precomputed occupancy map (see buildOccupancyMap) and the inventory's
// total slot count.
export const canPlace = (
  anchorSlot: number,
  w: number,
  h: number,
  occupancy: Map<number, number>,
  totalSlots: number,
): boolean => {
  const cells = getOccupiedCells(anchorSlot, w, h);
  if (!cells) return false;

  for (const cell of cells) {
    if (cell > totalSlots) return false;
    if (occupancy.has(cell)) return false;
  }

  return true;
};

// First anchor slot where an item of size w x h fits — used for
// "auto-place" flows (split-stack modal, double-click, etc) instead of the
// plain "first empty numbered slot" logic that only makes sense pre-tetris.
export const findFirstFit = (
  w: number,
  h: number,
  occupancy: Map<number, number>,
  totalSlots: number,
  startSlot: number,
): number | null => {
  for (let slot = startSlot; slot <= totalSlots; slot++) {
    if (canPlace(slot, w, h, occupancy, totalSlots)) return slot;
  }
  return null;
};
