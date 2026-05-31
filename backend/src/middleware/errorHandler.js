const logger = require('../utils/logger');

/**
 * Központi hibakezelő Express middleware.
 * Mindig utolsóként regisztrálva az app.js-ben.
 */
function errorHandler(err, req, res, _next) {
  // Validációs hiba (express-validator)
  if (err.type === 'validation') {
    return res.status(422).json({ error: 'Validációs hiba.', details: err.details });
  }

  // PostgreSQL constraint hiba (pl. duplicate email)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ez az email cím már foglalt.' });
  }

  // Szándékos HTTP hiba
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Ismeretlen hiba – logoljuk, de ne szivárogjon ki részlet
  logger.error(err);
  return res.status(500).json({ error: 'Belső szerverhiba. Próbáld újra.' });
}

/** Gyors HTTP hiba dobása controller-ből */
function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { errorHandler, httpError };
