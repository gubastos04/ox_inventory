import React, { useEffect, useState } from "react";

export type InventoryTab = "inventory" | "crafting";

const TABS: { id: InventoryTab; label: string }[] = [
  { id: "inventory", label: "Inventário" },
  { id: "crafting", label: "Crafting" },
];

const useClock = () => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 1000 * 15);
    return () => window.clearInterval(interval);
  }, []);

  return time;
};

const InventoryHeader: React.FC<{
  activeTab: InventoryTab;
  onChangeTab: (tab: InventoryTab) => void;
}> = ({ activeTab, onChangeTab }) => {
  const time = useClock();

  return (
    <div className="inventory-header">
      <p className="inventory-header-logo">Search RP</p>
      <nav className="inventory-header-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`inventory-header-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => onChangeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <p className="inventory-header-clock">{time}</p>
    </div>
  );
};

export default InventoryHeader;
