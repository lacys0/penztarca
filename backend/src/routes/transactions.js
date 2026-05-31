const router = require('express').Router();
const { query: db } = require('../db/db');
const auth = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');
const {
  transactionRules, transactionQueryRules,
  uuidParam, validate
} = require('../validators');

// Minden végpont autentikált
router.use(auth);

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Tranzakciók listázása (szűrhetők, lapozhatók)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: string, example: "2026-05" }
 *         description: Hónap szűrő (YYYY-MM)
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Cím / megjegyzés szövegkeresés
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Tranzakciók listája
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:  { type: array, items: { $ref: '#/components/schemas/Transaction' } }
 *                 total: { type: integer }
 */
router.get('/', transactionQueryRules, validate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { month, type, category_id, search, date_from, date_to, amount_min, amount_max } = req.query;
    const limit  = req.query.limit  ?? 50;
    const offset = req.query.offset ?? 0;

    // Dinamikus WHERE feltételek
    const conditions = ['t.user_id = $1'];
    const params = [userId];
    let p = 2;

    if (month) {
      const [y, m] = month.split('-');
      const from = `${y}-${m}-01`;
      const to   = new Date(y, m, 1).toISOString().slice(0, 10);
      conditions.push(`t.date >= $${p++} AND t.date < $${p++}`);
      params.push(from, to);
    } else {
      if (date_from) { conditions.push(`t.date >= $${p++}`); params.push(date_from); }
      if (date_to)   { conditions.push(`t.date <= $${p++}`); params.push(date_to); }
    }
    if (type) {
      conditions.push(`t.type = $${p++}`);
      params.push(type);
    }
    if (category_id) {
      conditions.push(`t.category_id = $${p++}`);
      params.push(category_id);
    }
    if (search) {
      conditions.push(`(t.title ILIKE $${p++} OR t.notes ILIKE $${p - 1})`);
      params.push(`%${search}%`);
    }
    if (amount_min) { conditions.push(`t.amount >= $${p++}`); params.push(parseFloat(amount_min)); }
    if (amount_max) { conditions.push(`t.amount <= $${p++}`); params.push(parseFloat(amount_max)); }

    const where = conditions.join(' AND ');

    // Összesített sor-szám lapozáshoz
    const countRes = await db(
      `SELECT COUNT(*) FROM transactions t WHERE ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    // Tényleges lekérdezés
    const { rows } = await db(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${where}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      [...params, limit, offset]
    );

    res.json({ data: rows, total });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Egy tranzakció lekérése
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Transaction' }
 *       404: { description: Nem található }
 */
router.get('/:id', uuidParam, validate, async (req, res, next) => {
  try {
    const { rows } = await db(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (!rows[0]) return next(httpError('Tranzakció nem található.', 404));
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Új tranzakció létrehozása
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Transaction' }
 */
router.post('/', transactionRules, validate, async (req, res, next) => {
  try {
    const { type, title, amount, category_id, date, notes } = req.body;
    const { rows } = await db(
      `INSERT INTO transactions (user_id, type, title, amount, category_id, date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.userId, type, title, amount, category_id || null, date, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/transactions/{id}:
 *   put:
 *     tags: [Transactions]
 *     summary: Tranzakció módosítása
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TransactionInput' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Transaction' }
 *       404: { description: Nem található }
 */
router.put('/:id', [uuidParam, ...transactionRules], validate, async (req, res, next) => {
  try {
    const { type, title, amount, category_id, date, notes } = req.body;
    const { rows } = await db(
      `UPDATE transactions
       SET type=$1, title=$2, amount=$3, category_id=$4, date=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=$8
       RETURNING *`,
      [type, title, amount, category_id || null, date, notes || null, req.params.id, req.userId]
    );
    if (!rows[0]) return next(httpError('Tranzakció nem található.', 404));
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/transactions/{id}:
 *   delete:
 *     tags: [Transactions]
 *     summary: Tranzakció törlése
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Törölve }
 *       404: { description: Nem található }
 */
router.delete('/:id', uuidParam, validate, async (req, res, next) => {
  try {
    const { rowCount } = await db(
      `DELETE FROM transactions WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.userId]
    );
    if (!rowCount) return next(httpError('Tranzakció nem található.', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
