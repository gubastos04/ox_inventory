import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inventory, InventoryType, Slot } from "../../typings";
import WeightBar, { getLoadColor } from "../utils/WeightBar";
import InventorySlot from "./InventorySlot";
import { getTotalWeight, isSlotWithItem } from "../../helpers";
import { useAppDispatch, useAppSelector } from "../../store";
import { useIntersection } from "../../hooks/useIntersection";
import { fetchNui } from "../../utils/fetchNui";
import { closeTooltip } from "../../store/tooltip";
import { closeContextMenu } from "../../store/contextMenu";
import { closeGiveModal } from "../../store/giveItem";
import { closeSplitModal } from "../../store/splitStack";
import { closeComponentsModal } from "../../store/weaponComponents";
import { Locale } from "../../store/locale";
import UserIcon from "../utils/icons/Usericon";
import ScaleIcon from "../utils/icons/Scaleicon";
import GroundIcon from "../utils/icons/Groundicon";
import BoxIcon from "../utils/icons/Boxicon";
import ArrowIcon from "../utils/icons/Arrowicon";
import {
  GRID_COLS,
  HOTBAR_SIZE,
  buildOccupancyMap,
  getItemSize,
} from "../../helpers/grid";

const PAGE_SIZE = 30;

const PLAYER_GRID_ROWS = 5; // fixed rows below the hotbar, always this tall (scrolls beyond)
const CONTEXT_GRID_ROWS = 6; // fixed rows for drop/container/stash/trunk/glovebox, always this tall (scrolls beyond)
const ROW_HEIGHT_VH = 5.42; // $gridSize (5.2vh) + 0.22vh
const ROW_GAP_PX = 1; // $gridGap

// Fixed-pixel chrome that eats into the viewport alongside the vh-based
// grid rows: .inventory-header (64px) + this panel's own header row +
// divider (~60px) + the .inventory-wrapper's vertical margin (2vh, folded
// into the 98vh below). The player panel also has a hotbar row on top of
// that. These are estimates with a little slack, not pixel-perfect — the
// point of wrapping the result in min() below is that being a bit off just
// means slightly-early scrolling, never actual overflow past the viewport.
const PANEL_CHROME_PX = 64 + 60;
const HOTBAR_ROW_PX_EQUIVALENT = `${ROW_HEIGHT_VH}vh + ${ROW_GAP_PX}px`;

// Height for N rows, but never taller than what's actually left in the
// viewport — this is what stops the card from being pushed off the bottom
// of the screen on shorter/windowed viewports (see conversation history:
// max-height on the wrapper alone doesn't reliably force a flex child to
// shrink across browsers, so we compute the min() directly instead).
const getContainerHeight = (rows: number, isPlayerInventory: boolean) => {
  const ideal = `${rows * ROW_HEIGHT_VH}vh + ${Math.max(0, rows - 1) * ROW_GAP_PX}px`;
  const chrome = isPlayerInventory
    ? `${PANEL_CHROME_PX}px + ${HOTBAR_ROW_PX_EQUIVALENT}`
    : `${PANEL_CHROME_PX}px`;
  return `min(calc(${ideal}), calc(98vh - (${chrome})))`;
};

const isGroundType = (type: string) =>
  type === InventoryType.DROP || type === "newdrop";

const getHeaderIcon = (type: string) => {
  if (type === InventoryType.PLAYER) return <UserIcon />;
  if (isGroundType(type)) return <GroundIcon />;
  return <BoxIcon />;
};

const InventoryGrid: React.FC<{ inventory: Inventory }> = ({ inventory }) => {
  const dispatch = useAppDispatch();
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
  const isContainer = inventory.type === InventoryType.CONTAINER;
  const canGoBack = !!inventory.canGoBack;

  // Closes the container — or, if it was opened on top of something else
  // (the ground, an outer bag, a stash...), steps back to that instead of
  // closing the whole inventory. The server decides which one happens
  // (see the 'backContainer' NUI callback), so we just ask and clean up
  // anything that shouldn't carry over (tooltip, context menu, modals).
  const closeContainer = () => {
    dispatch(closeTooltip());
    dispatch(closeContextMenu());
    dispatch(closeGiveModal());
    dispatch(closeSplitModal());
    dispatch(closeComponentsModal());
    fetchNui("backContainer");
  };

  const isPlayerInventory = inventory.type === InventoryType.PLAYER;
  const displayLabel =
    inventory.label || (isGroundType(inventory.type) ? Locale.ui_ground : "");
  const visibleItems = inventory.items.slice(0, (page + 1) * PAGE_SIZE);
  const hotbarItems = isPlayerInventory
    ? visibleItems.slice(0, HOTBAR_SIZE)
    : [];
  const restItems = isPlayerInventory
    ? visibleItems.slice(HOTBAR_SIZE)
    : visibleItems;

  // Tetris grid start: for the player, cell (0,0) of the "rest" grid sits
  // right below hotbar slot 1 — HOTBAR_SIZE lines up with GRID_COLS exactly
  // so that boundary always falls on a fresh row. For every other type the
  // whole inventory (from slot 1) is the tetris grid.
  const gridStartSlot = isPlayerInventory ? HOTBAR_SIZE + 1 : 1;

  const occupancy = useMemo(
    () => buildOccupancyMap(restItems, inventory.type, inventory.id),
    [restItems, inventory.type, inventory.id],
  );

  // Renders every "rest" slot explicitly positioned on the CSS grid instead
  // of relying on DOM-order auto-flow — items bigger than 1x1 need an exact
  // column/row + span, and the cells they cover have to be skipped entirely
  // rather than rendered as their own (phantom) empty slot underneath them.
  const renderRestItems = () => {
    const nodes: React.ReactNode[] = [];

    restItems.forEach((item, index) => {
      // covered by a neighboring item's footprint, not its own anchor —
      // nothing to render here, that space is already taken visually
      if (!isSlotWithItem(item) && occupancy.has(item.slot)) return;

      const relative = item.slot - gridStartSlot;
      const col = ((relative % GRID_COLS) + GRID_COLS) % GRID_COLS;
      const row = Math.floor(relative / GRID_COLS);
      const [w, h] = isSlotWithItem(item) ? getItemSize(item.name) : [1, 1];

      nodes.push(
        <InventorySlot
          key={`${inventory.type}-${inventory.id}-${item.slot}`}
          item={item}
          ref={index === restItems.length - 1 ? ref : null}
          inventoryType={inventory.type}
          inventoryGroups={inventory.groups}
          inventoryId={inventory.id}
          gridColumn={`${col + 1} / span ${w}`}
          gridRow={`${row + 1} / span ${h}`}
          itemWidth={w}
          itemHeight={h}
        />,
      );
    });

    return nodes;
  };

  // Both panels always render at this fixed row count, full stop — not
  // shrunk for inventories with fewer items, and not grown for ones with
  // more (a 60-slot stash still shows only 6 rows and relies on the grid's
  // own internal scrollbar for the rest, instead of the whole card growing
  // to fit everything, which is what was pushing the panel off the bottom
  // of the screen for bigger inventories).
  const rows = isPlayerInventory ? PLAYER_GRID_ROWS : CONTEXT_GRID_ROWS;

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
          <div className="inventory-grid-title">
            <span className="inventory-grid-icon">
              {getHeaderIcon(inventory.type)}
            </span>
            <p className="inventory-grid-label">{displayLabel}</p>
          </div>
          <div className="inventory-grid-header-actions">
            {inventory.maxWeight && (
              <div className="inventory-grid-weight-info">
                <span className="inventory-grid-icon">
                  <ScaleIcon />
                </span>
                <p style={{ color: weightColor }}>
                  {weight / 1000}kg{" "}
                  <span>/ {inventory.maxWeight / 1000}kg</span>
                </p>
                <WeightBar percent={percent} />
              </div>
            )}
            {isContainer && (
              <button
                type="button"
                className="inventory-grid-close-button"
                onClick={closeContainer}
                aria-label={canGoBack ? Locale.ui_back || "Back" : "Close"}
                title={canGoBack ? Locale.ui_back || "Back" : "Close"}
              >
                {canGoBack ? <ArrowIcon /> : "✕"}
              </button>
            )}
          </div>
        </div>
        <div className="inventory-grid-divider" />
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
          style={{ height: getContainerHeight(rows, isPlayerInventory) }}
        >
          {renderRestItems()}
        </div>
      </div>
    </>
  );
};

export default InventoryGrid;
