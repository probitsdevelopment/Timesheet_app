const { Pool } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL if provided to avoid IPv6 issues
let poolConfig;

if (process.env.DATABASE_URL) {
  // Parse the connection string to extract components
  // This avoids IPv6 resolution issues with connectionString option
  const url = new URL(process.env.DATABASE_URL);
  poolConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1), // Remove leading '/'
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    },
    // Force IPv4 to avoid IPv6 connection issues on Railway
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
    statement_timeout: 10000,
    max: 20,
    idleTimeoutMillis: 30000,
  };

  // Log connection attempt
  console.log(`🔗 Connecting to: ${url.hostname}:${url.port}/${url.pathname.slice(1)} (IPv4 forced)`);
} else {
  // Use individual parameters
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'timesheet_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

// Create connection pool
const pool = new Pool(poolConfig);

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('📋 Connection details:', {
      usingDatabaseUrl: !!process.env.DATABASE_URL,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'timesheet_db'
    });
  } else {
    console.log('✅ Database connection successful');
    console.log('📅 Server time:', res.rows[0].now);
  }
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

// Query function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`✅ Executed query in ${duration}ms`);
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    throw error;
  }
};

// Get single row
const getOne = async (text, params) => {
  const res = await query(text, params);
  return res.rows[0];
};

// Get all rows
const getAll = async (text, params) => {
  const res = await query(text, params);
  return res.rows;
};

module.exports = {
  query,
  getOne,
  getAll,
  pool
};
