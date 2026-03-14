import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimesheetState, TimeEntry, Timesheet } from '../types';

const initialState: TimesheetState = {
  entries: [],
  timesheets: [],
  tempFormEntries: [], // Empty on app load
  showAddEntryModal: false,
  isLoading: false,
  error: null,
  selectedMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
  selectedDate: null, // Selected date for modal
};

const timesheetSlice = createSlice({
  name: 'timesheet',
  initialState,
  reducers: {
    toggleAddEntryModal: (state, action: PayloadAction<boolean>) => {
      state.showAddEntryModal = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
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
    setTimesheets: (state, action: PayloadAction<Timesheet[]>) => {
      state.timesheets = action.payload;
    },
    addTimesheet: (state, action: PayloadAction<Timesheet>) => {
      state.timesheets.push(action.payload);
    },
    updateTimesheet: (state, action: PayloadAction<Timesheet>) => {
      const index = state.timesheets.findIndex((ts) => String(ts.id) === String(action.payload.id));
      if (index !== -1) {
        state.timesheets[index] = action.payload;
      }
    },
    submitTimesheet: (state, action: PayloadAction<Timesheet>) => {
      const index = state.timesheets.findIndex((ts) => String(ts.id) === String(action.payload.id));
      if (index !== -1) {
        state.timesheets[index] = {
          ...state.timesheets[index],
          ...action.payload,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        };
      } else {
        // New timesheet — add it to the array
        state.timesheets.push({ ...action.payload, status: 'submitted' });
      }
    },
    approveTimesheet: (state, action: PayloadAction<{ id: string; approvedBy: string }>) => {
      const index = state.timesheets.findIndex((ts) => String(ts.id) === String(action.payload.id));
      if (index !== -1) {
        state.timesheets[index].status = 'approved';
        state.timesheets[index].approved_by = action.payload.approvedBy;
      }
    },
    rejectTimesheet: (state, action: PayloadAction<{ id: string; reason: string }>) => {
      const index = state.timesheets.findIndex((ts) => String(ts.id) === String(action.payload.id));
      if (index !== -1) {
        state.timesheets[index].status = 'rejected';
        state.timesheets[index].rejection_reason = action.payload.reason;
      }
    },
    setSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addTempFormEntry: (state, action: PayloadAction<any>) => {
      state.tempFormEntries.push(action.payload);
    },
    removeTempFormEntry: (state, action: PayloadAction<number>) => {
      state.tempFormEntries.splice(action.payload, 1);
    },
    clearTempFormEntries: (state) => {
      state.tempFormEntries = [];
    },
    clearAllTimesheetData: (state) => {
      state.entries = [];
      state.timesheets = [];
      state.tempFormEntries = [];
      state.selectedDate = null;
      state.error = null;
    },
  },
});

export const {
  toggleAddEntryModal,
  setEntries,
  addEntry,
  deleteEntry,
  updateEntry,
  setTimesheets,
  addTimesheet,
  updateTimesheet,
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
  setSelectedMonth,
  setSelectedDate,
  setLoading,
  setError,
  addTempFormEntry,
  removeTempFormEntry,
  clearTempFormEntries,
  clearAllTimesheetData,
} = timesheetSlice.actions;

export default timesheetSlice.reducer;
