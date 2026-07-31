import InventoryGrid from "./InventoryGrid";
import { useAppSelector } from "../../store";
import { selectLeftInventory } from "../../store/inventory";
import { getTotalWeight } from "../../helpers";

const LeftInventory: React.FC = () => {
  const leftInventory = useAppSelector(selectLeftInventory);
  return <InventoryGrid inventory={leftInventory} />;
};

export default LeftInventory;
