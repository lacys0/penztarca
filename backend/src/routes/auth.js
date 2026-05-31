const router     = require('express').Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const nodemailer = require('nodemailer');
const { query: db, pool } = require('../db/db');
const { registerRules, loginRules, validate } = require('../validators');
const { httpError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function sendResetEmail(email, name, resetUrl) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.info(`[JELSZÓ-VISSZAÁLLÍTÁS] ${email} → ${resetUrl}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@penztarca.hu',
    to: email,
    subject: 'Pénztárca – jelszó visszaállítás',
    html: `<p>Kedves ${name}!</p>
<p>Jelszó visszaállítási linket kértél. Kattints az alábbi gombra:</p>
<p><a href="${resetUrl}" style="background:#1D9E75;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Jelszó visszaállítása</a></p>
<p>A link 1 óráig érvényes. Ha nem Te kérted, hagyd figyelmen kívül.</p>`,
  });
}

// ── Segédfüggvény ─────────────────────────────────────────────────────────
function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '60m',
  });
}

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Új felhasználó regisztráció
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:    { type: string, format: email, example: "demo@penztarca.hu" }
 *               password: { type: string, minLength: 8,  example: "Demo1234!" }
 *               name:     { type: string, example: "Kovács Nóra" }
 *     responses:
 *       201:
 *         description: Sikeres regisztráció
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       409: { description: Email már foglalt }
 *       422: { description: Validációs hiba }
 */
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const hash = await bcrypt.hash(password, 12);

    const { rows } = await db(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, hash, name]
    );
    const user = rows[0];

    // Alapértelmezett beállítások létrehozása
    await db(`INSERT INTO settings (user_id) VALUES ($1)`, [user.id]);

    const token = signToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Bejelentkezés
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Sikeres bejelentkezés
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401: { description: Hibás email vagy jelszó }
 */
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await db(
      `SELECT id, email, name, password_hash FROM users WHERE email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return next(httpError('Hibás email cím vagy jelszó.', 401));

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return next(httpError('Hibás email cím vagy jelszó.', 401));

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Jelszó visszaállítási link kérése
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Link elküldve (vagy nem létező email esetén is ugyanez) }
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(httpError('Email cím kötelező.', 422));

    const { rows } = await db('SELECT id, name FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.json({ message: 'Ha létezik ez az email cím, küldtünk egy visszaállítási linket.' });
    }

    const user      = rows[0];
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
      await client.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expiresAt]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendResetEmail(email, user.name, `${frontendUrl}/reset-password?token=${token}`);

    res.json({ message: 'Ha létezik ez az email cím, küldtünk egy visszaállítási linket.' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Jelszó visszaállítása tokennel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:    { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Sikeres jelszóváltás }
 *       400: { description: Érvénytelen vagy lejárt token }
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return next(httpError('Token és új jelszó kötelező.', 422));
    if (password.length < 8) return next(httpError('A jelszó legalább 8 karakter legyen.', 422));

    const { rows } = await db(
      'SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    if (rows.length === 0) return next(httpError('Érvénytelen vagy lejárt link.', 400));

    const rec = rows[0];
    if (rec.used) return next(httpError('Ez a link már fel lett használva.', 400));
    if (new Date(rec.expires_at) < new Date()) return next(httpError('A link lejárt. Kérj újat.', 400));

    const hash = await bcrypt.hash(password, 12);
    await db('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, rec.user_id]);
    await db('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);

    res.json({ message: 'Jelszó sikeresen megváltoztatva. Bejelentkezhetsz az új jelszóval.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
