export function isRateLimitError(response: Response, bodyText?: string): boolean {
  if (response.status === 429) return true;

  const remaining = response.headers.get("X-RateLimit-Remaining");
  if (remaining === "0") return true;

  if (!bodyText) return false;
  try {
    const parsed = JSON.parse(bodyText) as { error?: { code?: number | string } };
    return String(parsed.error?.code) === "429";
  } catch {
    return false;
  }
}

export function extractRetryAfter(response: Response, bodyText?: string): number | null {
  // 1. Header Retry-After (segundos)
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const parsed = Number(retryAfter);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  // 2. Header X-RateLimit-Reset (Unix timestamp em segundos)
  const resetAt = response.headers.get("X-RateLimit-Reset");
  if (resetAt) {
    const resetTs = Number(resetAt);
    if (!Number.isNaN(resetTs) && resetTs > 0) {
      const secondsUntilReset = resetTs - Math.floor(Date.now() / 1000);
      if (secondsUntilReset > 0) return secondsUntilReset;
    }
  }

  // 3. Deduzir pelo tipo de limite no corpo da resposta
  if (bodyText) {
    try {
      const parsed = JSON.parse(bodyText) as { error?: { message?: string } };
      const msg = parsed.error?.message?.toLowerCase() ?? "";

      if (msg.includes("per-day") || msg.includes("per day")) {
        // Limite diário: segundos até meia-noite UTC
        return secondsUntilMidnightUTC();
      }
      if (msg.includes("per-hour") || msg.includes("per hour")) {
        return 3600;
      }
      if (msg.includes("per-minute") || msg.includes("per minute")) {
        return 60;
      }
    } catch {
      // ignorar
    }
  }

  return null;
}

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0,
  ));
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}
