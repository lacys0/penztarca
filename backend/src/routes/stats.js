const router = require('express').Router();
const { query: db } = require('../db/db');
const auth = require('../middleware/auth');
const { query: qv, validate } = require('../validators');

router.use(auth);

/**
 * @openapi
 * /api/stats/monthly:
 *   get:
 *     tags: [Stats]
 *     summary: Havi statisztika – bevétel/kiadás összesítve, kategória-megoszlás
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: string, example: "2026-05" }
 *     responses:
 *       200:
 *         description: Havi statisztikák
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 month:          { type: string }
 *                 total_income:   { type: number }
 *                 total_expense:  { type: number }
 *                 balance:        { type: number }
 *                 monthly_budget: { type: number }
 *                 budget_pct:     { type: number }
 *                 by_category:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id:   { type: string }
 *                       category_name: { type: string }
 *                       color:         { type: string }
 *                       total:         { type: number }
 */
router.get('/monthly', async (req, res, next) => {
  try {
    const userId = req.userId;
    const month  = req.query.month || new Date().toISOString().slice(0, 7);
    const [y, m] = month.split('-');
    const from = `${y}-${m}-01`;
    const to   = new Date(Number(y), Number(m), 1).toISOString().slice(0, 10);

    // Bevétel / kiadás összesítők
    const totalsRes = await db(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type='income'),  0) AS total_income,
         COALESCE(SUM(amount) FILTER (WHERE type='expense'), 0) AS total_expense
       FROM transactions
       WHERE user_id=$1 AND date>=$2 AND date<$3`,
      [userId, from, to]
    );
    const { total_income, total_expense } = totalsRes.rows[0];

    // Havi keret
    const settingsRes = await db(
      `SELECT monthly_budget FROM settings WHERE user_id=$1`,
      [userId]
    );
    const monthly_budget = settingsRes.rows[0]?.monthly_budget ?? 0;
    const budget_pct = monthly_budget > 0
      ? Math.round((total_expense / monthly_budget) * 100)
      : null;

    // Kategória-megoszlás (csak kiadások)
    const catRes = await db(
      `SELECT
         t.category_id,
         COALESCE(c.name, 'Egyéb') AS category_name,
         COALESCE(c.color, '#888780') AS color,
         COALESCE(c.icon,  'ti-dots')  AS icon,
         SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id=$1 AND t.type='expense' AND t.date>=$2 AND t.date<$3
       GROUP BY t.category_id, c.name, c.color, c.icon
       ORDER BY total DESC`,
      [userId, from, to]
    );

    res.json({
      month,
      total_income:  parseFloat(total_income),
      total_expense: parseFloat(total_expense),
      balance:       parseFloat(total_income) - parseFloat(total_expense),
      monthly_budget: parseFloat(monthly_budget),
      budget_pct,
      by_category: catRes.rows.map(r => ({
        ...r,
        total: parseFloat(r.total),
        pct: total_expense > 0
          ? Math.round((r.total / total_expense) * 100)
          : 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/stats/trend:
 *   get:
 *     tags: [Stats]
 *     summary: 12 hónapos bevétel/kiadás trend
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Havi összesítők az elmúlt 12 hónapra
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:         { type: string }
 *                   total_income:  { type: number }
 *                   total_expense: { type: number }
 */
router.get('/trend', async (req, res, next) => {
  try {
    const { rows } = await db(
      `SELECT
         TO_CHAR(date_trunc('month', date), 'YYYY-MM') AS month,
         COALESCE(SUM(amount) FILTER (WHERE type='income'),  0) AS total_income,
         COALESCE(SUM(amount) FILTER (WHERE type='expense'), 0) AS total_expense
       FROM transactions
       WHERE user_id=$1
         AND date >= (date_trunc('month', NOW()) - INTERVAL '11 months')
       GROUP BY date_trunc('month', date)
       ORDER BY date_trunc('month', date)`,
      [req.userId]
    );
    res.json(rows.map(r => ({
      month:         r.month,
      total_income:  parseFloat(r.total_income),
      total_expense: parseFloat(r.total_expense),
    })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
