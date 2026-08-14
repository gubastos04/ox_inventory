import { Inventory, SlotWithItem } from "../../typings";
import React, { Fragment, useMemo } from "react";
import { Items } from "../../store/items";
import { Locale } from "../../store/locale";
import { useAppSelector } from "../../store";
import ClockIcon from "../utils/icons/Clockicon";
import { getItemUrl } from "../../helpers";
import Divider from "../utils/Divider";
import Markdown from "../utils/Markdown";
import { RARITY_COLORS, RARITY_LABELS } from "../../config/rarity";

const SlotTooltip: React.ForwardRefRenderFunction<
  HTMLDivElement,
  {
    item: SlotWithItem;
    inventoryType: Inventory["type"];
    style: React.CSSProperties;
  }
> = ({ item, inventoryType, style }, ref) => {
  const additionalMetadata = useAppSelector(
    (state) => state.inventory.additionalMetadata,
  );
  const itemData = useMemo(() => Items[item.name], [item]);
  const ingredients = useMemo(() => {
    if (!item.ingredients) return null;
    return Object.entries(item.ingredients).sort((a, b) => a[1] - b[1]);
  }, [item]);
  const description = item.metadata?.description || itemData?.description;
  const ammoName = itemData?.ammoName && Items[itemData?.ammoName]?.label;

  return (
    <>
      {!itemData ? (
        <div className="tooltip-wrapper" ref={ref} style={style}>
          <div className="tooltip-header-wrapper">
            <p>{item.name}</p>
          </div>
          <Divider />
        </div>
      ) : (
        <div
          style={{
            ...style,
            borderLeftColor: itemData.rarity
              ? RARITY_COLORS[itemData.rarity]
              : undefined,
          }}
          className="tooltip-wrapper"
          ref={ref}
        >
          <div className="tooltip-header-wrapper">
            <p>{item.metadata?.label || itemData.label || item.name}</p>
            {inventoryType === "crafting" ? (
              <div className="tooltip-crafting-duration">
                <ClockIcon />
                <p>
                  {(item.duration !== undefined ? item.duration : 3000) / 1000}s
                </p>
              </div>
            ) : (
              item.metadata?.type && (
                <p className="tooltip-type-tag">{item.metadata.type}</p>
              )
            )}
          </div>
          {itemData.rarity && (
            <p
              className="tooltip-rarity-tag"
              style={{ color: RARITY_COLORS[itemData.rarity] }}
            >
              {RARITY_LABELS[itemData.rarity]}
            </p>
          )}
          {description && (
            <div className="tooltip-description">
              <Markdown content={description} className="tooltip-markdown" />
            </div>
          )}
          {inventoryType !== "crafting" ? (
            <div className="tooltip-stats">
              {item.weight > 0 && (
                <div className="tooltip-stat-row">
                  <span>{Locale.ui_weight || "Peso"}</span>
                  <b>
                    {item.weight >= 1000
                      ? `${(item.weight / 1000).toLocaleString("en-us", { minimumFractionDigits: 2 })}kg`
                      : `${item.weight.toLocaleString("en-us")}g`}
                  </b>
                </div>
              )}
              {item.durability !== undefined && (
                <div className="tooltip-stat-row">
                  <span>{Locale.ui_durability || "Durabilidade"}</span>
                  <b>{Math.trunc(item.durability)}%</b>
                </div>
              )}
              {item.metadata?.ammo !== undefined && (
                <div className="tooltip-stat-row">
                  <span>{Locale.ui_ammo || "Munição"}</span>
                  <b>{item.metadata.ammo}</b>
                </div>
              )}
              {ammoName && (
                <div className="tooltip-stat-row">
                  <span>{Locale.ammo_type || "Tipo de munição"}</span>
                  <b>{ammoName}</b>
                </div>
              )}
              {item.metadata?.serial && (
                <div className="tooltip-stat-row">
                  <span>{Locale.ui_serial || "Serial"}</span>
                  <b>{item.metadata.serial}</b>
                </div>
              )}
              {item.metadata?.components && item.metadata?.components[0] && (
                <div className="tooltip-stat-row">
                  <span>{Locale.ui_components || "Componentes"}</span>
                  <b>
                    {(item.metadata?.components).map(
                      (component: string, index: number, array: []) =>
                        index + 1 === array.length
                          ? Items[component]?.label
                          : Items[component]?.label + ", ",
                    )}
                  </b>
                </div>
              )}
              {item.metadata?.weapontint && (
                <div className="tooltip-stat-row">
                  <span>{Locale.ui_tint || "Tinta"}</span>
                  <b>{item.metadata.weapontint}</b>
                </div>
              )}
              {additionalMetadata.map(
                (data: { metadata: string; value: string }, index: number) => (
                  <Fragment key={`metadata-${index}`}>
                    {item.metadata && item.metadata[data.metadata] && (
                      <div className="tooltip-stat-row">
                        <span>{data.value}</span>
                        <b>{item.metadata[data.metadata]}</b>
                      </div>
                    )}
                  </Fragment>
                ),
              )}
            </div>
          ) : (
            <div className="tooltip-ingredients">
              {ingredients &&
                ingredients.map((ingredient) => {
                  const [item, count] = [ingredient[0], ingredient[1]];
                  return (
                    <div
                      className="tooltip-ingredient"
                      key={`ingredient-${item}`}
                    >
                      <img
                        src={item ? getItemUrl(item) : "none"}
                        alt="item-image"
                      />
                      <p>
                        {count >= 1
                          ? `${count}x ${Items[item]?.label || item}`
                          : count === 0
                            ? `${Items[item]?.label || item}`
                            : count < 1 &&
                              `${count * 100}% ${Items[item]?.label || item}`}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default React.forwardRef(SlotTooltip);
