import React, { useMemo, useState } from "react";
import { Inventory, Slot, WorkbenchRecipe } from "../../typings";
import InventorySlot from "./InventorySlot";
import WeightBar, { getLoadColor } from "../utils/WeightBar";
import { getTotalWeight, getItemUrl } from "../../helpers";
import { fetchNui } from "../../utils/fetchNui";
import { Locale } from "../../store/locale";
import BoxIcon from "../utils/icons/Boxicon";
import ScaleIcon from "../utils/icons/Scaleicon";
import ArrowIcon from "../utils/icons/Arrowicon";

const GRID_SLOTS = 9;

// Formats a recipe's result count for display — it's either a flat number
// or a {min, max} range rolled server-side at craft time, so the UI just
// shows the range as-is rather than pretending to know the exact roll.
const formatCount = (count: number | [number, number]) =>
  Array.isArray(count) ? `${count[0]}-${count[1]}` : `${count}`;

const WorkbenchGrid: React.FC<{ inventory: Inventory }> = ({ inventory }) => {
  const recipes = inventory.recipes || [];
  const [isCrafting, setIsCrafting] = useState(false);

  const weight = useMemo(
    () => getTotalWeight(inventory.items),
    [inventory.items],
  );
  const percent = inventory.maxWeight
    ? (weight / inventory.maxWeight) * 100
    : 0;
  const weightColor = getLoadColor(percent);

  // The 9 grid slots are always the first 9 items of this stash (it's
  // registered with exactly 9 slots — see modules/workbench/server.lua),
  // padded with empty slot placeholders server-side same as any inventory.
  const gridSlots: Slot[] = useMemo(() => {
    const slots: Slot[] = [];
    for (let i = 0; i < GRID_SLOTS; i++) {
      slots.push(inventory.items[i] || { slot: i + 1 });
    }
    return slots;
  }, [inventory.items]);

  const matchedRecipe: WorkbenchRecipe | undefined = useMemo(() => {
    return recipes.find((recipe) =>
      recipe.grid.every(
        (name, i) => (name || false) === (gridSlots[i]?.name || false),
      ),
    );
  }, [recipes, gridSlots]);

  const craft = async () => {
    if (!matchedRecipe || isCrafting) return;
    setIsCrafting(true);
    try {
      await fetchNui<{ success: boolean }>(
        "craftWorkbench",
        matchedRecipe.name,
      );
    } finally {
      setIsCrafting(false);
    }
  };

  return (
    <div className="inventory-grid-wrapper workbench-wrapper">
      <div className="inventory-grid-header-wrapper">
        <div className="inventory-grid-title">
          <span className="inventory-grid-icon">
            <BoxIcon />
          </span>
          <p className="inventory-grid-label">{inventory.label}</p>
        </div>
        {inventory.maxWeight && (
          <div className="inventory-grid-weight-info">
            <span className="inventory-grid-icon">
              <ScaleIcon />
            </span>
            <p style={{ color: weightColor }}>
              {weight / 1000}kg <span>/ {inventory.maxWeight / 1000}kg</span>
            </p>
            <WeightBar percent={percent} />
          </div>
        )}
      </div>
      <div className="inventory-grid-divider" />

      <div className="workbench-body">
        <div className="workbench-grid-column">
          <div className="workbench-grid-and-output">
            <div className="workbench-grid">
              {gridSlots.map((item) => (
                <InventorySlot
                  key={`workbench-${inventory.id}-${item.slot}`}
                  item={item}
                  inventoryId={inventory.id}
                  inventoryType={inventory.type}
                  inventoryGroups={inventory.groups}
                  compact
                />
              ))}
            </div>

            <span className="workbench-output-arrow">
              <ArrowIcon />
            </span>

            <div className="workbench-output-column">
              <button
                type="button"
                className={`workbench-output-slot${matchedRecipe ? " has-match" : ""}`}
                onClick={craft}
                disabled={!matchedRecipe || isCrafting}
                title={matchedRecipe?.label}
              >
                {matchedRecipe ? (
                  <>
                    <img src={getItemUrl(matchedRecipe.result.name)} alt="" />
                    <span className="workbench-output-count">
                      {formatCount(matchedRecipe.result.count)}
                    </span>
                  </>
                ) : (
                  <span className="workbench-output-placeholder">?</span>
                )}
              </button>
              <p className="workbench-section-label">
                {Locale.ui_result || "Resultado"}
              </p>
            </div>
          </div>
        </div>

        <div className="workbench-vertical-divider" />

        <div className="workbench-recipes-panel">
          <p className="workbench-section-label">
            {Locale.ui_known_recipes || "Receitas Conhecidas"}
          </p>
          <div className="workbench-recipes-list">
            {recipes.length === 0 && (
              <p className="workbench-recipes-empty">
                {Locale.ui_no_recipes ||
                  "Use um blueprint para desbloquear receitas."}
              </p>
            )}
            {recipes.map((recipe) => (
              <div
                key={recipe.name}
                className={`workbench-recipe-entry${
                  matchedRecipe?.name === recipe.name ? " active" : ""
                }`}
                title={recipe.label}
              >
                <img src={getItemUrl(recipe.result.name)} alt="" />
                <span>{recipe.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkbenchGrid;
