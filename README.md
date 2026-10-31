<<<<<<< HEAD
# Yojana Sahayak

**The Right Scheme. The Right Guidance. In Your Language.**

A multilingual assistant that helps Indian citizens discover government schemes, check potential eligibility, and reach the official application page. It works in English, Hindi and Hinglish, and always shows the official source and the date the information was last checked.

> Not an official government website. Scheme data is hand-curated from public pages and must be verified before it is shown to citizens (see "Data verification" below).

## Tech stack

Next.js 16 (App Router) + TypeScript, Tailwind CSS, PostgreSQL + Prisma 6, Postgres full-text search + `pg_trgm` for typo tolerance (no vector DB), Gemini or Anthropic Claude API (switchable, server-side, streaming), Zod, next-intl (en, hi), Vitest, Playwright.

## Quick start (local)

Prerequisites: Node.js 20 or newer, Git, Docker Desktop.

```bash
npm install                         # also runs "prisma generate"
cp .env.example .env                # then edit .env (see below)
npm run db:up                       # starts Postgres 16 in Docker (with pg_trgm)
npm run db:migrate -- --name init   # FIRST TIME ONLY: creates prisma/migrations; commit it
npm run db:seed                     # loads data/schemes.seed.json
npm run dev                         # http://localhost:3000
```

Environment variables (`.env`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. The default in `.env.example` matches `docker-compose.yml`. |
| `LLM_PROVIDER` | `gemini` or `anthropic`. Optional: if empty, whichever API key is set is used (Gemini first). |
| `GEMINI_API_KEY` | Google Gemini API key (used when the provider is `gemini`). |
| `ANTHROPIC_API_KEY` | Claude API key (used when the provider is `anthropic`). Leave both keys empty to run in fallback mode (keyword search instead of AI). |
| `LLM_MODEL` | Model id for the chosen provider (a Gemini model id, or a Claude model id from docs.claude.com). |
| `DAILY_LLM_REQUEST_LIMIT` | Budget guard: maximum AI calls per day per server instance. |
| `DAILY_LLM_PER_CLIENT_LIMIT` | Maximum AI calls per day per client (default 40), so a few clients cannot use up the shared budget. |
| `SHOW_UNVERIFIED` | `true` shows draft schemes on Explore, clearly labelled. Works in production too, so keep it `false` on a public site. The chatbot and eligibility checker never use drafts. |

## Data verification (do this before the demo)

All 25 schemes in `data/schemes.seed.json` start as `needs_verification`. They were drafted without access to the official sites, so amounts, limits and links may be wrong. Draft records are **never** used by the chatbot or the eligibility checker, and never appear in production.

For each scheme:

1. Open its `source_url` and read the official page.
2. Correct any wrong field. `curation_notes` says what to check. Replace draft numbers in `eligibility_rules` with official values, or set the rules to `null` if unsure.
3. Set `"verification_status": "verified"` and `"last_checked_at": "YYYY-MM-DD"`.
4. Set `"hi_reviewed": true` only after a fluent Hindi speaker checks the Hindi text.
5. Run `npm run db:seed`, then `npm test` (the tests validate the seed file).

`npm run verify-sources` checks that every source and apply link is reachable and stores the result in the `SourceCheck` table. A reachable link is not proof that the facts are correct.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (eligibility engine, RAG helpers, validation, security) |
| `npm run typecheck` | TypeScript check |
| `npm run test:e2e` | Playwright flows (first run `npx playwright install chromium`; needs a seeded app running) |
| `npm run db:up` / `db:migrate` / `db:deploy` / `db:seed` | Database helpers |
| `npm run verify-sources` | Link check of official sources |

## Put it on GitHub

1. Create an empty repository on github.com (no README, no .gitignore).
2. Unzip this project, open a terminal in the folder, and run:

   ```bash
   git init
   git add .
   git commit -m "Yojana Sahayak MVP"
   git branch -M main
   git remote add origin https://github.com/<your-username>/yojana-sahayak.git
   git push -u origin main
   ```

3. `.env` is listed in `.gitignore` and will not be pushed. Never commit API keys.
4. GitHub Actions (`.github/workflows/ci.yml`) then runs the type-check, unit tests, build, a dependency audit and a secrets scan on every push.

## Deploy (Vercel + managed Postgres)

1. Create a Postgres database on Neon or Supabase and enable the extension: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
2. Make sure `prisma/migrations` is committed (created by the first `db:migrate` above).
3. Apply migrations and seed the cloud database from your machine:

   ```bash
   DATABASE_URL="<cloud url>" npm run db:deploy
   DATABASE_URL="<cloud url>" npm run db:seed
   ```

4. Import the GitHub repository in Vercel. Set `DATABASE_URL`, `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` (plus optional `LLM_PROVIDER`), `LLM_MODEL` and `DAILY_LLM_REQUEST_LIMIT` under Project Settings → Environment Variables, then deploy.
5. Open `/api/health` on the deployed URL. It should report `"db": true`.

## How it works

- **Search and retrieval** (`src/lib/schemes/repository.ts`, `src/lib/rag/`): the question is split into tokens, Hindi and Hinglish words are mapped to English keywords, and Postgres ranks schemes with full-text search plus trigram word similarity. So "scholership uttrakhand" still finds scholarships in Uttarakhand.
- **Chatbot** (`src/app/api/chat/route.ts`): detects English, Hindi or Hinglish, extracts a light profile from the conversation (kept in the request only), retrieves up to 6 verified schemes, and streams an answer from the configured AI provider constrained by a strict system prompt (`src/lib/ai/systemPrompt.ts`). If the AI is not configured, over budget or failing, or the database is down, it returns fallback results instead of an error.
- **Eligibility** (`src/lib/eligibility/engine.ts`): deterministic rules with three-valued logic (met / not met / unknown) and three result categories. The AI never decides eligibility. The checker only asks questions that some verified scheme's rules actually use.
- **Saved schemes**: stored in the browser (localStorage), with Undo.

## Security notes

- Secrets live only in environment variables, and AI calls happen server-side only.
- Every API validates input with Zod, and database access uses Prisma parameterised queries.
- AI and user text is never rendered as HTML.
- Rate limits apply to chat (15 per minute) and the other APIs, along with request size limits and a daily AI budget guard.
- CSP, frame, referrer and content-type headers are set, and logs contain no request bodies or user text.
- The in-memory rate limiter and budget guards work per server instance. Client identity comes from `x-real-ip` / `x-forwarded-for`, which platforms like Vercel set themselves; if you run behind your own proxy, make sure it overwrites them. For multi-instance production, move them to a shared store (Redis or Postgres).
- No system is unhackable, and this one has not had a professional security review.

## Known limitations and future work

- **Scheme data is unverified** until your team completes the verification steps above.
- Some things were not run in the build environment: the live AI chat (no API key there), the Playwright tests (browser download blocked), and Lighthouse. See `docs/TESTING.md`.
- `npm audit` reports 3 high findings. All are in Prisma's command-line config tooling (`@prisma/config` → `deepmerge-ts`), not in the website runtime. Fixing them requires Prisma 7, which changes the client setup, so it's planned as a follow-up.
- Should-have items not built yet: email/password auth, dashboard, scheme comparison, and thumbs up/down feedback. Could-have items not built: admin page, voice input, more languages, OTP.
- Checker explanations are templated (English/Hindi), not AI-generated.
- The UI uses native accessible HTML elements rather than shadcn/Radix.
=======
# Yojana-Sahayak
>>>>>>> ba4ee27f4a1eccb97bccdf37553f435f4161800f
