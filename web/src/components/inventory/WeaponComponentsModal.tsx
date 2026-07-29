import React from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { closeComponentsModal } from "../../store/weaponComponents";
import { Items } from "../../store/items";
import { Locale } from "../../store/locale";
import { fetchNui } from "../../utils/fetchNui";
import { RARITY_COLORS, RARITY_LABELS } from "../../config/rarity";
import { COMPONENT_SLOTS } from "../../config/weaponComponents";
import ComponentIcon from "../utils/icons/ComponentIcon";
import Markdown from "../utils/Markdown";

const WeaponComponentsModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const item = useAppSelector((state) => state.weaponComponents.item);

  if (!item) return null;

  const itemData = Items[item.name];
  const label = item.metadata?.label || itemData?.label || item.name;
  const description = item.metadata?.description || itemData?.description;
  const ammoName = itemData?.ammoName && Items[itemData.ammoName]?.label;
  const rarityColor = itemData?.rarity
    ? RARITY_COLORS[itemData.rarity]
    : undefined;
  const equipped: string[] = item.metadata?.components || [];

  const close = () => dispatch(closeComponentsModal());

  // finds which of the weapon's equipped component items (if any) fills a given slot type
  const getEquippedFor = (type: string) =>
    equipped.find((name) => Items[name]?.type === type);

  const detach = (componentName: string) => {
    fetchNui("removeComponent", { component: componentName, slot: item.slot });
    close();
  };

  return (
    <div
      className="give-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className="give-modal components-modal"
        style={{ borderTopColor: rarityColor }}
      >
        <button className="modal-x" type="button" onClick={close}>
          ×
        </button>

        <p className="give-modal-name">{label}</p>
        {itemData?.rarity && (
          <p className="tooltip-rarity-tag" style={{ color: rarityColor }}>
            {RARITY_LABELS[itemData.rarity]}
          </p>
        )}
        {description && (
          <div className="tooltip-description" style={{ marginTop: 8 }}>
            <Markdown content={description} className="tooltip-markdown" />
          </div>
        )}

        <div className="tooltip-stats">
          {item.durability !== undefined && (
            <div className="tooltip-stat-row">
              <span>{Locale.ui_durability || "Durabilidade"}</span>
              <b>{Math.trunc(item.durability)}%</b>
            </div>
          )}
          {item.metadata?.serial && (
            <div className="tooltip-stat-row">
              <span>{Locale.ui_serial || "Serial"}</span>
              <b>{item.metadata.serial}</b>
            </div>
          )}
          {ammoName && (
            <div className="tooltip-stat-row">
              <span>{Locale.ammo_type || "Tipo de munição"}</span>
              <b>{ammoName}</b>
            </div>
          )}
        </div>

        <label className="give-modal-label" style={{ marginTop: 14 }}>
          {Locale.ui_components || "Componentes"}
        </label>
        <div className="components-grid">
          {COMPONENT_SLOTS.map(({ type, label: slotLabel }) => {
            const equippedName = getEquippedFor(type);
            const filled = Boolean(equippedName);

            return (
              <div className="component-slot-wrap" key={type}>
                <button
                  type="button"
                  className={`component-slot${filled ? " filled" : ""}`}
                  disabled={!filled}
                  onClick={() => equippedName && detach(equippedName)}
                  title={filled ? Items[equippedName!]?.label : undefined}
                >
                  <ComponentIcon type={type} />
                </button>
                <span className="component-slot-label">{slotLabel}</span>
              </div>
            );
          })}
        </div>
        <p className="components-hint">
          {Locale.ui_components_hint ||
            "Clique em um slot preenchido para remover. Para equipar, use o componente com a arma em mãos."}
        </p>

        <div className="tooltip-stats">
          <div className="tooltip-stat-row">
            <span>{Locale.ui_weight || "Peso"}</span>
            <b>
              {item.weight >= 1000
                ? `${(item.weight / 1000).toLocaleString("en-us", { minimumFractionDigits: 2 })}kg`
                : `${item.weight.toLocaleString("en-us")}g`}
            </b>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeaponComponentsModal;
