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

  // Used to filter the source's own slot out of the whole items array
  // before searching — but that made it disappear from occupancy too, so
  // the fresh-space search saw the source's own slot as "unoccupied" (it's
  // simply absent from the list) and happily picked it as the target...
  // which then couldn't be resolved back to a real Slot object, since it
  // really isn't in that filtered array — every split failed with "No
  // available slot to split the stack into", even with the rest of the
  // inventory sitting empty. findAvailableSlot excludes the source's own
  // slot itself now (see helpers/index.ts), so the full array — with the
  // source's slot correctly still marked occupied — is what should be
  // passed through here.
  const targetSlot = findAvailableSlot(
    sourceSlot,
    sourceData,
    sourceInventory.items,
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
