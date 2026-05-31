/**
 * Seed script – demo adatok feltöltése
 * Futtatás: npm run seed
 *
 * Létrehoz 2 demo felhasználót, globális + egyéni kategóriákat,
 * és 30 minta tranzakciót az elmúlt 3 hónapra.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');
const logger = require('../utils/logger');

// ── Demo felhasználók ──────────────────────────────────────────────────────
const USERS = [
  { email: 'demo@penztarca.hu', password: 'Demo1234!', name: 'Kovács Nóra' },
  { email: 'test@penztarca.hu', password: 'Test1234!', name: 'Nagy Péter' },
];

// ── Globális kategóriák (user_id = NULL) ───────────────────────────────────
const GLOBAL_CATEGORIES = [
  { name: 'Élelmiszer',   color: '#1D9E75', icon: 'ti-shopping-cart' },
  { name: 'Rezsi',        color: '#BA7517', icon: 'ti-bolt'          },
  { name: 'Közlekedés',   color: '#3B6D11', icon: 'ti-car'           },
  { name: 'Szórakozás',   color: '#993556', icon: 'ti-device-tv'     },
  { name: 'Vendéglátás',  color: '#D85A30', icon: 'ti-tools-kitchen-2'},
  { name: 'Egészség',     color: '#A32D2D', icon: 'ti-first-aid-kit' },
  { name: 'Öltözet',      color: '#534AB7', icon: 'ti-shirt'         },
  { name: 'Megtakarítás', color: '#185FA5', icon: 'ti-piggy-bank'    },
  { name: 'Egyéb',        color: '#888780', icon: 'ti-dots'          },
];

// ── Segédfüggvények ────────────────────────────────────────────────────────
function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Tranzakció sablonok ────────────────────────────────────────────────────
function buildTransactions(userId, catMap) {
  const txns = [];

  // Havi fix bevételek (utolsó 3 hónap)
  for (let m = 0; m < 3; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    d.setDate(10);
    txns.push({ userId, type: 'income', title: 'Havi fizetés',
      amount: 350000, catId: null, date: d.toISOString().slice(0, 10), notes: '' });
  }
  // Alkalmi bevétel
  txns.push({ userId, type: 'income', title: 'Freelance projekt',
    amount: 85000, catId: null, date: daysAgo(12), notes: 'Webdesign megbízás' });
  txns.push({ userId, type: 'income', title: 'Adó-visszatérítés',
    amount: 24500, catId: null, date: daysAgo(45), notes: '' });

  // Élelmiszer
  const foodId = catMap['Élelmiszer'];
  const foodItems = ['Aldi bevásárlás','Tesco nagybevásárlás','Lidl bevásárlás','Piac','Online rendelés'];
  for (let i = 0; i < 8; i++) {
    txns.push({ userId, type: 'expense', title: pick(foodItems),
      amount: randomBetween(3000, 25000), catId: foodId,
      date: daysAgo(Math.floor(Math.random() * 90)), notes: '' });
  }

  // Rezsi
  const rezsiId = catMap['Rezsi'];
  txns.push({ userId, type:'expense', title:'Villanyszámla',  amount:18500, catId:rezsiId, date:daysAgo(20), notes:'' });
  txns.push({ userId, type:'expense', title:'Gáz számla',     amount:12000, catId:rezsiId, date:daysAgo(21), notes:'' });
  txns.push({ userId, type:'expense', title:'Internet díj',   amount: 5990, catId:rezsiId, date:daysAgo(22), notes:'DIGI' });
  txns.push({ userId, type:'expense', title:'Vízdíj',         amount: 4200, catId:rezsiId, date:daysAgo(51), notes:'' });
  txns.push({ userId, type:'expense', title:'Villanyszámla',  amount:16800, catId:rezsiId, date:daysAgo(50), notes:'' });

  // Közlekedés
  const kozId = catMap['Közlekedés'];
  txns.push({ userId, type:'expense', title:'Benzin',     amount: 9200, catId:kozId, date:daysAgo(5),  notes:'' });
  txns.push({ userId, type:'expense', title:'Buszjegy',   amount:  900, catId:kozId, date:daysAgo(10), notes:'' });
  txns.push({ userId, type:'expense', title:'Autópálya',  amount: 2500, catId:kozId, date:daysAgo(33), notes:'' });

  // Szórakozás
  const szorakId = catMap['Szórakozás'];
  txns.push({ userId, type:'expense', title:'Netflix előfizetés', amount:4990, catId:szorakId, date:daysAgo(8),  notes:'' });
  txns.push({ userId, type:'expense', title:'Spotify',            amount:2490, catId:szorakId, date:daysAgo(9),  notes:'' });
  txns.push({ userId, type:'expense', title:'Mozi',               amount:3800, catId:szorakId, date:daysAgo(38), notes:'2 jegy' });

  // Vendéglátás
  const etkezId = catMap['Vendéglátás'];
  txns.push({ userId, type:'expense', title:'Étterem – születésnap', amount:14600, catId:etkezId, date:daysAgo(15), notes:'' });
  txns.push({ userId, type:'expense', title:'Kávézó',                amount: 2100, catId:etkezId, date:daysAgo(3),  notes:'' });
  txns.push({ userId, type:'expense', title:'Kebab ebéd',            amount: 2400, catId:etkezId, date:daysAgo(7),  notes:'' });

  // Egészség
  const egeszsegId = catMap['Egészség'];
  txns.push({ userId, type:'expense', title:'Gyógyszertár',   amount:3400, catId:egeszsegId, date:daysAgo(6),  notes:'' });
  txns.push({ userId, type:'expense', title:'Fogorvos',       amount:12000,catId:egeszsegId, date:daysAgo(62), notes:'' });

  // Öltözet
  const oltId = catMap['Öltözet'];
  txns.push({ userId, type:'expense', title:'Cipő',      amount:18900, catId:oltId, date:daysAgo(25), notes:'Őszi csere' });
  txns.push({ userId, type:'expense', title:'Pulóver',   amount: 7800, catId:oltId, date:daysAgo(70), notes:'' });

  return txns;
}

// ── Fő seed függvény ───────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Töröljük a régi demo adatokat (sorrend fontos!)
    await client.query(`DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))`, [USERS.map(u => u.email)]);
    await client.query(`DELETE FROM settings    WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))`, [USERS.map(u => u.email)]);
    await client.query(`DELETE FROM categories  WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))`, [USERS.map(u => u.email)]);
    await client.query(`DELETE FROM users WHERE email = ANY($1)`, [USERS.map(u => u.email)]);
    await client.query(`DELETE FROM categories WHERE user_id IS NULL`);

    // Globális kategóriák
    const catIds = {}; // name → id
    for (const cat of GLOBAL_CATEGORIES) {
      const { rows } = await client.query(
        `INSERT INTO categories (user_id, name, color, icon) VALUES (NULL,$1,$2,$3) RETURNING id`,
        [cat.name, cat.color, cat.icon]
      );
      catIds[cat.name] = rows[0].id;
    }

    // Felhasználók
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 12);
      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id`,
        [u.email, hash, u.name]
      );
      const userId = rows[0].id;

      // Beállítások
      await client.query(
        `INSERT INTO settings (user_id, monthly_budget, currency) VALUES ($1,$2,'HUF')`,
        [userId, 200000]
      );

      // Tranzakciók
      const txns = buildTransactions(userId, catIds);
      for (const t of txns) {
        await client.query(
          `INSERT INTO transactions (user_id,type,title,amount,category_id,date,notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [t.userId, t.type, t.title, t.amount, t.catId, t.date, t.notes]
        );
      }

      logger.info(`✅ Felhasználó létrehozva: ${u.email} – ${txns.length} tranzakcióval`);
    }

    await client.query('COMMIT');
    logger.info('🌱 Seed kész! Demo bejelentkezési adatok:');
    logger.info('   Email: demo@penztarca.hu | Jelszó: Demo1234!');
    logger.info('   Email: test@penztarca.hu | Jelszó: Test1234!');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Seed hiba:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
