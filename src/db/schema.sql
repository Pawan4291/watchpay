-- WatchPay Database Schema
-- Supabase Postgres (free tier)
-- Run via Supabase dashboard → SQL Editor

-- ─────────────────────────────────────────────────────────────
-- USERS
-- Stores real Sphere wallet identity (nametag + address)
-- Populated via ConnectClient auth flow (POST /api/auth/connect)
-- ─────────────────────────────────────────────────────────────
create table users (
  id uuid primary key default gen_random_uuid(),
  real_nametag text unique not null,       -- @alice (real Sphere wallet nametag)
  real_sphere_address text not null,       -- DIRECT://... (real wallet address)
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- APP WALLETS
-- Per-user custodial wallet for silent billing.
-- Mnemonic is AES-256-GCM encrypted server-side before storage.
-- Architecture disclosure: custodial for billing, real wallet
-- stays user-controlled for deposit/withdraw only.
-- ─────────────────────────────────────────────────────────────
create table app_wallets (
  user_id uuid references users(id) primary key,
  address text not null,                  -- DIRECT:// L3 address
  nametag text unique not null,           -- @watchpay_alice (app wallet nametag on Nostr)
  mnemonic_encrypted text not null,       -- AES-256-GCM encrypted mnemonic
  balance numeric default 0              -- Cached balance (synced from on-chain via getBalance())
);

-- ─────────────────────────────────────────────────────────────
-- VIDEOS
-- Creator uploads. coin_id is hardcoded to UCT.
-- ─────────────────────────────────────────────────────────────
create table videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references users(id),
  title text not null,
  url text not null,                       -- YouTube embed or direct MP4 URL
  rate_per_30s numeric not null,           -- UCT amount per 30-second tick
  coin_id text not null default 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0',
  description text,
  category text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- WATCH SESSIONS
-- Tracks active viewing; ticks accumulate here.
-- ended_at is null while session is active.
-- ─────────────────────────────────────────────────────────────
create table watch_sessions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id),
  viewer_id uuid references users(id),
  started_at timestamptz default now(),
  ended_at timestamptz,                    -- null = still active
  total_ticks int default 0,
  total_spent numeric default 0            -- total UCT deducted for this session
);

-- ─────────────────────────────────────────────────────────────
-- PENDING SETTLEMENTS
-- Running balance of what each creator is owed.
-- The settlement agent drains this and resets to 0 after on-chain TX.
-- NOTE: Simplified for testnet — agent settles from a pool wallet.
-- See README for the funding source architecture tradeoff.
-- ─────────────────────────────────────────────────────────────
create table pending_settlements (
  creator_id uuid references users(id) primary key,
  amount_owed numeric default 0,
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- SETTLEMENTS
-- Immutable record of every on-chain settlement.
-- tx_id comes directly from sphere.payments.send() result.
-- ─────────────────────────────────────────────────────────────
create table settlements (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references users(id),
  amount numeric not null,
  tx_id text not null,                     -- Real tx_id from TransferResult.id
  memo text,                               -- e.g. "Watch payment settlement — 0.04320000 UCT"
  timestamp timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- AGENT LOG
-- Public, verifiable audit trail for all agent actions.
-- Visible at /agent-activity (no auth required).
-- ─────────────────────────────────────────────────────────────
create table agent_log (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,              -- 'settlement' | 'balance_check'
  details jsonb not null,                 -- { creator_nametag, amount, tx_id, ... }
  timestamp timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
create index on watch_sessions(viewer_id, ended_at);
create index on watch_sessions(video_id);
create index on settlements(creator_id, timestamp desc);
create index on agent_log(timestamp desc);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (enable for production)
-- ─────────────────────────────────────────────────────────────
-- alter table users enable row level security;
-- alter table app_wallets enable row level security;
-- alter table videos enable row level security;
-- alter table watch_sessions enable row level security;
-- alter table settlements enable row level security;
-- alter table agent_log enable row level security;

-- agent_log is public (no auth required for reads):
-- create policy "Public read agent_log" on agent_log for select using (true);
