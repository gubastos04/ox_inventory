import InventoryGrid from "./InventoryGrid";
import WorkbenchGrid from "./WorkbenchGrid";
import { useAppSelector } from "../../store";
import { selectRightInventory } from "../../store/inventory";

const RightInventory: React.FC = () => {
  const rightInventory = useAppSelector(selectRightInventory);

  if (rightInventory.isWorkbench) {
    return <WorkbenchGrid inventory={rightInventory} />;
  }

  return <InventoryGrid inventory={rightInventory} />;
};

export default RightInventory;
