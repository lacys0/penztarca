const jwt = require('jsonwebtoken');

/**
 * authMiddleware – védi a privát route-okat.
 * Ellenőrzi az Authorization: Bearer <token> fejlécet.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Hiányzó vagy érvénytelen Authorization fejléc.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub; // uuid string
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'A token lejárt. Kérj új tokent.' });
    }
    return res.status(401).json({ error: 'Érvénytelen token.' });
  }
}

module.exports = authMiddleware;
