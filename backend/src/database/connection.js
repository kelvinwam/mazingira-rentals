const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      min: 2, max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', err => console.error('PG pool error:', err.message));
  }
  return pool;
}

async function connectDB() {
  const client = await getPool().connect();
  console.log('✅ PostgreSQL connected');
  client.release();
}

async function query(text, params) {
  try {
    return await getPool().query(text, params);
  } catch (err) {
    console.error('Query error:', err.message, '\n', text.substring(0, 100));
    throw err;
  }
}

async function getClient() {
  return getPool().connect();
}

module.exports = { connectDB, query, getClient };
