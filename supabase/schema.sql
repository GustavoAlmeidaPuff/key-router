-- OpenRouter Key Rotator — Supabase Schema
-- Execute este SQL no Supabase Dashboard: https://supabase.com/dashboard
-- Project → SQL Editor → New query

-- ── Proxy Keys ─────────────────────────────────────────────────────────────
-- Keys usadas pelos clientes para acessar o proxy (formato sk-proxy-xxx)
CREATE TABLE IF NOT EXISTS proxy_keys (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  key          text        UNIQUE NOT NULL,
  created_at   timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- ── OpenRouter Keys ────────────────────────────────────────────────────────
-- Keys do OpenRouter usadas internamente para rotacionar requests
CREATE TABLE IF NOT EXISTS openrouter_keys (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text        NOT NULL,
  key                text        UNIQUE NOT NULL,
  rate_limited_until timestamptz,
  created_at         timestamptz DEFAULT now(),
  last_used_at       timestamptz,
  request_count      integer     DEFAULT 0,
  is_active          boolean     DEFAULT true
);

-- ── Disable Row Level Security (acesso via service role) ───────────────────
ALTER TABLE proxy_keys     DISABLE ROW LEVEL SECURITY;
ALTER TABLE openrouter_keys DISABLE ROW LEVEL SECURITY;
