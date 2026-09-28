// ============================================================
// IARI Monitor — Socket.io Configuration
// Manages real-time communication for sensor updates & alerts
// ============================================================
const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join station-specific rooms
    socket.on('join_station', (stationId) => {
      socket.join(`station_${stationId}`);
      console.log(`   ↳ Socket ${socket.id} joined room: station_${stationId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIo = () => io;

/**
 * Emit a real-time sensor update to all connected clients
 * @param {Object} data - Sensor data payload
 */
const emitSensorUpdate = (data) => {
  if (!io) return;
  io.emit('sensor_update', data);
  // Also emit to station-specific room
  if (data.stationId) {
    io.to(`station_${data.stationId}`).emit('station_sensor_update', data);
  }
};

/**
 * Emit a real-time alert to all connected clients
 * @param {Object} alert - Alert payload
 */
const emitAlert = (alert) => {
  if (!io) return;
  io.emit('alert_created', alert);
};

module.exports = { initSocket, getIo, emitSensorUpdate, emitAlert };
