import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDrop } from "react-dnd";
import { Inventory, InventoryType, Slot, DragSource } from "../../typings";
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
import { Items } from "../../store/items";
import UserIcon from "../utils/icons/Usericon";
import ScaleIcon from "../utils/icons/Scaleicon";
import GroundIcon from "../utils/icons/Groundicon";
import BoxIcon from "../utils/icons/Boxicon";
import ArrowIcon from "../utils/icons/Arrowicon";
import { onDrop as dispatchDrop } from "../../dnd/onDrop";
import { onBuy } from "../../dnd/onBuy";
import { onCraft } from "../../dnd/onCraft";
import {
  GRID_COLS,
  HOTBAR_SIZE,
  buildOccupancyMap,
  canPlace,
  getItemSize,
  isTetrisType,
} from "../../helpers/grid";

const PAGE_SIZE = 30;

const PLAYER_GRID_ROWS = 9;
const CONTEXT_GRID_ROWS = 10; 
const ROW_HEIGHT_VH = 8.42; 
const ROW_GAP_PX = 1;

const PANEL_CHROME_PX = 64 + 60;
const HOTBAR_ROW_PX_EQUIVALENT = `${ROW_HEIGHT_VH}vh + ${ROW_GAP_PX}px`;

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
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  // Container-level drop zone for the tetris grid — computed from the
  // pointer's pixel position instead of "which numbered cell's own DOM
  // element did you drop onto". This is what makes it possible to drop an
  // item back onto a position that's currently covered by that SAME
  // item's own footprint (e.g. nudging a 2x2 backpack over by one cell):
  // covered cells aren't separate DOM elements at all (see renderRestItems
  // below), so there'd be nothing to drop onto there with the old
  // per-cell approach.
  const [preview, setPreview] = useState<{
    col: number;
    row: number;
    w: number;
    h: number;
    fits: boolean;
    anchorSlot: number;
  } | null>(null);

  const computeDropPosition = (
    source: DragSource,
    monitor: { getClientOffset: () => { x: number; y: number } | null },
  ) => {
    const el = containerRef.current;
    const offset = monitor.getClientOffset();
    if (!el || !offset) return null;

    const rect = el.getBoundingClientRect();
    const [w, h] = getItemSize(source.item.name);
    const cellPx = rect.width / GRID_COLS;

    let col = Math.floor((offset.x - rect.left) / cellPx);
    let row = Math.floor((offset.y - rect.top) / cellPx);
    col = Math.max(0, Math.min(GRID_COLS - w, col));
    row = Math.max(0, row);

    const anchorSlot = gridStartSlot + row * GRID_COLS + col;
    const sameInventory = source.inventory === inventory.type;
    const dropOccupancy = buildOccupancyMap(
      inventory.items,
      inventory.type,
      inventory.id,
      sameInventory ? source.item.slot : undefined,
    );
    const fits = canPlace(anchorSlot, w, h, dropOccupancy, inventory.slots);

    return { col, row, w, h, fits, anchorSlot };
  };

  const [{ isOverContainer }, gridDrop] = useDrop<
    DragSource,
    void,
    { isOverContainer: boolean }
  >(
    () => ({
      accept: "SLOT",
      collect: (monitor) => ({ isOverContainer: monitor.isOver() }),
      hover: (source, monitor) => {
        if (!isTetrisType(inventory.type, inventory.id)) return;
        const pos = computeDropPosition(source, monitor);
        setPreview(pos);
      },
      drop: (source, monitor) => {
        // A per-cell slot inside this same container (e.g. dropping onto
        // an existing item's anchor to stack/swap) already handled this —
        // don't also process it here, or the move would fire twice.
        if (monitor.didDrop()) return;

        const pos = preview;
        setPreview(null);
        if (!pos || !pos.fits) return;

        dispatch(closeTooltip());
        const target = {
          inventory: inventory.type,
          item: { slot: pos.anchorSlot },
        };

        switch (source.inventory) {
          case InventoryType.SHOP:
            onBuy(source, target);
            break;
          case InventoryType.CRAFTING:
            onCraft(source, target);
            break;
          default:
            dispatchDrop(source, target);
            break;
        }
      },
      canDrop: () => isTetrisType(inventory.type, inventory.id),
    }),
    [inventory.type, inventory.id, inventory.items, inventory.slots, preview],
  );

  // Clears the preview once the drag leaves the container (react-dnd has
  // no dedicated "leave" callback on useDrop — isOver flipping back to
  // false covers it) so a stale ghost box doesn't linger after a
  // cancelled or dropped-elsewhere drag.
  useEffect(() => {
    if (!isOverContainer) setPreview(null);
  }, [isOverContainer]);

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
          ref={(node) => {
            containerRef.current = node;
            gridDrop(node);
          }}
          style={{ height: getContainerHeight(rows, isPlayerInventory) }}
        >
          {renderRestItems()}
          {preview && (
            <div
              className={`tetris-drop-preview${preview.fits ? " fits" : " blocked"}`}
              style={{
                gridColumn: `${preview.col + 1} / span ${preview.w}`,
                gridRow: `${preview.row + 1} / span ${preview.h}`,
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryGrid;
