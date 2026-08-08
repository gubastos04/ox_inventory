import React, { useState } from "react";
import useNuiEvent from "../../hooks/useNuiEvent";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  refreshSlots,
  selectRightInventory,
  setAdditionalMetadata,
  setupInventory,
} from "../../store/inventory";
import { useExitListener } from "../../hooks/useExitListener";
import type { Inventory as InventoryProps } from "../../typings";
import RightInventory from "./RightInventory";
import LeftInventory from "./LeftInventory";
import Tooltip from "../utils/Tooltip";
import { closeTooltip } from "../../store/tooltip";
import InventoryContext from "./InventoryContext";
import { closeContextMenu } from "../../store/contextMenu";
import GiveItemModal from "./GiveItemModal";
import SplitStackModal from "./SplitStackModal";
import WeaponComponentsModal from "./WeaponComponentsModal";
import Fade from "../utils/transitions/Fade";
import { closeGiveModal } from "../../store/giveItem";
import { closeSplitModal } from "../../store/splitStack";
import { closeComponentsModal } from "../../store/weaponComponents";
import InventoryHeader, { InventoryTab } from "./InventoryHeader";
import WorkbenchGrid from "./WorkbenchGrid";

const Inventory: React.FC = () => {
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<InventoryTab>("inventory");
  const dispatch = useAppDispatch();
  const rightInventory = useAppSelector(selectRightInventory);

  useNuiEvent<boolean>("setInventoryVisible", setInventoryVisible);
  useNuiEvent<false>("closeInventory", () => {
    setInventoryVisible(false);
    setActiveTab("inventory");
    dispatch(closeContextMenu());
    dispatch(closeTooltip());
    dispatch(closeGiveModal());
    dispatch(closeSplitModal());
    dispatch(closeComponentsModal());
  });
  useExitListener(setInventoryVisible);

  useNuiEvent<{
    leftInventory?: InventoryProps;
    rightInventory?: InventoryProps;
  }>("setupInventory", (data) => {
    dispatch(setupInventory(data));
    !inventoryVisible && setInventoryVisible(true);
  });

  useNuiEvent("refreshSlots", (data) => dispatch(refreshSlots(data)));

  useNuiEvent(
    "displayMetadata",
    (data: Array<{ metadata: string; value: string }>) => {
      dispatch(setAdditionalMetadata(data));
    },
  );

  return (
    <>
      <Fade in={inventoryVisible}>
        <div className="inventory-page">
          <InventoryHeader activeTab={activeTab} onChangeTab={setActiveTab} />

          <div className="inventory-wrapper">
            {activeTab === "inventory" && (
              <>
                <LeftInventory />
                <RightInventory />
              </>
            )}

            {activeTab === "crafting" && (
              <>
                <LeftInventory />
                {rightInventory.isWorkbench ? (
                  <WorkbenchGrid inventory={rightInventory} />
                ) : (
                  <div className="crafting-empty-placeholder">
                    <p>Aproxime-se de uma bancada de crafting.</p>
                  </div>
                )}
              </>
            )}

            <Tooltip />
            <InventoryContext />
            <GiveItemModal />
            <SplitStackModal />
            <WeaponComponentsModal />
          </div>
        </div>
      </Fade>
    </>
  );
};

export default Inventory;
