// ============================================================
// IARI Monitor — Database Configuration
// Falls back to in-memory mock when PostgreSQL is unavailable
// ============================================================
require('dotenv').config();
const { Pool } = require('pg');

let pool = null;
let dbAvailable = false;

const connectDB = async () => {
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'iari_monitor',
      user: process.env.DB_USER || 'iari_admin',
      password: process.env.DB_PASS || 'iari_secret_2024',
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      max: 20,
    });

    await pool.query('SELECT NOW()');
    dbAvailable = true;
    console.log('✅ PostgreSQL connected successfully');
  } catch (err) {
    console.warn('⚠️  PostgreSQL unavailable — running in mock/memory mode:', err.message);
    pool = null;
    dbAvailable = false;
  }
};

const query = async (text, params) => {
  if (!pool || !dbAvailable) {
    return { rows: [], rowCount: 0 };
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('DB Query error:', err.message);
    return { rows: [], rowCount: 0 };
  }
};

const isDbAvailable = () => dbAvailable;

module.exports = { connectDB, query, isDbAvailable };
