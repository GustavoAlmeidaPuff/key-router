import type { OpenRouterKey } from "@/lib/db-types";
import {
  getAvailableKey as getAvailableKeyDb,
  markAsRateLimited as markAsRateLimitedDb,
} from "@/lib/firestore-data";

export async function getAvailableKey(): Promise<OpenRouterKey | null> {
  return getAvailableKeyDb();
}

export async function markAsRateLimited(
  keyId: string,
  retryAfterSeconds?: number,
): Promise<void> {
  return markAsRateLimitedDb(keyId, retryAfterSeconds);
}
