import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState, AppUser } from '../types';

const initialState: UserState = {
  users: [],
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<AppUser[]>) => {
      state.users = action.payload;
    },
    addUser: (state, action: PayloadAction<AppUser>) => {
      state.users.push(action.payload);
      state.error = null;
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter((u) => u.id !== action.payload);
    },
    updateUser: (state, action: PayloadAction<AppUser>) => {
      const index = state.users.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
});

export const { setUsers, addUser, deleteUser, updateUser, setLoading, setError, clearUserError } = userSlice.actions;
export default userSlice.reducer;
