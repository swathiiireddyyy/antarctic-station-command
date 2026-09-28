import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';
import { mockAlerts } from '../../utils/mockData.js';

export const fetchAlerts = createAsyncThunk('alerts/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/alerts?${query}`);
    return res.data.data;
  } catch {
    return mockAlerts;
  }
});

export const acknowledgeAlert = createAsyncThunk('alerts/acknowledge', async (id, { rejectWithValue }) => {
  try {
    await api.put(`/alerts/${id}/acknowledge`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to acknowledge.');
  }
});

export const resolveAlert = createAsyncThunk('alerts/resolve', async ({ id, action_taken }, { rejectWithValue }) => {
  try {
    await api.put(`/alerts/${id}/resolve`, { action_taken });
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to resolve.');
  }
});

const alertsSlice = createSlice({
  name: 'alerts',
  initialState: {
    items: mockAlerts,
    unreadCount: mockAlerts.filter((a) => a.status === 'active').length,
    loading: false,
    error: null,
  },
  reducers: {
    addAlert: (state, { payload }) => {
      state.items.unshift(payload);
      state.unreadCount += 1;
    },
    clearUnread: (state) => { state.unreadCount = 0; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending,   (state) => { state.loading = true; })
      .addCase(fetchAlerts.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload;
        state.unreadCount = payload.filter((a) => a.status === 'active').length;
      })
      .addCase(fetchAlerts.rejected, (state) => { state.loading = false; })
      .addCase(acknowledgeAlert.fulfilled, (state, { payload: id }) => {
        const alert = state.items.find((a) => a.id === id);
        if (alert) { alert.status = 'acknowledged'; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(resolveAlert.fulfilled, (state, { payload: id }) => {
        const alert = state.items.find((a) => a.id === id);
        if (alert) { alert.status = 'resolved'; }
      });
  },
});

export const { addAlert, clearUnread } = alertsSlice.actions;
export default alertsSlice.reducer;
