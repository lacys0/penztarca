# Pénztárca – Költségkövető Webalkalmazás

Szakdolgozati projekt – Talpa László Máté – Nyíregyházi Egyetem

## Előfeltételek

- Node.js (v20 vagy újabb)
- PostgreSQL (v15 vagy újabb)

## Indítás

### 1. Backend

```bash
cd backend
copy .env.example .env
```

Nyisd meg a `.env` fájlt és állítsd be a `DATABASE_URL`-t:

```
DATABASE_URL=postgresql://postgres:JELSZAVAD@localhost:5432/penztarca
JWT_SECRET=valamilyen-titkos-kulcs
```

Majd:

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

A backend elérhető: `http://localhost:4000`  
API dokumentáció (Swagger): `http://localhost:4000/api/docs`

### 2. Frontend (új terminálban)

```bash
cd frontend
npm install
npm run dev
```

Az alkalmazás elérhető: `http://localhost:5173`

## Demo belépési adatok

| Email | Jelszó |
|---|---|
| `demo@penztarca.hu` | `Demo1234!` |
| `test@penztarca.hu` | `Test1234!` |
