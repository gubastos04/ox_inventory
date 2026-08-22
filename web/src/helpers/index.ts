import {
  Inventory,
  InventoryType,
  ItemData,
  Slot,
  SlotWithItem,
  State,
} from "../typings";
import { isEqual } from "lodash-es";
import { store } from "../store";
import { Items } from "../store/items";
import { imagepath } from "../store/imagepath";
import { fetchNui } from "../utils/fetchNui";
import {
  buildOccupancyMap,
  findFirstFit,
  getItemSize,
  HOTBAR_SIZE,
  isTetrisType,
} from "./grid";

export const canPurchaseItem = (
  item: Slot,
  inventory: { type: Inventory["type"]; groups: Inventory["groups"] },
) => {
  if (inventory.type !== "shop" || !isSlotWithItem(item)) return true;

  if (item.count !== undefined && item.count === 0) return false;

  if (item.grade === undefined || !inventory.groups) return true;

  const leftInventory = store.getState().inventory.leftInventory;

  // Shop requires groups but player has none
  if (!leftInventory.groups) return false;

  const reqGroups = Object.keys(inventory.groups);

  if (Array.isArray(item.grade)) {
    for (let i = 0; i < reqGroups.length; i++) {
      const reqGroup = reqGroups[i];

      if (leftInventory.groups[reqGroup] !== undefined) {
        const playerGrade = leftInventory.groups[reqGroup];
        for (let j = 0; j < item.grade.length; j++) {
          const reqGrade = item.grade[j];

          if (playerGrade === reqGrade) return true;
        }
      }
    }

    return false;
  } else {
    for (let i = 0; i < reqGroups.length; i++) {
      const reqGroup = reqGroups[i];
      if (leftInventory.groups[reqGroup] !== undefined) {
        const playerGrade = leftInventory.groups[reqGroup];

        if (playerGrade >= item.grade) return true;
      }
    }

    return false;
  }
};

export const canCraftItem = (item: Slot, inventoryType: string) => {
  if (!isSlotWithItem(item) || inventoryType !== "crafting") return true;
  if (!item.ingredients) return true;
  const leftInventory = store.getState().inventory.leftInventory;
  const ingredientItems = Object.entries(item.ingredients);

  const remainingItems = ingredientItems.filter((ingredient) => {
    const [item, count] = [ingredient[0], ingredient[1]];
    const globalItem = Items[item];

    if (count >= 1) {
      if (globalItem && globalItem.count >= count) return false;
    }

    const hasItem = leftInventory.items.find((playerItem) => {
      if (isSlotWithItem(playerItem) && playerItem.name === item) {
        if (count < 1) {
          if (playerItem.metadata?.durability >= count * 100) return true;

          return false;
        }
      }
    });

    return !hasItem;
  });

  return remainingItems.length === 0;
};

export const isSlotWithItem = (
  slot: Slot,
  strict: boolean = false,
): slot is SlotWithItem =>
  (slot.name !== undefined && slot.weight !== undefined) ||
  (strict &&
    slot.name !== undefined &&
    slot.count !== undefined &&
    slot.weight !== undefined);

export const canStack = (sourceSlot: Slot, targetSlot: Slot) =>
  sourceSlot.name === targetSlot.name &&
  isEqual(sourceSlot.metadata, targetSlot.metadata);

export const findAvailableSlot = (
  item: Slot,
  data: ItemData,
  items: Slot[],
  targetInventory?: Inventory,
) => {
  const stackableSlot = data.stack
    ? items.find(
        (target) =>
          target.slot !== item.slot &&
          target.name === item.name &&
          isEqual(target.metadata, item.metadata),
      )
    : undefined;

  if (stackableSlot) return stackableSlot;

  // Tetris-enabled target (player/drop/container/stash/trunk/glovebox, but
  // not the workbench or anywhere else 1-slot-per-cell still applies) —
  // "first empty slot number" isn't good enough here, since a numbered
  // slot can be nominally unassigned yet still sit inside a bigger
  // neighboring item's footprint. This is a UX nicety, not the security
  // boundary — the server (modules/inventory/grid.lua) always re-validates
  // the actual chosen slot regardless of what this picks.
  if (
    targetInventory &&
    isTetrisType(targetInventory.type, targetInventory.id)
  ) {
    const [w, h] = getItemSize(item.name);
    const isPlayer = targetInventory.type === InventoryType.PLAYER;

    if (isPlayer && w <= 1 && h <= 1) {
      const freeHotbarSlot = items.find(
        (target) => target.slot <= HOTBAR_SIZE && target.name === undefined,
      );
      if (freeHotbarSlot) return freeHotbarSlot;
    }

    const occupancy = buildOccupancyMap(
      items,
      targetInventory.type,
      targetInventory.id,
    );
    const startSlot = isPlayer ? HOTBAR_SIZE + 1 : 1;
    const fit = findFirstFit(w, h, occupancy, targetInventory.slots, startSlot);

    if (fit !== null) return items.find((target) => target.slot === fit);
    return undefined;
  }

  return items.find((target) => target.name === undefined);
};

export const getTargetInventory = (
  state: State,
  sourceType: Inventory["type"],
  targetType?: Inventory["type"],
): { sourceInventory: Inventory; targetInventory: Inventory } => ({
  sourceInventory:
    sourceType === InventoryType.PLAYER
      ? state.leftInventory
      : state.rightInventory,
  targetInventory: targetType
    ? targetType === InventoryType.PLAYER
      ? state.leftInventory
      : state.rightInventory
    : sourceType === InventoryType.PLAYER
      ? state.rightInventory
      : state.leftInventory,
});

export const itemDurability = (metadata: any, curTime: number) => {
  // sorry dunak
  // it's ok linden i fix inventory
  if (metadata?.durability === undefined) return;

  let durability = metadata.durability;

  if (durability > 100 && metadata.degrade)
    durability =
      ((metadata.durability - curTime) / (60 * metadata.degrade)) * 100;

  if (durability < 0) durability = 0;

  return durability;
};

export const getTotalWeight = (items: Inventory["items"]) =>
  items.reduce(
    (totalWeight, slot) =>
      isSlotWithItem(slot) ? totalWeight + slot.weight : totalWeight,
    0,
  );

export const isContainer = (inventory: Inventory) =>
  inventory.type === InventoryType.CONTAINER;

export const getItemData = async (itemName: string) => {
  const resp: ItemData | null = await fetchNui("getItemData", itemName);

  if (resp?.name) {
    Items[itemName] = resp;
    return resp;
  }
};

export const getItemUrl = (item: string | SlotWithItem) => {
  const isObj = typeof item === "object";

  if (isObj) {
    if (!item.name) return;

    const metadata = item.metadata;

    // @todo validate urls and support webp
    if (metadata?.imageurl) return `${metadata.imageurl}`;
    if (metadata?.image) return `${imagepath}/${metadata.image}.png`;
  }

  const itemName = isObj ? (item.name as string) : item;
  const itemData = Items[itemName];

  if (!itemData) return `${imagepath}/${itemName}.png`;
  if (itemData.image) return itemData.image;

  itemData.image = `${imagepath}/${itemName}.png`;

  return itemData.image;
};
