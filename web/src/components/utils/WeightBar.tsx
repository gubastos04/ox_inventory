import React, { useMemo } from "react";

// carga do inventário / peso: verde até 60%, amarelo até 85%, vermelho acima disso
const LOAD_COLORS = {
  low: "var(--color-emerald)",
  mid: "var(--color-amber)",
  high: "var(--color-red)",
};

// durabilidade do item: a lógica é invertida (percentual baixo = item gasto = vermelho)
const DURABILITY_COLORS = {
  high: "var(--color-emerald)", // > 60% de vida — saudável
  mid: "var(--color-amber)", // 25–60% — alerta
  low: "var(--color-red)", // < 25% — crítico
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

const isCritical = (percent: number, durability?: boolean) =>
  durability ? percent <= 25 : percent >= 85;

const WeightBar: React.FC<{ percent: number; durability?: boolean }> = ({
  percent,
  durability,
}) => {
  const color = useMemo(
    () => (durability ? getDurabilityColor(percent) : getLoadColor(percent)),
    [durability, percent],
  );
  const critical = isCritical(percent, durability);

  return (
    <div className={durability ? "durability-bar" : "weight-bar"}>
      <div
        className={`weight-bar-fill${critical ? " is-critical" : ""}`}
        style={
          {
            visibility: percent > 0 ? "visible" : "hidden",
            width: `${percent}%`,
            "--bar-color": color,
          } as React.CSSProperties
        }
      ></div>
    </div>
  );
};
export default WeightBar;