import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

export function generateProxyKey(): string {
  return `sk-proxy-${nanoid(32)}`;
}

export async function validateProxyKey(key: string): Promise<boolean> {
  const { data } = await supabase
    .from("proxy_keys")
    .select("id")
    .eq("key", key)
    .single();

  if (!data) return false;

  await supabase
    .from("proxy_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return true;
}

export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}
