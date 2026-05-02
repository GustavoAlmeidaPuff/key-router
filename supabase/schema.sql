-- OpenRouter Key Router — tabelas no schema `public`
-- Se vários apps compartilham o mesmo projeto, use `supabase/schema-in-schema.sql` e
-- defina NEXT_PUBLIC_SUPABASE_SCHEMA / SUPABASE_SCHEMA (ex.: key_router) e exponha o schema em Settings → API.
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
