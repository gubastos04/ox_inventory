import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { closeSplitModal } from "../../store/splitStack";
import { Items } from "../../store/items";
import { Locale } from "../../store/locale";
import { getItemUrl } from "../../helpers";
import { onSplit } from "../../dnd/onSplit";
import { RARITY_COLORS } from "../../config/rarity";

const SplitStackModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const item = useAppSelector((state) => state.splitStack.item);
  const [amount, setAmount] = useState(1);

  useEffect(() => {
    if (item) setAmount(Math.max(1, Math.floor(item.count / 2)));
  }, [item]);

  if (!item) return null;

  // can only split off up to count - 1 — splitting the full stack isn't a split
  const max = Math.max(1, item.count - 1);
  const itemData = Items[item.name];
  const label = item.metadata?.label || itemData?.label || item.name;
  const rarityColor = itemData?.rarity
    ? RARITY_COLORS[itemData.rarity]
    : undefined;

  const close = () => dispatch(closeSplitModal());

  const clamp = (value: number) => Math.min(max, Math.max(1, value || 1));

  const confirm = () => {
    onSplit(item, clamp(amount));
    close();
  };

  return (
    <div
      className="give-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="give-modal" style={{ borderTopColor: rarityColor }}>
        <div className="give-modal-item">
          <div
            className="give-modal-icon"
            style={{ backgroundImage: `url(${getItemUrl(item) || "none"})` }}
          ></div>
          <div>
            <p className="give-modal-name">{label}</p>
            <p className="give-modal-available">
              {Locale.ui_available || "Disponível"}: {item.count}
            </p>
          </div>
        </div>

        <label className="give-modal-label">
          {Locale.ui_split_amount || "Quantidade a separar"}
        </label>
        <div className="give-modal-input-row">
          <button
            type="button"
            onClick={() => setAmount((prev) => clamp(prev - 1))}
          >
            –
          </button>
          <input
            type="number"
            min={1}
            max={max}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            onBlur={() => setAmount((prev) => clamp(prev))}
          />
          <button
            type="button"
            onClick={() => setAmount((prev) => clamp(prev + 1))}
          >
            +
          </button>
        </div>

        <div className="give-modal-actions">
          <button className="give-modal-cancel" type="button" onClick={close}>
            {Locale.ui_close || "Cancelar"}
          </button>
          <button
            className="give-modal-confirm"
            type="button"
            onClick={confirm}
          >
            {Locale.ui_split || "Dividir"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitStackModal;
