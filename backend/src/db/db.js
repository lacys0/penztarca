const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL szükséges pl. Render / Supabase esetén:
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => logger.info('PostgreSQL kapcsolódva'));
pool.on('error', (err) => logger.error('PostgreSQL hiba:', err));

/**
 * Egyszerű query helper – paraméterezett lekérdezéseket használj mindig!
 * @param {string} text  – SQL szöveg ($1, $2, … placeholderekkel)
 * @param {Array}  params – értékek tömbje
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
