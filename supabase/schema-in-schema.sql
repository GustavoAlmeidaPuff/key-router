-- Key Router em um schema dedicado (vários side projects no mesmo projeto Supabase).
-- 1) Ajuste o nome do schema se quiser (e alinhe NEXT_PUBLIC_SUPABASE_SCHEMA / SUPABASE_SCHEMA no .env).
-- 2) SQL Editor → executar este script.
-- 3) Project Settings → API → "Exposed schemas" → adicione o mesmo nome de schema.
-- 4) Realtime: em Database → Publications, ou execute o ADD TABLE abaixo (pode exigir replica identity).

CREATE SCHEMA IF NOT EXISTS key_router;

CREATE TABLE key_router.proxy_keys (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  key          text        UNIQUE NOT NULL,
  created_at   timestamptz DEFAULT now(),
  last_used_at timestamptz
);

CREATE TABLE key_router.openrouter_keys (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text        NOT NULL,
  key                text        UNIQUE NOT NULL,
  rate_limited_until timestamptz,
  created_at         timestamptz DEFAULT now(),
  last_used_at       timestamptz,
  request_count      integer     DEFAULT 0,
  is_active          boolean     DEFAULT true
);

CREATE TABLE key_router.activity_events (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type          text        NOT NULL,
  key_id        uuid,
  key_name      text,
  client_name   text,
  latency_ms    integer,
  attempt       integer,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE key_router.proxy_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_router.openrouter_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE key_router.activity_events DISABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE key_router.activity_events;
