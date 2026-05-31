const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Pénztárca – Költségkövető API',
      version: '1.0.0',
      description: `
## Pénztárca REST API

Teljes dokumentáció a szakdolgozathoz tartozó költségkövető alkalmazás backendhez.

### Autentikáció
Az API JWT Bearer tokent használ. A bejelentkezés után kapott \`token\`-t
az \`Authorization: Bearer <token>\` fejlécben kell küldeni.

### Demo belépési adatok (seed után)
- **Email:** demo@penztarca.hu  
- **Jelszó:** Demo1234!
      `,
      contact: { name: 'Fejlesztő', email: 'demo@penztarca.hu' },
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Fejlesztői szerver' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token a /api/auth/login végpontból',
        },
      },
      schemas: {
        // ── Auth ────────────────────────────────────────────────────────────
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiJ9...' },
            user: {
              type: 'object',
              properties: {
                id:    { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                name:  { type: 'string' },
              },
            },
          },
        },
        // ── User ─────────────────────────────────────────────────────────────
        UserProfile: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            email:          { type: 'string', format: 'email' },
            name:           { type: 'string' },
            created_at:     { type: 'string', format: 'date-time' },
            monthly_budget: { type: 'number', example: 200000 },
            currency:       { type: 'string', example: 'HUF' },
            dark_mode:      { type: 'boolean' },
          },
        },
        // ── Category ──────────────────────────────────────────────────────────
        Category: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            user_id:    { type: 'string', format: 'uuid', nullable: true,
                          description: 'null = globális kategória' },
            name:       { type: 'string', example: 'Élelmiszer' },
            color:      { type: 'string', example: '#1D9E75' },
            icon:       { type: 'string', example: 'ti-shopping-cart' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        // ── Transaction ───────────────────────────────────────────────────────
        Transaction: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            user_id:        { type: 'string', format: 'uuid' },
            type:           { type: 'string', enum: ['income', 'expense'] },
            title:          { type: 'string', example: 'Aldi bevásárlás' },
            amount:         { type: 'number', example: 12800 },
            category_id:    { type: 'string', format: 'uuid', nullable: true },
            category_name:  { type: 'string', example: 'Élelmiszer' },
            category_color: { type: 'string', example: '#1D9E75' },
            category_icon:  { type: 'string', example: 'ti-shopping-cart' },
            date:           { type: 'string', format: 'date', example: '2026-05-15' },
            notes:          { type: 'string', nullable: true },
            created_at:     { type: 'string', format: 'date-time' },
            updated_at:     { type: 'string', format: 'date-time' },
          },
        },
        TransactionInput: {
          type: 'object',
          required: ['type', 'title', 'amount', 'date'],
          properties: {
            type:        { type: 'string', enum: ['income', 'expense'] },
            title:       { type: 'string', example: 'Aldi bevásárlás' },
            amount:      { type: 'number', example: 12800 },
            category_id: { type: 'string', format: 'uuid', nullable: true },
            date:        { type: 'string', format: 'date', example: '2026-05-16' },
            notes:       { type: 'string', nullable: true },
          },
        },
      },
    },
  },
  // JSDoc annotációkat tartalmazó fájlok
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
