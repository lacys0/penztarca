/**
 * Auth végpontok integrációs tesztje
 * Futtatás: npm test
 *
 * Megjegyzés: a tesztekhez futó PostgreSQL szükséges (lásd .env.example).
 * CI-ban a docker-compose.test.yml-ben definiált adatbázis-konténer biztosítja.
 */
const request = require('supertest');
const app     = require('../src/app');
const { pool } = require('../src/db/db');

// Teszt email – minden run után töröljük
const TEST_EMAIL = `jest_${Date.now()}@penztarca.test`;
const TEST_PASS  = 'JestPass123!';
const TEST_NAME  = 'Jest Teszt';

let token;

afterAll(async () => {
  // Cleanup: töröljük a teszt felhasználót
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('201 – sikeres regisztráció', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASS, name: TEST_NAME });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it('422 – rövid jelszó', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@y.com', password: '123', name: 'X' });

    expect(res.status).toBe(422);
  });

  it('409 – duplikált email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASS, name: TEST_NAME });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('200 – helyes adatokkal', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('401 – rossz jelszóval', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPass999!' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/me', () => {
  it('200 – autentikált lekérés', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_EMAIL);
  });

  it('401 – token nélkül', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });
});

describe('Transactions CRUD', () => {
  let txId;

  it('POST /api/transactions – létrehozás', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', title: 'Teszt kiadás', amount: 5000, date: '2026-05-01' });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe('5000.00');
    txId = res.body.id;
  });

  it('GET /api/transactions – lista', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/transactions – amount_min szűrő', async () => {
    const res = await request(app)
      .get('/api/transactions?amount_min=1000&amount_max=9000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(t => {
      expect(parseFloat(t.amount)).toBeGreaterThanOrEqual(1000);
      expect(parseFloat(t.amount)).toBeLessThanOrEqual(9000);
    });
  });

  it('GET /api/transactions – date_from/date_to szűrő', async () => {
    const res = await request(app)
      .get('/api/transactions?date_from=2026-05-01&date_to=2026-05-31')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /api/transactions/:id – módosítás', async () => {
    const res = await request(app)
      .put(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', title: 'Módosított kiadás', amount: 9999, date: '2026-05-01' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Módosított kiadás');
  });

  it('DELETE /api/transactions/:id – törlés', async () => {
    const res = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});

describe('Categories CRUD', () => {
  let catId;

  it('GET /api/categories – lista (tartalmaz globális kategóriákat)', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/categories – saját kategória létrehozása', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Teszt kategória', color: '#FF0000' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Teszt kategória');
    catId = res.body.id;
  });

  it('PUT /api/categories/:id – módosítás', async () => {
    const res = await request(app)
      .put(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Módosított kategória', color: '#00FF00' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Módosított kategória');
  });

  it('DELETE /api/categories/:id – törlés', async () => {
    const res = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('401 – autentikáció nélkül nem elérhető', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });
});

describe('Recurring Transactions CRUD', () => {
  let recId;

  it('POST /api/recurring – létrehozás', async () => {
    const res = await request(app)
      .post('/api/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense', title: 'Teszt ismétlődő', amount: 4990,
        frequency: 'monthly', next_due: '2026-06-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Teszt ismétlődő');
    expect(res.body.frequency).toBe('monthly');
    recId = res.body.id;
  });

  it('GET /api/recurring – lista', async () => {
    const res = await request(app)
      .get('/api/recurring')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(r => r.id === recId)).toBe(true);
  });

  it('POST /api/recurring/generate – esedékes tételek generálása', async () => {
    // Állítsuk next_due-t a múltra, hogy generálható legyen
    await request(app)
      .put(`/api/recurring/${recId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense', title: 'Teszt ismétlődő', amount: 4990,
        frequency: 'monthly', next_due: '2026-01-01', active: true,
      });

    const res = await request(app)
      .post('/api/recurring/generate')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.generated).toBeGreaterThanOrEqual(1);
  });

  it('PUT /api/recurring/:id – inaktívvá tétel', async () => {
    const res = await request(app)
      .put(`/api/recurring/${recId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense', title: 'Teszt ismétlődő', amount: 4990,
        frequency: 'monthly', next_due: '2026-06-01', active: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('DELETE /api/recurring/:id – törlés', async () => {
    const res = await request(app)
      .delete(`/api/recurring/${recId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});

describe('Stats végpontok', () => {
  it('GET /api/stats/monthly – havi statisztika', async () => {
    const res = await request(app)
      .get('/api/stats/monthly?month=2026-05')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_income');
    expect(res.body).toHaveProperty('total_expense');
    expect(res.body).toHaveProperty('balance');
  });

  it('GET /api/stats/trend – trend adatok', async () => {
    const res = await request(app)
      .get('/api/stats/trend')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('401 – token nélkül nem elérhető', async () => {
    const res = await request(app).get('/api/stats/monthly');
    expect(res.status).toBe(401);
  });
});

describe('Forgot/Reset Password', () => {
  it('POST /api/auth/forgot-password – 200 (létező email)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/auth/forgot-password – 200 (nem létező email esetén sem 404)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nemletezik@test.hu' });

    expect(res.status).toBe(200);
  });

  it('POST /api/auth/reset-password – 400 érvénytelen tokennel', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'hamis_token_123', password: 'UjJelszo1!' });

    expect(res.status).toBe(400);
  });
});
