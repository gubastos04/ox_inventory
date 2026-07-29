import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from '../../typings';
import WeightBar, { getLoadColor } from '../utils/WeightBar';
import InventorySlot from './InventorySlot';
import { getTotalWeight } from '../../helpers';
import { useAppSelector } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';

const PAGE_SIZE = 30;

// keep these in sync with $gridCols / $gridRows / $gridSize / $gridGap in index.scss —
// they're used to size the scrollable grid to however many rows the inventory
// actually needs (instead of always reserving a fixed 5-row block)
const GRID_COLS = 5;
const MAX_VISIBLE_ROWS = 5;
const ROW_HEIGHT_VH = 10.42; // $gridSize (10.2vh) + 0.22vh
const ROW_GAP_PX = 2; // $gridGap

const getContainerHeight = (rows: number) => `calc(${rows * ROW_HEIGHT_VH}vh + ${rows * ROW_GAP_PX}px)`;

const InventoryGrid: React.FC<{ inventory: Inventory; totalWeight?: number }> = ({ inventory, totalWeight }) => {
  const weight = useMemo(() => {
    if (inventory.maxWeight === undefined) return 0;
    const raw = totalWeight !== undefined ? totalWeight : getTotalWeight(inventory.items);
    return Math.floor(raw * 1000) / 1000;
  }, [inventory.maxWeight, inventory.items, totalWeight]);
  const [page, setPage] = useState(0);
  const containerRef = useRef(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);

  const visibleItems = inventory.items.slice(0, (page + 1) * PAGE_SIZE);

  // container sizes itself off the real slot count (padded server-side to
  // always match inventory.items.length) instead of a hardcoded row number —
  // this is what lets it shrink when an inventory has fewer slots
  const rows = Math.min(MAX_VISIBLE_ROWS, Math.max(1, Math.ceil(inventory.items.length / GRID_COLS)));

  const percent = inventory.maxWeight ? (weight / inventory.maxWeight) * 100 : 0;
  const weightColor = getLoadColor(percent);

  return (
    <>
      <div className="inventory-grid-wrapper" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
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

        <div className="inventory-grid-container" ref={containerRef} style={{ height: getContainerHeight(rows) }}>
          <>
            {visibleItems.map((item, index) => (
              <InventorySlot
                key={`${inventory.type}-${inventory.id}-${item.slot}`}
                item={item}
                ref={index === visibleItems.length - 1 ? ref : null}
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