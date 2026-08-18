import React, { useEffect, useState } from "react";

const useClock = () => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
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

const InventoryHeader: React.FC = () => {
  const time = useClock();

  return (
    <div className="inventory-header">
      <p className="inventory-header-logo">Search RP</p>
      <p className="inventory-header-clock">{time}</p>
    </div>
  );
};

export default InventoryHeader;
