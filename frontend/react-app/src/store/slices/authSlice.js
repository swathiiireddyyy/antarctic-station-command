import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const TOKEN_KEY = 'iari_token';
const USER_KEY  = 'iari_user';

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { token, user };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed. Please try again.');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
  } catch (_) { /* ignore */ }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
});

const savedUser  = (() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } })();
const savedToken = localStorage.getItem(TOKEN_KEY);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            savedUser  || null,
    token:           savedToken || null,
    isAuthenticated: !!(savedUser && savedToken),
    loading:         false,
    error:           null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading = false; state.isAuthenticated = true;
        state.user = payload.user; state.token = payload.token;
      })
      .addCase(loginUser.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null; state.token = null; state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
