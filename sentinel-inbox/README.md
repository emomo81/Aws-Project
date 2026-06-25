# SentinelAI — Fraud Triage Inbox

A Gmail-style analyst workspace for reviewing and actioning flagged transactions,
built from the `SentinelAI Inbox` design handoff. Part of the SentinelAI fraud
platform (see the parent repo's `PRD.md`).

**Stack:** Next.js (App Router) · Supabase (Postgres + Auth + Realtime) · Render (hosting)

---

## Features (implemented)

- 📥 **Folders** — Alert queue, High risk, In review, Cleared, Confirmed fraud
- 🏷️ **Risk tabs** — All / High / Watch / Cleared with live counts
- 📊 **Transaction rows** — risk band chip, score bar, star, select, read/unread
- 🔍 **Case detail** — risk gauge, SHAP "why this was flagged" panel, full details grid
- ⚡ **Actions** — confirm fraud, mark safe, escalate (single + bulk), with **undo** snackbar
- ✉️ **Escalate modal** — pre-filled note to the risk manager
- 🔎 **Search** across TXN id / merchant / category / city
- 🎨 **Two themes** — Modern & Classic (toggle in the header)

The UI runs on mock data (`lib/seed.ts`) out of the box — no backend required to demo.

---

## Run locally

```bash
cd sentinel-inbox
npm install
cp .env.example .env.local   # optional for the mock; required for real data
npm run dev                  # http://localhost:3000
```

---

## Wire the real backend

### 1. Supabase (database + auth + realtime)
1. Create a project at [supabase.com](https://supabase.com).
2. SQL editor → run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy the Project URL + anon key into `.env.local`.
4. In `app/page.tsx` (a Server Component), fetch from Supabase and pass rows to `InboxApp`
   (see the commented `fetchQueue()` example in [`lib/supabase.ts`](lib/supabase.ts)).
5. For live updates, subscribe to the `transactions` Realtime channel inside `InboxApp`.

### 2. SageMaker scoring
The endpoint is proxied server-side at [`app/api/score/route.ts`](app/api/score/route.ts)
so AWS keys never reach the browser. Add the SDK and uncomment the block:

```bash
npm i @aws-sdk/client-sagemaker-runtime
```

Set `AWS_REGION`, `SAGEMAKER_ENDPOINT_NAME`, and AWS credentials in `.env.local`.

---

## Deploy on Render

1. Push this repo to GitHub.
2. Render → **New → Web Service** → connect the repo, root directory `sentinel-inbox`.
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm start`  (binds to Render's `$PORT`)
5. Add the environment variables from `.env.example` under **Environment**.
6. Deploy. Render gives you a public HTTPS URL.

> Supabase is your managed Postgres + Auth — no separate database service needed on Render.

---

## Project structure

```
sentinel-inbox/
├── app/
│   ├── layout.tsx          # fonts + root shell
│   ├── page.tsx            # renders InboxApp (Supabase fetch goes here)
│   ├── globals.css         # scrollbars + keyframes
│   └── api/score/route.ts  # SageMaker scoring proxy (server-side)
├── components/
│   ├── InboxApp.tsx        # the full inbox (list + detail + modal + snackbar)
│   └── ui.tsx              # Box (hover-aware styled element) + Icon + css() helper
├── lib/
│   ├── types.ts            # Txn / Band / Layout types
│   ├── seed.ts             # mock data + band()/money()/themeVars()
│   └── supabase.ts         # client + row→Txn mapper + example queries
└── supabase/schema.sql     # tables, RLS, realtime
```
