/**
 * Schema Postgres onde ficam as tabelas deste app (proxy_keys, openrouter_keys, activity_events).
 * Deve ser o mesmo em servidor e cliente; use NEXT_PUBLIC_SUPABASE_SCHEMA para o browser.
 * No Dashboard Supabase: Settings → API → "Exposed schemas" deve incluir este schema.
 */
export const SUPABASE_SCHEMA =
  process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? process.env.SUPABASE_SCHEMA ?? "public";
