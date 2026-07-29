import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SlotWithItem } from '../typings';

interface GiveItemState {
  item: SlotWithItem | null;
}

const initialState: GiveItemState = {
  item: null,
};

export const giveItemSlice = createSlice({
  name: 'giveItem',
  initialState,
  reducers: {
    openGiveModal(state, action: PayloadAction<SlotWithItem>) {
      state.item = action.payload;
    },
    closeGiveModal(state) {
      state.item = null;
    },
  },
});

export const { openGiveModal, closeGiveModal } = giveItemSlice.actions;

export default giveItemSlice.reducer;