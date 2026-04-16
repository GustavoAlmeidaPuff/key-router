import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

export function generateProxyKey(): string {
  return `sk-open-${nanoid(32)}`;
}

export async function validateProxyKey(key: string): Promise<{ id: string; name: string } | null> {
  const { data } = await supabase
    .from("proxy_keys")
    .select("id, name")
    .eq("key", key)
    .single();

  if (!data) return null;

  await supabase
    .from("proxy_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { id: data.id as string, name: data.name as string };
}

export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}
