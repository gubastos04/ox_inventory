import React, { useMemo } from "react";

// carga do inventário / peso: verde até 60%, amarelo até 85%, vermelho acima disso
const LOAD_COLORS = {
  low: "#4ade80",
  mid: "#eab308",
  high: "#ef4444",
};

// durabilidade do item: a lógica é invertida (percentual baixo = item gasto = vermelho)
const DURABILITY_COLORS = {
  high: "#4ade80", // > 60% de vida — saudável
  mid: "#eab308", // 25–60% — alerta
  low: "#ef4444", // < 25% — crítico
};

export const getLoadColor = (percent: number) => {
  if (percent >= 85) return LOAD_COLORS.high;
  if (percent >= 60) return LOAD_COLORS.mid;
  return LOAD_COLORS.low;
};

const getDurabilityColor = (percent: number) => {
  if (percent <= 25) return DURABILITY_COLORS.low;
  if (percent <= 60) return DURABILITY_COLORS.mid;
  return DURABILITY_COLORS.high;
};

const WeightBar: React.FC<{ percent: number; durability?: boolean }> = ({
  percent,
  durability,
}) => {
  const color = useMemo(
    () => (durability ? getDurabilityColor(percent) : getLoadColor(percent)),
    [durability, percent],
  );

  return (
    <div className={durability ? "durability-bar" : "weight-bar"}>
      <div
        style={{
          visibility: percent > 0 ? "visible" : "hidden",
          height: "100%",
          width: `${percent}%`,
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}59`,
          transition: `background-color ${0.2}s ease, width ${0.3}s ease`,
        }}
      ></div>
    </div>
  );
};
export default WeightBar;
