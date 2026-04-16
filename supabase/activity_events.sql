CREATE TABLE IF NOT EXISTS activity_events (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type      text NOT NULL,
  key_id    uuid,
  key_name  text,
  client_name text,
  latency_ms  integer,
  attempt     integer,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE activity_events DISABLE ROW LEVEL SECURITY;

-- Habilita Realtime para esta tabela
ALTER PUBLICATION supabase_realtime ADD TABLE activity_events;
