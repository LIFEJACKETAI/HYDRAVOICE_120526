# HydraVoice
A full-stack Text-to-Speech document conversion platform. Upload a PDF, DOCX, or TXT file, choose from 20 voice profiles, and download a high-quality WAV audiobook — all from the browser.
## Features
- **Document upload** — PDF, DOCX, TXT (up to 20 MB)
- **20 voice profiles** — Female/Male, American/British accents, each with distinct speed and pitch
- **Chunked TTS processing** — handles long documents reliably with retry logic
- **Voice previews** — listen before you convert
- **Freemium plan system** — Free (5k chars), Starter, Pro, Enterprise
- **Authentication** — email/password, Google OAuth, Microsoft Azure AD
- **Stripe payments** — monthly/annual billing with webhook support
- **Admin dashboard** — user management, analytics, health checks
- **Dark/light theme**, responsive UI
---
## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (standalone output) |
| Runtime | Bun 1.3.4+ |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Shadcn UI, Framer Motion |
| Database | SQLite via Prisma 6 |
| Auth | NextAuth.js 4 (JWT, Prisma adapter) |
| TTS | z-ai-web-dev-sdk |
| Payments | Stripe |
| Reverse Proxy | Caddy |
---
## Prerequisites
- **Bun** 1.3.4+ — https://bun.sh
- **Node.js** 18+
- A **z-ai-web-dev-sdk** API key
- Stripe account (optional, for payments)
- Google / Microsoft credentials (optional, for OAuth)
---
## Local Development
### 1. Clone and install
    git clone https://github.com/LIFEJACKETAI/HYDRAVOICE_120526.git
    cd HYDRAVOICE_120526
    bun install
### 2. Configure environment variables
    cp .env.example .env
Edit `.env` with your values:
    NEXTAUTH_SECRET=your-random-secret
    NEXTAUTH_URL=http://localhost:3000
    DATABASE_URL=file:./db/database.sqlite
    GOOGLE_ID=
    GOOGLE_SECRET=
    MICROSOFT_ID=
    MICROSOFT_SECRET=
    STRIPE_SECRET_KEY=
    STRIPE_WEBHOOK_SECRET=
    STRIPE_PRICE_STARTER=
    STRIPE_PRICE_PRO=
    STRIPE_PRICE_ENTERPRISE=
    APP_URL=http://localhost:3000
    NODE_ENV=development
### 3. Set up the database
    bun run db:push
    bun run db:generate
    bunx ts-node prisma/seed-admin.ts
### 4. Start the dev server
    bun run dev
Open http://localhost:3000
---
## Production Deployment
### Build
    bun run build
### Start
    bun run start
Server runs on port 3000. Set PORT to override. Logs go to server.log.
### Caddy reverse proxy
Edit the included Caddyfile to set your domain:
    yourdomain.com {
        reverse_proxy localhost:3000
    }
Then run:
    caddy run --config Caddyfile
---
## Database Commands
    bun run db:push       # sync schema
    bun run db:migrate    # create and apply a migration
    bun run db:generate   # regenerate Prisma client
    bun run db:reset      # DANGER: wipe and rebuild
---
## Stripe Webhooks
1. Create a webhook at https://yourdomain.com/api/payments/webhook
2. Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
3. Copy signing secret to STRIPE_WEBHOOK_SECRET
Local testing:
    stripe listen --forward-to localhost:3000/api/payments/webhook
---
## Character Limits by Plan
| Plan | Limit |
|---|---|
| Guest | 5,000 characters |
| Free / authenticated | 50,000 characters |
| Admin | Unlimited |
---
## License
Private — All rights reserved. LIFEJACKET AI.