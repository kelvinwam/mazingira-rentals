// tests/globalSetup.js
// Runs ONCE before the entire test suite
require('dotenv').config({ path: '.env.test' });
require('dotenv').config(); // fallback to .env

module.exports = async function () {
  process.env.NODE_ENV = 'test';
  // Verify DB is reachable before running tests
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('SELECT 1');
    console.log('\n✅  Test database connected\n');
  } catch (err) {
    console.error('\n❌  Cannot connect to test database:', err.message);
    console.error('    Make sure DATABASE_URL in .env points to a running PostgreSQL instance\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
};
