import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import { getTotalWeight } from '../../helpers';

const LeftInventory: React.FC = () => {
  const leftInventory = useAppSelector(selectLeftInventory);

  // the header must reflect the TOTAL weight of all 50 slots, not just the
  // ones this grid renders — the hotbar slots (1-5) live in the side column
  // now, so their weight has to be added back in explicitly here
  const totalWeight = getTotalWeight(leftInventory.items);

  // slots 1-5 render in the dedicated hotbar column instead — keeps this
  // grid the same shape/height as the right-side inventory panel
  const inventory = { ...leftInventory, items: leftInventory.items.slice(5) };

  return <InventoryGrid inventory={inventory} totalWeight={totalWeight} />;
};

export default LeftInventory;