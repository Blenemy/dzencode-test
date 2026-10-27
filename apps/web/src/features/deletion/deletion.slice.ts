import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrderSummaryDto, ProductDto } from '@dzen/shared';

export type DeleteTarget =
  | { kind: 'order'; order: Pick<OrderSummaryDto, 'id' | 'title'> }
  | { kind: 'product'; product: ProductDto };

interface DeletionState {
  target: DeleteTarget | null;
  open: boolean;
}

const initialState: DeletionState = { target: null, open: false };

export const deletionSlice = createSlice({
  name: 'deletion',
  initialState,
  reducers: {
    deleteRequested(state, action: PayloadAction<DeleteTarget>) {
      state.target = action.payload;
      state.open = true;
    },
    deleteDismissed(state) {
      state.open = false;
    },
    deleteDialogExited(state) {
      if (!state.open) state.target = null;
    },
  },
  selectors: {
    selectDeleteTarget: (state) => state.target,
    selectDeleteOpen: (state) => state.open,
  },
});

export const { deleteRequested, deleteDismissed, deleteDialogExited } = deletionSlice.actions;
export const { selectDeleteTarget, selectDeleteOpen } = deletionSlice.selectors;
