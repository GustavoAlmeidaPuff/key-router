import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://ffzwevrphnbyrdymduwn.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProxyKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
}

export interface OpenRouterKey {
  id: string;
  name: string;
  key: string;
  rate_limited_until: string | null;
  created_at: string;
  last_used_at: string | null;
  request_count: number;
  is_active: boolean;
}
