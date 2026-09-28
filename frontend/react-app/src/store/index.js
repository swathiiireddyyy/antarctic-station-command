import { configureStore } from '@reduxjs/toolkit';
import authReducer    from './slices/authSlice.js';
import sensorsReducer from './slices/sensorsSlice.js';
import alertsReducer  from './slices/alertsSlice.js';
import uiReducer      from './slices/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    sensors: sensorsReducer,
    alerts:  alertsReducer,
    ui:      uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
