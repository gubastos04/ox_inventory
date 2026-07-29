import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { closeGiveModal } from "../../store/giveItem";
import { Items } from "../../store/items";
import { Locale } from "../../store/locale";
import { getItemUrl } from "../../helpers";
import { fetchNui } from "../../utils/fetchNui";
import { RARITY_COLORS } from "../../config/rarity";

const GiveItemModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const item = useAppSelector((state) => state.giveItem.item);
  const [amount, setAmount] = useState(1);

  useEffect(() => {
    if (item) setAmount(item.count > 0 ? item.count : 1);
  }, [item]);

  if (!item) return null;

  const max = item.count || 1;
  const itemData = Items[item.name];
  const label = item.metadata?.label || itemData?.label || item.name;
  const rarityColor = itemData?.rarity
    ? RARITY_COLORS[itemData.rarity]
    : undefined;

  const close = () => dispatch(closeGiveModal());

  const clamp = (value: number) => Math.min(max, Math.max(1, value || 1));

  const confirm = () => {
    fetchNui("giveItem", { slot: item.slot, count: clamp(amount) });
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
              {Locale.ui_available || "Disponível"}: {max}
            </p>
          </div>
        </div>

        <label className="give-modal-label">
          {Locale.ui_give_amount || "Quantidade a dar"}
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
            {Locale.ui_give || "Dar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiveItemModal;
