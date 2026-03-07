const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err);
    });
  }
  return pool;
}

async function connectDB() {
  const db = getPool();
  const client = await db.connect();
  console.log('✅ PostgreSQL connected');
  client.release();
  return db;
}

async function query(text, params) {
  const db = getPool();
  try {
    return await db.query(text, params);
  } catch (err) {
    console.error('Query error:', { query: text.substring(0, 80), error: err.message });
    throw err;
  }
}

async function getClient() {
  return getPool().connect();
}

module.exports = { connectDB, query, getClient };
