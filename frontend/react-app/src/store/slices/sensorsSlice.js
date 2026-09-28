import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockSensorData } from '../../utils/mockData.js';
import api from '../../services/api.js';

export const fetchSensorHistory = createAsyncThunk(
  'sensors/fetchHistory',
  async ({ stationId, sensorType, hours = 24 }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/stations/${stationId}/sensors/${sensorType}/history?hours=${hours}`);
      return { stationId, sensorType, data: res.data.data };
    } catch {
      return rejectWithValue({ stationId, sensorType, data: [] });
    }
  }
);

const initialStationState = () => ({
  sensors: {},
  health_score: 85,
  system_status: 'online',
  lastUpdated: null,
});

const sensorsSlice = createSlice({
  name: 'sensors',
  initialState: {
    maitri:  { ...initialStationState(), sensors: mockSensorData.maitri },
    bharati: { ...initialStationState(), sensors: mockSensorData.bharati },
    history: { maitri: {}, bharati: {} },
    loading: false,
    connected: false,
  },
  reducers: {
    updateSensorData: (state, { payload }) => {
      const { stationId, sensors, health_score, system_status, timestamp } = payload;
      if (!state[stationId]) return;
      state[stationId].sensors     = sensors;
      state[stationId].health_score  = health_score;
      state[stationId].system_status = system_status;
      state[stationId].lastUpdated   = timestamp;
      // Append to sparkline history (keep last 20 points per sensor)
      for (const [type, reading] of Object.entries(sensors)) {
        if (!state.history[stationId][type]) state.history[stationId][type] = [];
        state.history[stationId][type].push({ timestamp, value: reading.value });
        if (state.history[stationId][type].length > 20) state.history[stationId][type].shift();
      }
    },
    setConnected: (state, { payload }) => { state.connected = payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSensorHistory.pending,   (state) => { state.loading = true; })
      .addCase(fetchSensorHistory.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.history[payload.stationId][payload.sensorType] = payload.data;
      })
      .addCase(fetchSensorHistory.rejected, (state) => { state.loading = false; });
  },
});

export const { updateSensorData, setConnected } = sensorsSlice.actions;
export default sensorsSlice.reducer;
