# MYST Finance

Loan-assistance website built from `MYST_Finance_Updated_Loan_Style_Designs-1.pdf`: borrowers fill one
application, pay a one-time ₹199 fee, and unlock a curated directory of lenders with direct links to apply on
each lender's official website.

- **Frontend** — TanStack Start (React 19, SSR) + TanStack Router/Form, Tailwind CSS v4, shadcn/ui
- **Backend** — FastAPI, SQLAlchemy 2 (async, psycopg 3), Alembic, PostgreSQL
- **Languages** — English (`/…`) and Hindi (`/hi/…`)

## Architecture

```
Browser ──► Caddy (HTTPS) ──┬── /api/*  ──► FastAPI (uvicorn) ──► PostgreSQL
                            └── /*      ──► TanStack Start SSR (Node)
                                                │ loaders call FastAPI on API_INTERNAL_URL,
                                                │ forwarding the visitor's session cookie
```

- **One origin.** The browser only talks to the site's own origin; `/api/*` reaches FastAPI through Caddy in
  production and through a TanStack server route (`frontend/src/routes/api/$.ts`) in development. The session
  cookie is `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, and state-changing requests from other origins are
  rejected by `CrossSiteRequestGuard`.
- **Isomorphic data loading.** `frontend/src/lib/api.ts` uses `createIsomorphicFn`: during SSR it calls FastAPI
  directly with the incoming cookie; in the browser it uses relative `/api`.
- **Types end to end.** FastAPI's OpenAPI schema generates `frontend/src/lib/api-schema.ts`
  (`npm run gen:api`), aliased in `src/lib/types.ts`.

### Pages (PDF screen → route)

| PDF | Route | Notes |
|---|---|---|
| 01 Homepage | `/` | SSR, JSON-LD Organization/WebSite/FAQ |
| 02 How It Works | `/how-it-works` (+ homepage section) | HowTo JSON-LD |
| 03–04 Login / OTP | `/login` | Email OTP (see below) |
| 05–08 Application | `/apply?step=personal\|employment\|loan\|review` | Saved to the server after each step |
| 09 Payment | `/checkout` | Razorpay Checkout (or a mock dialog in dev) |
| 10 Payment Success | `/checkout/success` | |
| 11 Lender list | `/dashboard/lenders` | Paid; matching lenders first; PDF download |
| 12 Lender detail | `/lenders/$slug` | **Public SEO page**; official link only when unlocked |
| 13 Dashboard | `/dashboard` | Stats + recent activity |
| 14 My Payments | `/dashboard/payments` | GST/receipt PDF invoices |

Extra public pages for SEO: `/lenders` directory, `/loans` + 4 loan-type landing pages, `/emi-calculator`
(SSR from query params), `/blog` (MDX), `/faq`, `/about`, `/contact`, `/terms`, `/privacy`, `/refund-policy`,
`/disclaimer`. Dashboard also has My Applications, Profile and Support.

### SEO

- Server-rendered HTML for every public page; private pages are `noindex` and disallowed in `robots.txt`.
- Per-route `<title>`, description, canonical, Open Graph/Twitter tags, `hreflang` (`en-IN`, `hi-IN`,
  `x-default`) and `<html lang>`.
- JSON-LD: Organization, WebSite, BreadcrumbList, FAQPage, HowTo, LoanOrCredit, ItemList, Article,
  WebApplication.
- `/sitemap.xml` (every public URL × language with `xhtml:link` alternates, lenders pulled from the API),
  `/robots.txt`, `/rss.xml`.
- MDX is rendered to HTML inside a server function, so article and legal-page bodies never ship as JS.
- Self-hosted variable fonts (Plus Jakarta Sans + Noto Sans Devanagari) — no render-blocking font requests.

### Business rules

- **Login**: email + 6-digit OTP. Codes are HMAC-hashed, expire in 10 min, lock after 5 wrong tries,
  30 s resend cooldown, 5/hour per email and 20/hour per IP.
- **Payment**: ₹199 (`ACCESS_FEE_PAISE`) unlocks the directory **for life**; requires a submitted application.
  Verified by Razorpay signature on return *and* by webhook (`payment.captured` / `order.paid`), idempotently.
- **Invoices**: consecutive per financial year (`MF/2026-27/000001`). If `BUSINESS_GSTIN` is set the PDF is a
  tax invoice with the fee treated as GST-inclusive; otherwise a plain receipt.
- **PAN** is encrypted at rest (Fernet, `PII_ENCRYPTION_KEY`) and only shown masked after submission.
- **Lenders** live in `backend/app/data/lenders.yaml` (validated at startup, served from memory). Edit and
  redeploy to change them.

## Local development

Prerequisites: Python 3.13 + [uv](https://docs.astral.sh/uv/), Node 22, PostgreSQL 16+.

```bash
# Database (example: inside an existing Postgres container)
psql -U postgres -c "CREATE ROLE myst LOGIN PASSWORD 'myst_dev_password'"
psql -U postgres -c "CREATE DATABASE myst_finance OWNER myst"
psql -U postgres -c "CREATE DATABASE myst_finance_test OWNER myst"

# Backend → http://localhost:8000 (docs at /api/docs)
cd backend
cp .env.example .env            # fill SECRET_KEY and PII_ENCRYPTION_KEY (commands are in the file)
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Frontend → http://localhost:3000
cd frontend
cp .env.example .env
npm install
npm run dev
```

In development `MAIL_BACKEND=console` prints OTP emails to the backend log, and `PAYMENT_PROVIDER=mock` shows
a "test payment" dialog instead of Razorpay. Production refuses to start with either.

### Test accounts

```bash
cd backend && uv run python -m app.seed_dev   # re-run any time to reset them
```

| Email | State |
|---|---|
| `new@test.mystfinance.in` | Fresh account, no application |
| `applied@test.mystfinance.in` | Submitted application, lender list locked (test checkout) |
| `paid@test.mystfinance.in` | Paid — lender list unlocked, invoice available |

They log in with `DEV_LOGIN_CODE` (default `123456` in `.env.example`); no email is sent and OTP rate limits
don't apply. Only `@test.mystfinance.in` addresses get this, never in production (startup fails if it is set).

### Tests and checks

```bash
cd backend  && uv run pytest && uv run ruff check . && uv run alembic check
cd frontend && npm test && npm run typecheck && npm run build
```

Backend tests run against `TEST_DATABASE_URL` (default `myst_finance_test` on localhost).

### Changing the API

```bash
cd backend  && uv run alembic revision --autogenerate -m "describe change"   # if models changed
cd backend  && uv run python -m app.export_openapi ../frontend/openapi.json
cd frontend && npm run gen:api
```

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | `postgresql+psycopg://…` |
| `SECRET_KEY` | backend | HMAC for OTPs and mock payment signatures |
| `PII_ENCRYPTION_KEY` | backend | Fernet key for PAN. **Changing it makes stored PANs unreadable.** |
| `SITE_URL`, `EXTRA_ALLOWED_ORIGINS` | backend | Allowed origins for state-changing requests; `https://` enables `Secure` cookies |
| `MAIL_BACKEND`, `SMTP_*`, `MAIL_FROM` | backend | `smtp` + Gmail App Password in production |
| `PAYMENT_PROVIDER`, `RAZORPAY_*` | backend | Razorpay keys + webhook secret |
| `ACCESS_FEE_PAISE` | backend | Fee (default 19900 = ₹199) |
| `BUSINESS_NAME/ADDRESS/GSTIN`, `GST_RATE_PERCENT` | backend | Invoice details |
| `VITE_SITE_URL` | frontend (build time) | Canonical/hreflang/sitemap origin |
| `API_INTERNAL_URL` | frontend (runtime) | How the SSR server reaches FastAPI |

### Gmail SMTP

1. Turn on 2-Step Verification for the Google account.
2. Google Account → Security → App passwords → create one for "Mail".
3. Set `MAIL_BACKEND=smtp`, `SMTP_USERNAME=<gmail address>`, `SMTP_PASSWORD=<16-char app password>`,
   `MAIL_FROM="MYST Finance <same gmail address>"`.

Gmail caps sending at roughly 500 messages/day; move to a transactional provider (SES, Resend, Postmark) by
adding a class next to `SMTPMailer` in `backend/app/mailer.py` when volume grows.

### Razorpay

1. Create API keys (test mode first) and set `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
2. Add a webhook to `https://<domain>/api/payments/webhook` for `payment.captured` and `order.paid`, and set
   `RAZORPAY_WEBHOOK_SECRET`.
3. Razorpay KYC requires live Terms, Privacy, Refund and Contact pages — they exist at the routes above.

## Deployment (single VPS)

```bash
cp .env.example .env    # DOMAIN, POSTGRES_PASSWORD, secrets, SMTP, Razorpay
docker compose up -d --build
```

`docker-compose.yml` runs Postgres, the API (applies migrations on start), the SSR web server and Caddy
(automatic HTTPS, security headers, `www` → apex redirect). Point the domain's A/AAAA records at the server first.

## Before going live

- [ ] **Verify every lender** in `backend/app/data/lenders.yaml` against the lender's official site / Key Fact
      Statement, then set `verified: true` and `last_verified_on`. All 24 entries are currently indicative.
- [ ] Have a lawyer review Terms, Privacy (DPDP Act 2023), Refund Policy and Disclaimer
      (`frontend/src/content/pages/*.mdx`), and fill in the registered business name/address.
- [ ] Confirm the business model with counsel: charging users a fee for lender information must not be
      presented as a loan fee or imply approval (copy already says this throughout).
- [ ] Replace the illustration/initial avatars with licensed photography and logos if desired
      (`frontend/src/components/hero-illustration.tsx`, `lender-avatar.tsx`).
- [ ] Set real `support@` / `grievance@` addresses (`frontend/src/lib/site.ts`, backend `SUPPORT_EMAIL`).
- [ ] Submit `https://<domain>/sitemap.xml` in Google Search Console.

## Deliberate differences from the PDF

- **Login is email OTP**, not mobile OTP, and the mobile number field is dropped (as requested).
- Marketing claims that can't be verified yet were softened: "Lowest Interest Rates" → "Compare Interest
  Rates", "Trusted by 50K+ Users" → "24+ Lenders Listed", "20+ Verified Lenders" → "24 Curated Lenders". The
  hero card's minimum rate is computed from the lender data rather than hard-coded.
- Lender logos are initial avatars (lender trademarks are not reproduced without permission).
