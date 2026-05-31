const { body, query, param } = require('express-validator');
const { validationResult } = require('express-validator');

/** Futtatja a validátorokat, és ha hiba van, 422-vel válaszol */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validációs hiba.', details: errors.array() });
  }
  next();
}

// ── Auth ────────────────────────────────────────────────────────────────────
const registerRules = [
  body('email').isEmail().withMessage('Érvénytelen email cím.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('A jelszó legalább 8 karakter.')
    .matches(/[A-Z]/).withMessage('Legyen benne nagybetű.')
    .matches(/[0-9]/).withMessage('Legyen benne szám.'),
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('A név 2–80 karakter lehet.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// ── Transactions ─────────────────────────────────────────────────────────────
const transactionRules = [
  body('type').isIn(['income','expense']).withMessage("Csak 'income' vagy 'expense' lehet."),
  body('title').trim().isLength({ min: 1, max: 120 }).withMessage('A cím kötelező (max 120 kar.).'),
  body('amount').isFloat({ gt: 0 }).withMessage('Az összeg pozitív szám kell legyen.'),
  body('date').isDate().withMessage('Érvénytelen dátum (YYYY-MM-DD formátum).'),
  body('category_id').optional({ nullable: true }).isUUID().withMessage('Érvénytelen kategória ID.'),
  body('notes').optional().isLength({ max: 500 }),
];

// ── Query paraméterek szűréshez ──────────────────────────────────────────────
const transactionQueryRules = [
  query('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('A hónap YYYY-MM formátumú legyen.'),
  query('category_id').optional().isUUID(),
  query('type').optional().isIn(['income','expense']),
  query('limit').optional().isInt({ min:1, max:200 }).toInt(),
  query('offset').optional().isInt({ min:0 }).toInt(),
];

// ── Categories ───────────────────────────────────────────────────────────────
const categoryRules = [
  body('name').trim().isLength({ min: 1, max: 60 }).withMessage('A név kötelező.'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Érvénytelen szín (pl. #1D9E75).'),
  body('icon').optional().isLength({ max: 40 }),
];

// ── Settings ─────────────────────────────────────────────────────────────────
const settingsRules = [
  body('monthly_budget').optional().isFloat({ min: 0 }),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('dark_mode').optional().isBoolean(),
];

// ── UUID param ────────────────────────────────────────────────────────────────
const uuidParam = param('id').isUUID().withMessage('Érvénytelen ID formátum.');

module.exports = {
  validate,
  registerRules,
  loginRules,
  transactionRules,
  transactionQueryRules,
  categoryRules,
  settingsRules,
  uuidParam,
};
