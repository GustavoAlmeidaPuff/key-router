"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_SCHEMA } from "@/lib/supabase-schema";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://juqxwrwarvzkfhszskwo.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** OAuth, sessão e `auth.*` — não use `.schema()` aqui (senão some `auth`). */
export function createSupabaseBrowserAuthClient() {
  return createBrowserClient(url, anonKey);
}

/** Tabelas do app em `SUPABASE_SCHEMA` (proxy_keys, openrouter_keys, activity_events). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(url, anonKey).schema(SUPABASE_SCHEMA);
}
