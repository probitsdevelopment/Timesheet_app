import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimesheetState, TimeEntry } from '../types';

const initialState: TimesheetState = {
  entries: [],
  showAddEntryModal: false,
  isLoading: false,
  error: null,
};

const timesheetSlice = createSlice({
  name: 'timesheet',
  initialState,
  reducers: {
    toggleAddEntryModal: (state, action: PayloadAction<boolean>) => {
      state.showAddEntryModal = action.payload;
    },
    setEntries: (state, action: PayloadAction<TimeEntry[]>) => {
      state.entries = action.payload;
    },
    addEntry: (state, action: PayloadAction<TimeEntry>) => {
      state.entries.push(action.payload);
      state.error = null;
    },
    deleteEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter((entry) => entry.id !== action.payload);
    },
    updateEntry: (state, action: PayloadAction<TimeEntry>) => {
      const index = state.entries.findIndex((entry) => entry.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = action.payload;
      }
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  toggleAddEntryModal,
  setEntries,
  addEntry,
  deleteEntry,
  updateEntry,
  setLoading,
  setError,
} = timesheetSlice.actions;

export default timesheetSlice.reducer;
