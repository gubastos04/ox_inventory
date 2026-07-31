import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inventory, InventoryType } from "../../typings";
import WeightBar, { getLoadColor } from "../utils/WeightBar";
import InventorySlot from "./InventorySlot";
import { getTotalWeight } from "../../helpers";
import { useAppSelector } from "../../store";
import { useIntersection } from "../../hooks/useIntersection";

const PAGE_SIZE = 30;

// keep these in sync with $gridCols / $gridRows / $gridSize / $gridGap in index.scss —
// they're used to size the scrollable grid to however many rows the inventory
// actually needs (instead of always reserving a fixed 5-row block)
const GRID_COLS = 5;
const MAX_VISIBLE_ROWS = 5;
const ROW_HEIGHT_VH = 10.42; // $gridSize (10.2vh) + 0.22vh
const ROW_GAP_PX = 2; // $gridGap

const getContainerHeight = (rows: number) =>
  `calc(${rows * ROW_HEIGHT_VH}vh + ${rows * ROW_GAP_PX}px)`;

const InventoryGrid: React.FC<{ inventory: Inventory }> = ({ inventory }) => {
  const weight = useMemo(
    () =>
      inventory.maxWeight !== undefined
        ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000
        : 0,
    [inventory.maxWeight, inventory.items],
  );
  const [page, setPage] = useState(0);
  const containerRef = useRef(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);
  const isPlayerInventory = inventory.type === InventoryType.PLAYER;
  const visibleItems = inventory.items.slice(0, (page + 1) * PAGE_SIZE);
  const hotbarItems = isPlayerInventory ? visibleItems.slice(0, 5) : [];
  const restItems = isPlayerInventory ? visibleItems.slice(5) : visibleItems;

  // total slot count always matches inventory.items.length (it's padded with empty
  // slots server-side), so the container can size itself off the real slot count
  // instead of a hardcoded row number — this is what lets it shrink when an
  // inventory is configured with fewer slots
  const restSlotCount = isPlayerInventory
    ? Math.max(0, inventory.items.length - 5)
    : inventory.items.length;
  const rows = Math.min(
    MAX_VISIBLE_ROWS,
    Math.max(1, Math.ceil(restSlotCount / GRID_COLS)),
  );

  const percent = inventory.maxWeight
    ? (weight / inventory.maxWeight) * 100
    : 0;
  const weightColor = getLoadColor(percent);

  return (
    <>
      <div
        className="inventory-grid-wrapper"
        style={{ pointerEvents: isBusy ? "none" : "auto" }}
      >
        <div className="inventory-grid-header-wrapper">
          <p className="inventory-grid-label">{inventory.label}</p>
          {inventory.maxWeight && (
            <div className="inventory-grid-weight-info">
              <p style={{ color: weightColor }}>
                {weight / 1000}kg <span>/ {inventory.maxWeight / 1000}kg</span>
              </p>
              <WeightBar percent={percent} />
            </div>
          )}
        </div>

        {isPlayerInventory && hotbarItems.length > 0 && (
          <>
            <div className="inventory-hotbar-row">
              {hotbarItems.map((item) => (
                <InventorySlot
                  key={`${inventory.type}-${inventory.id}-${item.slot}`}
                  item={item}
                  inventoryType={inventory.type}
                  inventoryGroups={inventory.groups}
                  inventoryId={inventory.id}
                />
              ))}
            </div>
          </>
        )}

        <div
          className="inventory-grid-container"
          ref={containerRef}
          style={{ height: getContainerHeight(rows) }}
        >
          <>
            {restItems.map((item, index) => (
              <InventorySlot
                key={`${inventory.type}-${inventory.id}-${item.slot}`}
                item={item}
                ref={index === restItems.length - 1 ? ref : null}
                inventoryType={inventory.type}
                inventoryGroups={inventory.groups}
                inventoryId={inventory.id}
              />
            ))}
          </>
        </div>
      </div>
    </>
  );
};

export default InventoryGrid;
