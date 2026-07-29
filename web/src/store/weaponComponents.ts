import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SlotWithItem } from "../typings";

interface WeaponComponentsState {
  item: SlotWithItem | null;
}

const initialState: WeaponComponentsState = {
  item: null,
};

export const weaponComponentsSlice = createSlice({
  name: "weaponComponents",
  initialState,
  reducers: {
    openComponentsModal(state, action: PayloadAction<SlotWithItem>) {
      state.item = action.payload;
    },
    closeComponentsModal(state) {
      state.item = null;
    },
  },
});

export const { openComponentsModal, closeComponentsModal } =
  weaponComponentsSlice.actions;

export default weaponComponentsSlice.reducer;
