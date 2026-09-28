// ============================================================
// Antarctic Station Command — Main Server Entry Point
// Node.js + Express + Socket.io
// Serves static frontend + REST API + Real-time Telemetry
// ============================================================
require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { startSimulator } = require('./services/sensorSimulator');

// Routes
const authRoutes      = require('./routes/auth');
const usersRoutes     = require('./routes/users');
const sensorsRoutes   = require('./routes/sensors');
const alertsRoutes    = require('./routes/alerts');
const inventoryRoutes = require('./routes/inventory');
const equipmentRoutes = require('./routes/equipment');

const app = express();
const httpServer = http.createServer(app);

// ---- Security & Middleware ----
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting: 500 requests / 15 minutes per IP for API
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
}));

// ---- Static Frontend Files ----
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Favicon handler to ensure 0 404s
app.get('/favicon.ico', (req, res) => {
  const icoPath = path.join(frontendPath, 'favicon.ico');
  const svgPath = path.join(frontendPath, 'favicon.svg');
  if (fs.existsSync(icoPath)) {
    return res.sendFile(icoPath);
  } else if (fs.existsSync(svgPath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.sendFile(svgPath);
  }
  res.status(204).end();
});

// ---- Health check ----
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Antarctic Station Command Platform',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    stations: ['maitri', 'bharati'],
  });
});

// ---- API Routes ----
app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/alerts',    alertsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/equipment', equipmentRoutes);

// Sensor routes nested under stations (mergeParams)
app.use('/api/stations/:stationId/sensors', sensorsRoutes);

// Station overview shortcut
app.use('/api/stations/:stationId/overview', require('./routes/sensors'));

// Stations list
app.get('/api/stations', (req, res) => {
  const stationsFile = path.resolve(__dirname, '../../data/stations.json');
  if (fs.existsSync(stationsFile)) {
    try {
      const stations = JSON.parse(fs.readFileSync(stationsFile, 'utf8'));
      return res.json({ success: true, data: stations });
    } catch (e) {
      // Fallback
    }
  }
  res.json({
    success: true,
    data: [
      { id: 'maitri',  name: 'Maitri Station',  location: 'Schirmacher Oasis, Queen Maud Land', latitude: -70.7667, longitude: 11.7333, established: 1989 },
      { id: 'bharati', name: 'Bharati Station', location: 'Larsemann Hills, East Antarctica',  latitude: -69.4069, longitude: 76.1919, established: 2012 },
    ],
  });
});

// ---- Catch-All SPA Handler ----
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
  }
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// ---- Global error handler ----
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ---- Bootstrap ----
const PORT = process.env.PORT || 4000;

const bootstrap = async () => {
  // Initialize Socket.io BEFORE starting simulator
  initSocket(httpServer);

  // Try connecting to PostgreSQL (non-blocking fallback to in-memory)
  await connectDB();

  // Start mock sensor data simulator
  startSimulator();

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('❄️  ╔══════════════════════════════════════════════════╗');
    console.log('    ║        ANTARCTIC STATION COMMAND PLATFORM        ║');
    console.log('    ║    Maitri & Bharati Integrated Command Base      ║');
    console.log('    ╠══════════════════════════════════════════════════╣');
    console.log(`    ║  🚀 Platform: http://localhost:${PORT}               ║`);
    console.log(`    ║  📡 API:      http://localhost:${PORT}/api/stations  ║`);
    console.log(`    ║  🩺 Health:   http://localhost:${PORT}/health        ║`);
    console.log('    ╚══════════════════════════════════════════════════╝');
    console.log('');
  });
};

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
