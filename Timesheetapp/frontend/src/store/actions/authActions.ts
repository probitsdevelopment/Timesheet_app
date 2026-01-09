import { createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../types';
import { authService } from '@/services/api';

// LOGIN - Uses backend /login endpoint with bcrypt verification and JWT generation
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('🔐 Logging in via API...', { email });
      
      // Call backend /login endpoint
      // Backend verifies password with bcrypt and returns JWT token
      const response = await authService.login(email, password);
      
      console.log('✅ Login successful:', response.user);
      
      // Store JWT token in localStorage
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      
      return response.user;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const message = error.message || 'Login failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// REGISTER - Uses backend /register endpoint with bcrypt hashing
export const registerAsync = createAsyncThunk(
  'auth/register',
  async (
    { name, email, password, organization }: { name: string; email: string; password: string; organization?: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('📝 Registering via API...', { name, email, organization });      console.log('🔐 Password value:', password, 'Length:', password?.length);      
      // Call backend /register endpoint
      // Backend hashes password with bcrypt and stores in database
      const response = await authService.register(name, email, password, organization);

      console.log('✅ Registration successful:', response.user);
      return response.user;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const message = error.message || 'Registration failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);
