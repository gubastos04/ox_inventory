import React from 'react';
import { useAppSelector } from '../../store';
import { selectLeftInventory, selectRightInventory } from '../../store/inventory';
import { InventoryType } from '../../typings';
import InventorySlot from './InventorySlot';
import InventoryGrid from './InventoryGrid';

// left-hand column, separate from the two main inventory grids:
// - if the currently opened right-side inventory is a container (a bag being
//   opened), its grid renders here instead of in the generic right-panel slot
// - the player's first 5 slots (the hotbar) always render here as their own
//   compact panel, instead of living inside the main player grid
const InventorySideColumn: React.FC = () => {
  const leftInventory = useAppSelector(selectLeftInventory);
  const rightInventory = useAppSelector(selectRightInventory);

  const hotbarItems = leftInventory.items.slice(0, 5);
  const isContainerOpen = rightInventory.type === InventoryType.CONTAINER;

  return (
    <div className="inventory-side-column">
      {isContainerOpen && (
        <div className="inventory-container-preview">
          <InventoryGrid inventory={rightInventory} />
        </div>
      )}

      <div className="inventory-hotbar-panel">
        <div className="inventory-hotbar-row">
          {hotbarItems.map((item) => (
            <InventorySlot
              key={`hotbar-slot-${item.slot}`}
              item={item}
              inventoryType={leftInventory.type}
              inventoryGroups={leftInventory.groups}
              inventoryId={leftInventory.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventorySideColumn;