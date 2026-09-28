import { io } from 'socket.io-client';
import { store } from '../store/index.js';
import { updateSensorData, setConnected } from '../store/slices/sensorsSlice.js';
import { addAlert } from '../store/slices/alertsSlice.js';
import { addNotification } from '../store/slices/uiSlice.js';

let socket = null;

const LEVEL_COLORS = { red: '🔴', yellow: '🟡', green: '🟢' };

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io('/', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    store.dispatch(setConnected(true));
    // Join rooms for both stations
    socket.emit('join_station', 'maitri');
    socket.emit('join_station', 'bharati');
  });

  socket.on('disconnect', (reason) => {
    console.warn('🔌 Socket disconnected:', reason);
    store.dispatch(setConnected(false));
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️  Socket connection error:', err.message);
    store.dispatch(setConnected(false));
  });

  // Real-time sensor update
  socket.on('sensor_update', (data) => {
    store.dispatch(updateSensorData(data));
  });

  // Real-time alert
  socket.on('alert_created', (alert) => {
    store.dispatch(addAlert(alert));
    // Show in-app toast
    const emoji = LEVEL_COLORS[alert.level] || '⚠️';
    store.dispatch(addNotification({
      type:    alert.level,
      title:   alert.title,
      message: alert.message,
      station: alert.station_id,
    }));
    // Play sound if enabled
    const { soundEnabled } = store.getState().ui;
    if (soundEnabled) playAlertSound(alert.level);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const getSocket = () => socket;

// Simple Web Audio API alert tone
const playAlertSound = (level) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = level === 'red' ? 880 : level === 'yellow' ? 660 : 440;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) { /* AudioContext not available */ }
};
