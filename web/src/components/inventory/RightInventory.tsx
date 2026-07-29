import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectRightInventory } from '../../store/inventory';
import { InventoryType } from '../../typings';

const RightInventory: React.FC = () => {
  const rightInventory = useAppSelector(selectRightInventory);

  // containers render in the dedicated side column instead of here
  if (rightInventory.type === InventoryType.CONTAINER) return null;

  return <InventoryGrid inventory={rightInventory} />;
};

export default RightInventory;