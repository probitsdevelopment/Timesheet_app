import { createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../types';
import { authService, userService } from '@/services/api';

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (
    { emailOrUsername, password }: { emailOrUsername: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('🔐 Logging in via API...', { emailOrUsername });
      
      // Fetch all users from API
      const allUsers = await userService.getAll();
      console.log('👥 All users fetched:', allUsers);
      
      // Find user by email or username
      const user = allUsers.find(
        (u: any) => u.email === emailOrUsername || u.username === emailOrUsername
      );

      if (!user) {
        console.warn('❌ User not found');
        return rejectWithValue('User not found. Please register first.');
      }

      // Check password (in real app, this would be done server-side)
      if (user.password !== password) {
        console.warn('❌ Invalid password');
        return rejectWithValue('Invalid password');
      }

      console.log('✅ Login successful:', user);
      return user;
    } catch (error) {
      console.error('❌ Login error:', error);
      return rejectWithValue('Login failed. Please try again.');
    }
  }
);

export const registerAsync = createAsyncThunk(
  'auth/register',
  async (
    { username, email, password }: { username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('📝 Registering via API...', { username, email });
      
      // Fetch all users to check for duplicates
      const allUsers = await userService.getAll();
      
      const existingUser = allUsers.find(
        (u: any) => u.email === email || u.username === username
      );

      if (existingUser) {
        console.warn('❌ User already exists');
        return rejectWithValue('User with this email or username already exists.');
      }

      // Create new user via API
      const newUser = await userService.create({
        username,
        email,
        password,
        role: 'employee',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Registration successful:', newUser);
      return newUser;
    } catch (error) {
      console.error('❌ Registration error:', error);
      return rejectWithValue('Registration failed. Please try again.');
    }
  }
);
