import InventoryComponent from "./components/inventory";
import useNuiEvent from "./hooks/useNuiEvent";
import { Items } from "./store/items";
import { Locale } from "./store/locale";
import { setImagePath } from "./store/imagepath";
import { setupInventory } from "./store/inventory";
import { Inventory } from "./typings";
import { useAppDispatch } from "./store";
import { debugData } from "./utils/debugData";
import DragPreview from "./components/utils/DragPreview";
import { fetchNui } from "./utils/fetchNui";
import { useDragDropManager } from "react-dnd";
import KeyPress from "./components/utils/KeyPress";

debugData([
  {
    action: "setupInventory",
    data: {
      leftInventory: {
        id: "test",
        type: "player",
        slots: 25,
        label: "Bob Smith",
        weight: 27901,
        maxWeight: 30000,
        items: [
          // slots 1-5 land in the hotbar row — one item per rarity tier,
          // lowest to highest, so the rarity glow is easy to compare at a glance
          { slot: 1, name: "water", weight: 500, count: 3 },
          { slot: 2, name: "bandage", weight: 115, count: 5 },
          { slot: 3, name: "radio", weight: 1000, count: 1 },
          { slot: 4, name: "parachute", weight: 8000, count: 1 },
          { slot: 5, name: "lockpick", weight: 160, count: 1 },

          // 6th rarity tier, first slot below the hotbar divider
          {
            slot: 6,
            name: "armour",
            weight: 3000,
            count: 1,
            metadata: { durability: 45 },
          },

          // 6 weapons — different rarities, different component loadouts,
          // different stat combinations (missing ammo, missing durability, etc.)
          {
            slot: 7,
            name: "weapon_pistol",
            weight: 1100,
            count: 1,
            metadata: {
              durability: 78,
              serial: "PC-04831-X",
              ammo: 12,
              components: ["at_flashlight"],
            },
          },
          {
            slot: 8,
            name: "weapon_smg",
            weight: 2200,
            count: 1,
            metadata: {
              durability: 45,
              serial: "SM-11029-Q",
              ammo: 30,
              components: ["at_flashlight", "at_grip"],
            },
          },
          {
            slot: 9,
            name: "weapon_assaultrifle",
            weight: 3600,
            count: 1,
            metadata: {
              durability: 92,
              serial: "AR-77213-K",
              ammo: 30,
              components: [
                "at_flashlight",
                "at_muzzle",
                "at_grip",
                "at_magazine",
              ],
            },
          },
          {
            slot: 10,
            name: "weapon_sniperrifle",
            weight: 4500,
            count: 1,
            // low durability on purpose — exercises the red/critical state
            metadata: {
              durability: 15,
              serial: "SR-90044-Z",
              ammo: 5,
              components: ["at_sight", "at_barrel"],
            },
          },
          {
            slot: 11,
            name: "weapon_pumpshotgun",
            weight: 3100,
            count: 1,
            // no ammo field and no components equipped — tests the empty-grid state
            metadata: { durability: 60, serial: "PS-33871-B", components: [] },
          },
          {
            slot: 12,
            name: "weapon_knife",
            weight: 400,
            count: 1,
            // no durability/serial/ammo at all — melee weapon, minimal card
            metadata: { components: [] },
          },

          // container
          {
            slot: 13,
            name: "paperbag",
            weight: 1,
            count: 1,
            metadata: { container: "debug-bag-01" },
          },

          // plain items with no special fields, for the "demais itens" baseline
          { slot: 14, name: "burger", weight: 220, count: 2 },
          { slot: 15, name: "card_id", weight: 5, count: 1 },
        ],
      },
      rightInventory: {
        id: "stash-test",
        type: "stash",
        slots: 25,
        label: "Baú de Testes",
        weight: 5476,
        maxWeight: 20000,
        items: [
          {
            slot: 1,
            name: "armour",
            weight: 3000,
            count: 1,
            metadata: { durability: 45 },
          },
          { slot: 2, name: "bandage", weight: 115, count: 3 },
          {
            slot: 3,
            name: "weapon_smg",
            weight: 2200,
            count: 1,
            metadata: {
              durability: 45,
              serial: "SM-11029-Q",
              ammo: 30,
              components: ["at_flashlight", "at_grip"],
            },
          },
          {
            slot: 4,
            name: "paperbag",
            weight: 1,
            count: 1,
            metadata: { container: "debug-bag-02" },
          },
          { slot: 5, name: "lockpick", weight: 160, count: 1 },
        ],
      },
    },
  },
]);

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const manager = useDragDropManager();

  useNuiEvent<{
    locale: { [key: string]: string };
    items: typeof Items;
    leftInventory: Inventory;
    imagepath: string;
  }>("init", ({ locale, items, leftInventory, imagepath }) => {
    for (const name in locale) Locale[name] = locale[name];
    for (const name in items) Items[name] = items[name];

    setImagePath(imagepath);
    dispatch(setupInventory({ leftInventory }));
  });

  fetchNui("uiLoaded", {});

  useNuiEvent("closeInventory", () => {
    manager.dispatch({ type: "dnd-core/END_DRAG" });
  });

  return (
    <div className="app-wrapper">
      <InventoryComponent />
      <DragPreview />
      <KeyPress />
    </div>
  );
};

addEventListener("dragstart", function (event) {
  event.preventDefault();
});

export default App;
