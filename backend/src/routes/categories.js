const router = require('express').Router();
const { query: db } = require('../db/db');
const auth = require('../middleware/auth');
const { httpError } = require('../middleware/errorHandler');
const { categoryRules, uuidParam, validate } = require('../validators');

router.use(auth);

/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Kategóriák listázása (globális + saját)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Category' }
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db(
      `SELECT * FROM categories
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY user_id NULLS FIRST, name`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Új kategória létrehozása
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:  { type: string, example: "Lakás" }
 *               color: { type: string, example: "#1D9E75" }
 *               icon:  { type: string, example: "ti-home" }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Category' }
 */
router.post('/', categoryRules, validate, async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;
    const { rows } = await db(
      `INSERT INTO categories (user_id, name, color, icon)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.userId, name, color || '#1D9E75', icon || 'ti-tag']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Kategória módosítása
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
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               color: { type: string }
 *               icon:  { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Category' }
 *       403: { description: Globális kategória nem módosítható }
 *       404: { description: Nem található }
 */
router.put('/:id', [uuidParam, ...categoryRules], validate, async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;
    // Globális kategóriát nem módosíthat felhasználó
    const { rows } = await db(
      `UPDATE categories SET name=$1, color=$2, icon=$3
       WHERE id=$4 AND user_id=$5
       RETURNING *`,
      [name, color || '#1D9E75', icon || 'ti-tag', req.params.id, req.userId]
    );
    if (!rows[0]) return next(httpError('Kategória nem található vagy nem módosítható.', 404));
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Kategória törlése
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
      `DELETE FROM categories WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.userId]
    );
    if (!rowCount) return next(httpError('Kategória nem található vagy nem törölhető.', 404));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
