# AXOM ONE — Assam local discovery MVP

A mobile-first React + TypeScript + Vite frontend, Cloudflare Worker API, and Cloudflare D1 database starter.

## MVP scope
- District-first discovery (district is configurable; no district is hard-coded as the only launch area)
- Browse published local listings
- Submit a business/resource listing for review
- Admin moderation API protected by an admin bearer token
- Assamese-inspired ivory, textile red, tea-green visual design
- Basic search and category filters
- SQLite/D1 schema and seed categories

> This is a starter project, not a production-audited service. Before public launch, configure secrets, HTTPS/custom domain if desired, backups, rate limits, spam controls, and privacy/terms pages. Do not put admin secrets in frontend code.

## Requirements
- Node.js 20+
- npm
- Cloudflare account for deployment (free tier availability/limits may change)
- Wrangler CLI via `npx wrangler`

## Local frontend
```bash
npm install
npm run dev
```
By default, the UI uses `/api`. For local full-stack development, run the Worker in another terminal:
```bash
npm run worker:dev
```
Set `VITE_API_BASE=http://127.0.0.1:8787` in `.env.local` if needed.

## D1 setup
Create a D1 database:
```bash
npx wrangler d1 create axom-one-db
```
Copy the returned `database_id` into `wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
Apply schema locally:
```bash
npx wrangler d1 execute axom-one-db --local --file=./worker/schema.sql
```
Apply schema to remote D1:
```bash
npx wrangler d1 execute axom-one-db --remote --file=./worker/schema.sql
```
Seed categories and example district labels:
```bash
npx wrangler d1 execute axom-one-db --remote --file=./worker/seed.sql
```
The seed file includes a small set of illustrative districts; edit it to match the pilot district. Do not treat example listings as real.

## Configure Worker secret
Generate a long random token and set it as a Cloudflare secret:
```bash
npx wrangler secret put ADMIN_TOKEN
```
Paste the token when prompted. Keep it private. The admin moderation UI is intentionally not included yet; moderation is available via authenticated API endpoints. Build an admin-only UI later using server-side role/session handling rather than embedding secrets in React.

## Run Worker locally
```bash
npm run worker:dev
```
Set a local secret in `.dev.vars` (never commit this file):
```dotenv
ADMIN_TOKEN="replace-with-a-long-random-local-token"
```

## API endpoints
- `GET /api/health`
- `GET /api/districts`
- `GET /api/categories`
- `GET /api/listings?district=<slug>&category=<slug>&q=<query>`
- `GET /api/listings/:id`
- `POST /api/listings` — public submission; creates `pending` listing
- `GET /api/admin/pending` — admin token required
- `POST /api/admin/listings/:id/review` — admin token required; body `{ "decision": "publish" | "reject", "note": "..." }`

Admin endpoints require `Authorization: Bearer <ADMIN_TOKEN>`. Do not expose the token to browsers or share it with listing submitters. For production, replace the static admin token with authenticated admin accounts, role-based authorization, audit review, and stronger rate limiting.

## Deploy frontend + Worker
1. Update `wrangler.toml` with your D1 database ID.
2. Run `npm run build`.
3. Deploy Worker/API: `npx wrangler deploy`.
4. Deploy frontend to Cloudflare Pages. In Pages build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Set `VITE_API_BASE` to your Worker URL for the Pages build, OR route `/api/*` through the same domain using a Pages Function / Worker routing configuration. The simplest starter setup is to set `VITE_API_BASE` to the deployed Worker URL and allow that frontend origin in `ALLOWED_ORIGINS`.
6. In Worker secrets/settings, set `ADMIN_TOKEN` and `ALLOWED_ORIGINS` (comma-separated exact origins, e.g. `https://your-project.pages.dev`). Never use `*` for credentialed requests.
7. Rebuild and redeploy frontend after changing `VITE_API_BASE`.

## Free-tier note
Cloudflare offers free options for static hosting, Workers, and D1, subject to current quotas, fair-use policies, and changing terms. Review current official pricing/limits before launch. A custom domain is optional; buying one is not free.

## Before real launch
- Add privacy policy, terms, takedown/reporting process, contact details, and consent for submitted data.
- Verify contact details before marking `verified`.
- Do not publish personal phone/address details without permission.
- Add CAPTCHA or equivalent bot protection and persistent per-IP rate limiting.
- Add admin identity and review audit logs.
- Configure and test database backup/restore.
- Add tests, monitoring, accessibility checks, and data deletion workflow.
