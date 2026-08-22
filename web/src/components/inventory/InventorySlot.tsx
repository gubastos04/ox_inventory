import React, { useCallback, useRef } from "react";
import {
  DragSource,
  Inventory,
  InventoryType,
  Slot,
  SlotWithItem,
} from "../../typings";
import { useDrag, useDragDropManager, useDrop } from "react-dnd";
import { useAppDispatch, useAppSelector } from "../../store";
import { onDrop } from "../../dnd/onDrop";
import { onBuy } from "../../dnd/onBuy";
import {
  canCraftItem,
  canPurchaseItem,
  getItemUrl,
  isSlotWithItem,
} from "../../helpers";
import { onUse } from "../../dnd/onUse";
import { Locale } from "../../store/locale";
import { Items } from "../../store/items";
import { RARITY_GLOW } from "../../config/rarity";
import { onCraft } from "../../dnd/onCraft";
import useNuiEvent from "../../hooks/useNuiEvent";
import { ItemsPayload } from "../../reducers/refreshSlots";
import { closeTooltip, openTooltip } from "../../store/tooltip";
import { openContextMenu } from "../../store/contextMenu";
import { openComponentsModal } from "../../store/weaponComponents";
import { useMergeRefs } from "@floating-ui/react";
import {
  buildOccupancyMap,
  canPlace,
  getItemSize,
  isTetrisSlot,
} from "../../helpers/grid";

interface SlotProps {
  inventoryId: Inventory["id"];
  inventoryType: Inventory["type"];
  inventoryGroups: Inventory["groups"];
  item: Slot;

  compact?: boolean;
  gridColumn?: string;
  gridRow?: string;
  itemWidth?: number;
  itemHeight?: number;
}

const CARD_STYLE_TYPES = new Set([
  "player",
  "drop",
  "newdrop",
  "container",
  "stash",
  "trunk",
  "glovebox",
]);

const InventorySlot: React.ForwardRefRenderFunction<
  HTMLDivElement,
  SlotProps
> = (
  {
    item,
    inventoryId,
    inventoryType,
    inventoryGroups,
    compact,
    gridColumn,
    gridRow,
    itemWidth = 1,
    itemHeight = 1,
  },
  ref,
) => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);

  // Only read when we're actually a tetris-enabled slot (see canDrop below)
  // — selecting the whole items array on every render for every slot would
  // be wasteful otherwise.
  const targetInventoryItems = useAppSelector((state) =>
    inventoryType === InventoryType.PLAYER
      ? state.inventory.leftInventory.items
      : state.inventory.rightInventory.items,
  );
  const targetInventorySlots = useAppSelector((state) =>
    inventoryType === InventoryType.PLAYER
      ? state.inventory.leftInventory.slots
      : state.inventory.rightInventory.slots,
  );

  const canDrag = useCallback(() => {
    return (
      canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) &&
      canCraftItem(item, inventoryType)
    );
  }, [item, inventoryType, inventoryGroups]);

  const [{ isDragging }, drag] = useDrag<
    DragSource,
    void,
    { isDragging: boolean }
  >(
    () => ({
      type: "SLOT",
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      item: () =>
        isSlotWithItem(item, inventoryType !== InventoryType.SHOP)
          ? {
              inventory: inventoryType,
              item: {
                name: item.name,
                slot: item.slot,
              },
              image: item?.name && `url(${getItemUrl(item) || "none"}`,
            }
          : null,
      canDrag,
    }),
    [inventoryType, item],
  );

  const [{ isOver, canDrop: dropFits }, drop] = useDrop<
    DragSource,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: "SLOT",
      collect: (monitor) => {
        const source = monitor.getItem();
        let visualFits = monitor.canDrop();

        if (
          source &&
          !visualFits &&
          isTetrisSlot(inventoryType, inventoryId, item.slot)
        ) {
          const [w, h] = getItemSize(source.item.name);
          const sameInventory = source.inventory === inventoryType;
          const occupancy = buildOccupancyMap(
            targetInventoryItems,
            inventoryType,
            inventoryId,
            sameInventory ? source.item.slot : undefined,
          );
          visualFits = canPlace(
            item.slot,
            w,
            h,
            occupancy,
            targetInventorySlots,
          );
        }

        return { isOver: monitor.isOver(), canDrop: visualFits };
      },
      drop: (source) => {
        dispatch(closeTooltip());
        switch (source.inventory) {
          case InventoryType.SHOP:
            onBuy(source, {
              inventory: inventoryType,
              item: { slot: item.slot },
            });
            break;
          case InventoryType.CRAFTING:
            onCraft(source, {
              inventory: inventoryType,
              item: { slot: item.slot },
            });
            break;
          default:
            onDrop(source, {
              inventory: inventoryType,
              item: { slot: item.slot },
            });
            break;
        }
      },
      canDrop: (source) => {
        const basicChecks =
          (source.item.slot !== item.slot ||
            source.inventory !== inventoryType) &&
          inventoryType !== InventoryType.SHOP &&
          inventoryType !== InventoryType.CRAFTING;

        if (!basicChecks) return false;

        if (!isTetrisSlot(inventoryType, inventoryId, item.slot)) return true;

        const sourceItemData = Items[source.item.name];
        if (!sourceItemData) return true;

        const [w, h] = getItemSize(source.item.name);
        const sameInventory = source.inventory === inventoryType;
        const occupancy = buildOccupancyMap(
          targetInventoryItems,
          inventoryType,
          inventoryId,
          sameInventory ? source.item.slot : undefined,
        );

        return canPlace(item.slot, w, h, occupancy, targetInventorySlots);
      },
    }),
    [inventoryType, item],
  );

  useNuiEvent(
    "refreshSlots",
    (data: { items?: ItemsPayload | ItemsPayload[] }) => {
      if (!isDragging && !data.items) return;
      if (!Array.isArray(data.items)) return;

      const itemSlot = data.items.find(
        (dataItem) =>
          dataItem.item.slot === item.slot &&
          dataItem.inventory === inventoryId,
      );

      if (!itemSlot) return;

      manager.dispatch({ type: "dnd-core/END_DRAG" });
    },
  );

  const connectRef = (element: HTMLDivElement | null) => {
    if (!element) return;
    drag(drop(element));
  };

  const handleContext = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (inventoryType !== "player" || !isSlotWithItem(item)) return;

    dispatch(
      openContextMenu({ item, coords: { x: event.clientX, y: event.clientY } }),
    );
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);
    if (
      event.ctrlKey &&
      isSlotWithItem(item) &&
      inventoryType !== "shop" &&
      inventoryType !== "crafting"
    ) {
      onDrop({ item: item, inventory: inventoryType });
    } else if (
      event.altKey &&
      isSlotWithItem(item) &&
      inventoryType === "player"
    ) {
      onUse(item);
    } else if (isSlotWithItem(item) && inventoryType === "player") {
      if (item.metadata?.components !== undefined) {
        // weapons open a persistent card (name, rarity, description, stats,
        // component slots) instead of relying on the hover-only tooltip
        dispatch(openComponentsModal(item));
      } else if (item.metadata?.container !== undefined) {
        // containers already have a real, fully-synced grid the moment they're
        // opened — that IS "real slots", so we just trigger the same native
        // open-container flow as the "Usar" context menu action, rather than
        // building a second, disconnected grid inside a modal
        onUse(item);
      }
    }
  };

  const refs = useMergeRefs([connectRef, ref]);

  const rarity = isSlotWithItem(item) ? Items[item.name]?.rarity : undefined;
  // Small 1x1 items stay icon-only at this cell size (hover for details,
  // same as real Tarkov) — only items actually being rendered as bigger
  // than one cell (see itemWidth/itemHeight above) have room to keep the
  // name/weight footer readable.
  const showCard =
    !compact &&
    CARD_STYLE_TYPES.has(inventoryType) &&
    (itemWidth > 1 || itemHeight > 1);

  const backgroundLayers = [
    `url(${item?.name ? getItemUrl(item as SlotWithItem) : "none"})`,
    rarity
      ? `radial-gradient(circle at 0% 100%, ${RARITY_GLOW[rarity]} 0%, transparent 62%)`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      ref={refs}
      onContextMenu={handleContext}
      onClick={handleClick}
      className={`inventory-slot${rarity ? ` rarity-${rarity}` : ""}${isOver ? ` is-drop-target${dropFits ? " can-fit" : " cannot-fit"}` : ""}${showCard ? " inventory-slot-card" : ""}`}
      style={{
        filter:
          !canPurchaseItem(item, {
            type: inventoryType,
            groups: inventoryGroups,
          }) || !canCraftItem(item, inventoryType)
            ? "brightness(80%) grayscale(100%)"
            : undefined,
        opacity: isDragging ? 0.3 : 1.0,
        backgroundImage: backgroundLayers,
        gridColumn,
        gridRow,
      }}
    >
      {isSlotWithItem(item) && (
        <div
          className="item-slot-wrapper"
          onMouseEnter={() => {
            timerRef.current = window.setTimeout(() => {
              dispatch(openTooltip({ item, inventoryType }));
            }, 500) as unknown as number;
          }}
          onMouseLeave={() => {
            dispatch(closeTooltip());
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }}
        >
          {inventoryType === "player" && item.slot <= 7 && (
            <div className="inventory-slot-number has-item">{item.slot}</div>
          )}

          {inventoryType === "shop" && item?.price !== undefined && (
            <div className="item-slot-header-wrapper">
              {item?.currency !== "money" &&
              item.currency !== "black_money" &&
              item.price > 0 &&
              item.currency ? (
                <div className="item-slot-currency-wrapper">
                  <img
                    src={item.currency ? getItemUrl(item.currency) : "none"}
                    alt="item-image"
                    style={{
                      imageRendering: "-webkit-optimize-contrast",
                      height: "auto",
                      width: "2vh",
                      backfaceVisibility: "hidden",
                      transform: "translateZ(0)",
                    }}
                  />
                  <p>{item.price.toLocaleString("en-us")}</p>
                </div>
              ) : (
                <>
                  {item.price > 0 && (
                    <div
                      className="item-slot-price-wrapper"
                      style={{
                        color:
                          item.currency === "money" || !item.currency
                            ? "var(--color-emerald)"
                            : "var(--color-red)",
                      }}
                    >
                      <p>
                        {Locale.$ || "$"}
                        {item.price.toLocaleString("en-us")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {item.count > 1 && (
            <div className="inventory-slot-count">
              {item.count.toLocaleString("en-us")}
            </div>
          )}

          {showCard && (
            <div className="inventory-slot-card-footer">
              <span className="inventory-slot-card-name">
                {item.metadata?.label || Items[item.name]?.label || item.name}
              </span>
              {item.weight > 0 && (
                <span className="inventory-slot-card-weight">
                  {item.weight >= 1000
                    ? `${(item.weight / 1000).toLocaleString("en-us", { minimumFractionDigits: 1 })}KG`
                    : `${item.weight.toLocaleString("en-us")}G`}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      {!isSlotWithItem(item) &&
        inventoryType === "player" &&
        item.slot <= 7 && (
          <div className="inventory-slot-number">{item.slot}</div>
        )}
    </div>
  );
};

export default React.memo(React.forwardRef(InventorySlot));
