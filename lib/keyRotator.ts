import { supabase, type OpenRouterKey } from "@/lib/supabase";

let roundRobinIndex = 0;

export async function releaseExpiredRateLimits(): Promise<void> {
  await supabase
    .from("openrouter_keys")
    .update({ rate_limited_until: null })
    .lt("rate_limited_until", new Date().toISOString());
}

export async function getAvailableKey(): Promise<OpenRouterKey | null> {
  await releaseExpiredRateLimits();

  const { data: keys } = await supabase
    .from("openrouter_keys")
    .select("*")
    .eq("is_active", true)
    .or(`rate_limited_until.is.null,rate_limited_until.lt.${new Date().toISOString()}`)
    .order("created_at", { ascending: true });

  if (!keys || keys.length === 0) return null;

  const selected = keys[roundRobinIndex % keys.length] as OpenRouterKey;
  roundRobinIndex = (roundRobinIndex + 1) % keys.length;
  return selected;
}

export async function markAsRateLimited(
  keyId: string,
  retryAfterSeconds?: number,
): Promise<void> {
  const seconds = retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : 60;
  const until = new Date(Date.now() + seconds * 1000).toISOString();
  await supabase
    .from("openrouter_keys")
    .update({ rate_limited_until: until })
    .eq("id", keyId);
}
