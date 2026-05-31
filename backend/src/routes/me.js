const router = require('express').Router();
const { query: db } = require('../db/db');
const auth = require('../middleware/auth');
const { settingsRules, validate } = require('../validators');

router.use(auth);

/**
 * @openapi
 * /api/me:
 *   get:
 *     tags: [Me]
 *     summary: Bejelentkezett felhasználó profilja és beállításai
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserProfile' }
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db(
      `SELECT u.id, u.email, u.name, u.created_at,
              s.monthly_budget, s.currency, s.dark_mode
       FROM users u
       LEFT JOIN settings s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/me/settings:
 *   put:
 *     tags: [Me]
 *     summary: Beállítások frissítése
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monthly_budget: { type: number, example: 200000 }
 *               currency:       { type: string, example: "HUF" }
 *               dark_mode:      { type: boolean, example: false }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 monthly_budget: { type: number }
 *                 currency:       { type: string }
 *                 dark_mode:      { type: boolean }
 */
router.put('/settings', settingsRules, validate, async (req, res, next) => {
  try {
    const { monthly_budget, currency, dark_mode } = req.body;
    const { rows } = await db(
      `INSERT INTO settings (user_id, monthly_budget, currency, dark_mode)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
         SET monthly_budget = COALESCE($2, settings.monthly_budget),
             currency       = COALESCE($3, settings.currency),
             dark_mode      = COALESCE($4, settings.dark_mode),
             updated_at     = NOW()
       RETURNING monthly_budget, currency, dark_mode`,
      [req.userId, monthly_budget ?? null, currency ?? null, dark_mode ?? null]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
