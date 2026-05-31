const router = require('express').Router();
const { query: db } = require('../db/db');
const auth = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');

router.use(auth);

function nextDueDate(current, frequency) {
  const d = new Date(current);
  switch (frequency) {
    case 'daily':   d.setDate(d.getDate() + 1);     break;
    case 'weekly':  d.setDate(d.getDate() + 7);     break;
    case 'monthly': d.setMonth(d.getMonth() + 1);   break;
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

// GET /api/recurring – saját ismétlődők listája
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db(
      `SELECT r.*, c.name AS category_name, c.color AS category_color
       FROM recurring_transactions r
       LEFT JOIN categories c ON c.id = r.category_id
       WHERE r.user_id = $1
       ORDER BY r.active DESC, r.next_due`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/recurring – új ismétlődő létrehozása
router.post('/', async (req, res, next) => {
  try {
    const { type, title, amount, category_id, frequency, next_due, notes } = req.body;
    if (!type || !title || !amount || !frequency || !next_due)
      return next(httpError('Hiányzó kötelező mező.', 422));

    const { rows } = await db(
      `INSERT INTO recurring_transactions (user_id,type,title,amount,category_id,frequency,next_due,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.userId, type, title, parseFloat(amount), category_id || null, frequency, next_due, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/recurring/:id – módosítás vagy aktív/inaktív váltás
router.put('/:id', async (req, res, next) => {
  try {
    const { type, title, amount, category_id, frequency, next_due, active, notes } = req.body;
    const { rows } = await db(
      `UPDATE recurring_transactions SET
         type=$1, title=$2, amount=$3, category_id=$4,
         frequency=$5, next_due=$6, active=$7, notes=$8
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [type, title, parseFloat(amount), category_id || null,
       frequency, next_due, active ?? true, notes || null,
       req.params.id, req.userId]
    );
    if (!rows[0]) return next(httpError('Nem található.', 404));
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/recurring/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await db(
      'DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!rowCount) return next(httpError('Nem található.', 404));
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /api/recurring/generate – esedékes tételek létrehozása tranzakcióként
router.post('/generate', async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows: due } = await db(
      `SELECT * FROM recurring_transactions
       WHERE user_id = $1 AND active = TRUE AND next_due <= $2`,
      [req.userId, today]
    );

    if (due.length === 0) return res.json({ generated: 0 });

    // Batch INSERT – minden esedékes tétel egyszerre
    const insertValues = due.map((r, i) => {
      const base = i * 7;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7})`;
    }).join(',');
    const insertParams = due.flatMap(r =>
      [r.user_id, r.type, r.title, r.amount, r.category_id, r.next_due, r.notes]
    );
    await db(
      `INSERT INTO transactions (user_id,type,title,amount,category_id,date,notes) VALUES ${insertValues}`,
      insertParams
    );

    // Batch UPDATE – következő esedékességek frissítése
    const updateValues = due.map((r, i) =>
      `($${i*2+1}::uuid, $${i*2+2}::date)`
    ).join(',');
    const updateParams = due.flatMap(r => [r.id, nextDueDate(r.next_due, r.frequency)]);
    await db(
      `UPDATE recurring_transactions SET next_due = v.next_due
       FROM (VALUES ${updateValues}) AS v(id, next_due)
       WHERE recurring_transactions.id = v.id`,
      updateParams
    );

    res.json({ generated: due.length });
  } catch (err) { next(err); }
});

module.exports = router;
