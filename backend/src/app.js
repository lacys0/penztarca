require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swaggerSpec');
const logger = require('./utils/logger');

const authRoutes      = require('./routes/auth');
const meRoutes        = require('./routes/me');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes  = require('./routes/categories');
const statsRoutes     = require('./routes/stats');
const recurringRoutes = require('./routes/recurring');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

// Auth végpontokra szigorúbb rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 perc
  max: 20,
  message: { error: 'Túl sok kísérlet. Próbáld újra 15 perc múlva.' },
});

// ── Swagger UI ───────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pénztárca API',
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/recurring', recurringRoutes);

// Alap health-check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Hibakezelő (mindig utolsó) ────────────────────────────────────────────
app.use(errorHandler);

// ── Szerver indítás ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`Szerver fut: http://localhost:${PORT}`);
  logger.info(`Swagger UI:  http://localhost:${PORT}/api/docs`);
});

module.exports = app; // tesztekhez
