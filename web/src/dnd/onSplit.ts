import { findAvailableSlot } from "../helpers";
import { validateMove } from "../thunks/validateItems";
import { store } from "../store";
import { SlotWithItem } from "../typings";
import { moveSlots } from "../store/inventory";
import { Items } from "../store/items";

// splits `count` units off an existing stack into another free/stackable slot
// in the same (player) inventory — same underlying move/validate pipeline
// drag-and-drop uses, just triggered from the context menu modal instead
export const onSplit = (item: SlotWithItem, count: number) => {
  const {
    inventory: { leftInventory: sourceInventory },
  } = store.getState();

  const sourceSlot = sourceInventory.items[item.slot - 1] as SlotWithItem;
  const sourceData = Items[sourceSlot.name];

  if (sourceData === undefined)
    return console.error(`${sourceSlot.name} item data undefined!`);

  // exclude the source slot itself, otherwise a stackable item with no other
  // matching stack around would "find" itself as the target
  const candidates = sourceInventory.items.filter(
    (slot) => slot.slot !== sourceSlot.slot,
  );
  const targetSlot = findAvailableSlot(
    sourceSlot,
    sourceData,
    candidates,
    sourceInventory,
  );

  if (!targetSlot)
    return console.warn("No available slot to split the stack into");
  if (count <= 0 || count >= sourceSlot.count) return;

  const data = {
    fromSlot: sourceSlot,
    toSlot: targetSlot,
    fromType: sourceInventory.type,
    toType: sourceInventory.type,
    count,
  };

  store.dispatch(
    validateMove({
      ...data,
      fromSlot: sourceSlot.slot,
      toSlot: targetSlot.slot,
    }),
  );

  store.dispatch(moveSlots(data));
};
