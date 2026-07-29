import React, { useState } from "react";
import { getItemUrl, isSlotWithItem } from "../../helpers";
import useNuiEvent from "../../hooks/useNuiEvent";
import { useAppSelector } from "../../store";
import { selectLeftInventory } from "../../store/inventory";
import { SlotWithItem } from "../../typings";
import SlideUp from "../utils/transitions/SlideUp";

const InventoryHotbar: React.FC = () => {
  const [hotbarVisible, setHotbarVisible] = useState(false);
  const items = useAppSelector(selectLeftInventory).items.slice(0, 5);

  //stupid fix for timeout
  const [handle, setHandle] = useState<ReturnType<typeof setTimeout>>();
  useNuiEvent("toggleHotbar", () => {
    if (hotbarVisible) {
      setHotbarVisible(false);
    } else {
      if (handle) clearTimeout(handle);
      setHotbarVisible(true);
      setHandle(setTimeout(() => setHotbarVisible(false), 3000));
    }
  });

  return (
    <SlideUp in={hotbarVisible}>
      <div className="hotbar-container">
        {items.map((item) => (
          <div
            className="hotbar-item-slot"
            style={{
              backgroundImage: `url(${item?.name ? getItemUrl(item as SlotWithItem) : "none"}`,
            }}
            key={`hotbar-${item.slot}`}
          >
            <div
              className={`inventory-slot-number ${isSlotWithItem(item) ? "has-item" : ""}`}
            >
              {item.slot}
            </div>
            {isSlotWithItem(item) && item.count > 0 && (
              <div className="inventory-slot-count">
                {item.count.toLocaleString("en-us")}
              </div>
            )}
          </div>
        ))}
      </div>
    </SlideUp>
  );
};

export default InventoryHotbar;
