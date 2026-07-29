import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SlotWithItem } from "../typings";

interface SplitStackState {
  item: SlotWithItem | null;
}

const initialState: SplitStackState = {
  item: null,
};

export const splitStackSlice = createSlice({
  name: "splitStack",
  initialState,
  reducers: {
    openSplitModal(state, action: PayloadAction<SlotWithItem>) {
      state.item = action.payload;
    },
    closeSplitModal(state) {
      state.item = null;
    },
  },
});

export const { openSplitModal, closeSplitModal } = splitStackSlice.actions;

export default splitStackSlice.reducer;
