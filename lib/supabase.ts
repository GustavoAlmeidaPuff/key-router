import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SCHEMA } from "@/lib/supabase-schema";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://juqxwrwarvzkfhszskwo.supabase.co";

let serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY não definida. Settings → API → service_role no Supabase.",
      );
    }
    serviceClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

/** Cliente PostgREST escopado ao schema deste projeto (side projects no mesmo Supabase). */
export function db() {
  return getServiceClient().schema(SUPABASE_SCHEMA);
}

// ── Types (colunas snake_case do Postgres) ─────────────────────────────────

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
