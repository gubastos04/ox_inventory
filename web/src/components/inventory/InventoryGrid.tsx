import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inventory, InventoryType } from "../../typings";
import WeightBar, { getLoadColor } from "../utils/WeightBar";
import InventorySlot from "./InventorySlot";
import { getTotalWeight } from "../../helpers";
import { useAppDispatch, useAppSelector } from "../../store";
import { useIntersection } from "../../hooks/useIntersection";
import { fetchNui } from "../../utils/fetchNui";
import { closeTooltip } from "../../store/tooltip";
import { closeContextMenu } from "../../store/contextMenu";
import { closeGiveModal } from "../../store/giveItem";
import { closeSplitModal } from "../../store/splitStack";
import { closeComponentsModal } from "../../store/weaponComponents";
import { Locale } from "../../store/locale";
import UserIcon from "../utils/icons/UserIcon";
import ScaleIcon from "../utils/icons/ScaleIcon";
import GroundIcon from "../utils/icons/GroundIcon";
import BoxIcon from "../utils/icons/BoxIcon";
import ArrowIcon from "../utils/icons/ArrowIcon";

const PAGE_SIZE = 30;

const GRID_COLS = 7;
const HOTBAR_SIZE = 7; // matches GRID_COLS so the hotbar row is always full-width
const PLAYER_GRID_ROWS = 5; // fixed rows below the hotbar, always this tall (scrolls beyond)
const CONTEXT_GRID_ROWS = 6; // fixed rows for drop/container/stash/trunk/glovebox, always this tall (scrolls beyond)
const ROW_HEIGHT_VH = 13.22; // $gridSize (13vh) + 0.22vh
const ROW_GAP_PX = 1; // $gridGap

const getContainerHeight = (rows: number) =>
  `calc(${rows * ROW_HEIGHT_VH}vh + ${Math.max(0, rows - 1) * ROW_GAP_PX}px)`;

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

  // total slot count always matches inventory.items.length (it's padded with empty
  // slots server-side)
  const restSlotCount = isPlayerInventory
    ? Math.max(0, inventory.items.length - HOTBAR_SIZE)
    : inventory.items.length;
  // Both panels always render at this fixed row count (padded with empty
  // cells when the inventory has fewer items), not shrunk to fit content —
  // only growing (with scroll) if there are genuinely more items than fit.
  const minGridRows = isPlayerInventory ? PLAYER_GRID_ROWS : CONTEXT_GRID_ROWS;
  const rows = Math.max(minGridRows, Math.ceil(restSlotCount / GRID_COLS));

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
