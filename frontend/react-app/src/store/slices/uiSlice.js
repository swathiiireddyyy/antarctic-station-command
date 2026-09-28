import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen:     true,
    selectedStation: 'both',   // 'both' | 'maitri' | 'bharati'
    timeRange:       '24h',    // '1h' | '6h' | '24h' | '7d'
    theme:           'dark',
    notifications:   [],       // in-app toast notifications
    soundEnabled:    true,
  },
  reducers: {
    toggleSidebar:    (state)          => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebar:       (state, { payload }) => { state.sidebarOpen = payload; },
    setSelectedStation: (state, { payload }) => { state.selectedStation = payload; },
    setTimeRange:     (state, { payload }) => { state.timeRange = payload; },
    toggleSound:      (state)          => { state.soundEnabled = !state.soundEnabled; },
    addNotification:  (state, { payload }) => {
      const note = { id: Date.now(), ...payload };
      state.notifications.unshift(note);
      if (state.notifications.length > 5) state.notifications.pop();
    },
    removeNotification: (state, { payload: id }) => {
      state.notifications = state.notifications.filter((n) => n.id !== id);
    },
    clearNotifications: (state) => { state.notifications = []; },
  },
});

export const {
  toggleSidebar, setSidebar, setSelectedStation, setTimeRange,
  toggleSound, addNotification, removeNotification, clearNotifications,
} = uiSlice.actions;
export default uiSlice.reducer;
