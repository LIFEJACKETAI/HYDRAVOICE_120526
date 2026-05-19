# HydraVoice

A full-stack Text-to-Speech document conversion platform. Upload a PDF, DOCX, or TXT file, choose from 20 voice profiles, and download a high-quality WAV audiobook — all from the browser, powered by Puter.js (OpenAI TTS) with zero API key cost.

---

## Features

- **Client-side TTS** — powered by [Puter.js](https://puter.com) (`puter.ai.txt2speech`), routes to OpenAI TTS for free, no API key required
- **Document upload** — PDF, DOCX, TXT (up to 20 MB), server-side text extraction
- **20 voice profiles** — Female/Male, American/British accents (alloy · echo · fable · onyx · nova · shimmer)
- **Voice previews** — listen before you convert
- **Chunked conversion** — long documents split at sentence boundaries, stitched back together with the Web Audio API
- **Freemium plan system** — ECHO (free/10k chars) · SPARK ($9/500k) · ROAR ($19/2M) · CHORUS ($39/6M) · HYDRA (Enterprise/unlimited)
- **Authentication** — email/password, Google OAuth, Microsoft Azure AD (OAuth providers optional)
- **Stripe payments** — monthly/annual billing with webhook support
- **Admin dashboard** — user management, analytics, system health

---

## Tech Stack

| Layer         | Technology                                        |
|---------------|---------------------------------------------------|
| Framework     | Next.js 16 (standalone output, Turbopack)         |
| Runtime       | Bun 1.3.4+                                        |
| Language      | TypeScript 5                                      |
| UI            | React 19, Tailwind CSS 4, Shadcn UI, Framer Motion|
| Database      | SQLite via Prisma 6                               |
| Auth          | NextAuth.js 4 (JWT, Prisma adapter)               |
| TTS           | Puter.js v2 — `puter.ai.txt2speech()` (OpenAI)   |
| Audio stitching | Web Audio API (client-side WAV encoding)         |
| Payments      | Stripe                                            |
| Reverse Proxy | Caddy                                             |

---

## How TTS Works

TTS runs entirely in the browser — no API key needed:

1. User uploads/pastes text and picks a voice
2. Text is chunked at sentence boundaries (≤ 1,000 chars each)
3. Browser calls `puter.ai.txt2speech(chunk, { voice })` for each chunk
4. Each response is decoded with the Web Audio API
5. All decoded buffers are concatenated and encoded as a single WAV file
6. User plays or downloads the result

No server round-trip for TTS. The server is only used for document text extraction (PDF/DOCX parsing).

---

## Prerequisites

- **Bun** 1.3.4+ — https://bun.sh
- **Node.js** 18+
- No TTS API key required (Puter.js is free)
- Stripe account (optional, for payments)
- Google / Microsoft credentials (optional, for OAuth)

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/C-Jay69/HYDRAVOICE_120526.git
cd HYDRAVOICE_120526
bun install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXTAUTH_SECRET=your-random-secret-at-least-32-chars
NEXTAUTH_URL=http://localhost:3001
DATABASE_URL=file:../db/custom.db

# OAuth — leave blank to disable Google/Microsoft buttons
GOOGLE_ID=
GOOGLE_SECRET=
MICROSOFT_ID=
MICROSOFT_SECRET=

# Stripe — leave blank if not using payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SPARK_MONTHLY=
STRIPE_PRICE_SPARK_ANNUAL=
STRIPE_PRICE_ROAR_MONTHLY=
STRIPE_PRICE_ROAR_ANNUAL=
STRIPE_PRICE_CHORUS_MONTHLY=
STRIPE_PRICE_CHORUS_ANNUAL=

APP_URL=http://localhost:3001
NODE_ENV=development
```

> **Note:** OAuth providers (Google, Microsoft) are only activated when their credentials are set. Leaving them blank hides the buttons automatically.

### 3. Set up the database

```bash
bun run db:push
bun run db:generate
bunx ts-node prisma/seed-admin.ts
```

### 4. Start the dev server

```bash
bun run dev
```

Open http://localhost:3001

---

## Production Deployment

### Build

```bash
bun run build
```

### Start

```bash
bun run start
```

Server listens on port 3000 by default. Override with `PORT=XXXX`.

### Caddy reverse proxy (included)

The included `Caddyfile` listens on port 81 and proxies to `localhost:3000`. Swap it for a domain-based config for production:

```caddyfile
yourdomain.com {
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Real-IP {remote_host}
    }
}
```

Then run:

```bash
caddy run --config Caddyfile
```

---

## Database Commands

```bash
bun run db:push       # sync schema to DB (dev)
bun run db:migrate    # create and apply a named migration
bun run db:generate   # regenerate Prisma client after schema change
bun run db:reset      # DANGER: wipe and rebuild DB
```

---

## Stripe Webhooks

1. Create a webhook endpoint at `https://yourdomain.com/api/payments/webhook`
2. Subscribe to events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`

Local testing with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
```

---

## Character Limits by Plan

| Plan               | Monthly Limit        | Price      |
|--------------------|----------------------|------------|
| ECHO (Free)        | 10,000 characters    | $0         |
| SPARK (Starter)    | 500,000 characters   | $9/mo      |
| ROAR (Pro)         | 2,000,000 characters | $19/mo     |
| CHORUS (Business)  | 6,000,000 characters | $39/mo     |
| HYDRA (Enterprise) | Unlimited            | Custom     |
| Admin              | Unlimited            | —          |

Annual billing saves ~20% on SPARK, ROAR, and CHORUS.

---

## Voice Profiles

20 curated voices using OpenAI TTS via Puter.js:

| Category        | Voices                                        | Puter Voice |
|-----------------|-----------------------------------------------|-------------|
| American Female | Sophia, Emma, Olivia, Ava, Isabella           | nova / shimmer / alloy |
| American Male   | James, William, Alexander, Daniel, Benjamin   | onyx / echo / fable |
| British Female  | Charlotte, Victoria, Elizabeth, Margaret, Alice | fable / shimmer / nova / alloy |
| British Male    | Arthur, Oliver, Henry, Frederick, Edward      | fable / onyx / echo |

---

## License

Private — All rights reserved. LIFEJACKET AI.
