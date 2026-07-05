# AGENTS.md

## Cursor Cloud specific instructions

This repository is a backend-only **Order Management System (OMS) REST API** (Node.js + TypeScript, Express, Prisma, MySQL). There is no frontend/UI; test it via HTTP (curl) or the automated test suite. Standard scripts live in `package.json` (`dev`, `build`, `start`, `test`, `lint`, `db:migrate`, `db:reset`, `db:seed`).

### Database (MySQL) — required for almost everything
- The app, the Prisma migrations, the seed, and the automated tests all talk to a **real MySQL 8 instance**. MySQL is installed on the VM but is **not started automatically** — start it each session with `sudo service mysql start`.
- Databases `oms` and `oms_shadow` and user `oms_user` (password `oms_password`) are provisioned to match `.env.example`. `root` uses password `root_password` with `mysql_native_password`.
- `.env` is git-ignored. If it is missing, create it with `cp .env.example .env` (the default values already match the local MySQL setup).

### Applying schema / seeding
- Prefer `npx prisma migrate deploy` to apply existing migrations — it does **not** need a shadow database. `npm run db:migrate` runs `prisma migrate dev`, which requires `SHADOW_DATABASE_URL` (root) and is only for creating new migrations.
- `npm run db:seed` seeds sample data. Seeded logins: `admin@oms.local` / `admin123` (ADMIN) and `operador@oms.local` / `operator123` (OPERATOR).

### Testing gotcha
- The automated tests (`npm test`, vitest) run against the same `oms` database and `tests/setup.ts` **truncates all tables in `beforeEach`**. There is no separate test database. After running the tests, the seed data is gone — run `npm run db:seed` again before doing manual/API testing.

### Running the app
- `npm run dev` starts the API on `PORT` (default `3000`) with `tsx watch` hot-reload. Health check: `GET /health` → `{"status":"ok"}`. API is mounted under `/api/v1` (e.g. `POST /api/v1/auth/login`).
- Auth is JWT Bearer; the login response returns the token at `tokens.accessToken` (not `data.token`). Created resources are returned as the bare object (no `data` wrapper); list endpoints return `{ data, pagination }`.
