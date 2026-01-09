import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../types';
import { loginAsync, registerAsync } from '../actions/authActions';

const initialState: AuthState = {
  currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),  // Load user from localStorage
  token: localStorage.getItem('authToken') || null,  // Load token from localStorage
  isAuthenticated: !!localStorage.getItem('authToken'),  // Check if token exists
  isLoading: false,
  error: null,
  registeredUsers: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    },
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.currentUser = action.payload;
        state.token = localStorage.getItem('authToken');  // Get token from localStorage
        state.isAuthenticated = true;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'Login failed';
        state.isAuthenticated = false;
      })
      // REGISTER
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.registeredUsers.push(action.payload);
        // Do not auto-login after registration
        state.currentUser = null;
        state.isAuthenticated = false;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || action.error.message || 'Registration failed';
      });
  },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer;
