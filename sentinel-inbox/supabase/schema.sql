-- SentinelAI — Supabase schema for the fraud triage inbox.
-- Run in the Supabase SQL editor (Dashboard → SQL → New query).

create type txn_status as enum ('new', 'review', 'cleared', 'fraud');

create table if not exists transactions (
  txn_id       text primary key,
  merchant     text not null,
  amount       numeric(12,2) not null,
  category     text,
  fraud_score  numeric(4,3) not null check (fraud_score between 0 and 1),
  status       txn_status not null default 'new',
  txn_time     text,                       -- display time e.g. '10:42'
  occurred_at  timestamptz not null default now(),
  city         text,
  country      text,
  card_last4   text,
  device       text,
  channel      text,
  feats        jsonb default '[]'::jsonb,  -- SHAP attributions: [["name", 34, "up"], ...]
  starred      boolean not null default false,
  read         boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_txn_status on transactions (status);
create index if not exists idx_txn_score  on transactions (fraud_score desc);

-- Analyst actions audit trail (feeds retraining + accountability).
create table if not exists analyst_actions (
  id         bigint generated always as identity primary key,
  txn_id     text references transactions (txn_id),
  analyst    text,
  action     text not null,               -- 'confirm_fraud' | 'mark_safe' | 'escalate'
  note       text,
  created_at timestamptz not null default now()
);

-- Row-Level Security: only authenticated analysts can read/update.
alter table transactions   enable row level security;
alter table analyst_actions enable row level security;

create policy "authenticated read"   on transactions
  for select using (auth.role() = 'authenticated');
create policy "authenticated update" on transactions
  for update using (auth.role() = 'authenticated');
create policy "authenticated insert actions" on analyst_actions
  for insert with check (auth.role() = 'authenticated');

-- Realtime: let the inbox subscribe to live transaction changes.
alter publication supabase_realtime add table transactions;
