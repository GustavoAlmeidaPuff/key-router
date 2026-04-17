export type RateLimitScope = "key" | "model" | "unknown";

export interface RateLimitInfo {
  isRateLimited: boolean;
  scope: RateLimitScope;
}

export function detectRateLimit(response: Response, bodyText?: string): RateLimitInfo {
  const status429 = response.status === 429;
  const bodyCode429 = extractBodyErrorCode(bodyText) === "429";

  if (!status429 && !bodyCode429) {
    return { isRateLimited: false, scope: "unknown" };
  }

  const message = extractBodyMessage(bodyText);
  let scope = classifyScope(message);

  // Header forte: se o OpenRouter disse que a key ficou sem requests, é escopo de conta.
  if (scope === "unknown" && response.headers.get("X-RateLimit-Remaining") === "0") {
    scope = "key";
  }

  return { isRateLimited: true, scope };
}

// Mantido por compatibilidade com código que só quer saber se é 429.
export function isRateLimitError(response: Response, bodyText?: string): boolean {
  return detectRateLimit(response, bodyText).isRateLimited;
}

export function extractRetryAfter(response: Response, bodyText?: string): number | null {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const parsed = Number(retryAfter);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  const resetAt = response.headers.get("X-RateLimit-Reset");
  if (resetAt) {
    const resetTs = Number(resetAt);
    if (!Number.isNaN(resetTs) && resetTs > 0) {
      // OpenRouter às vezes devolve em milissegundos
      const normalized = resetTs > 1e12 ? Math.floor(resetTs / 1000) : resetTs;
      const secondsUntilReset = normalized - Math.floor(Date.now() / 1000);
      if (secondsUntilReset > 0) return secondsUntilReset;
    }
  }

  const msg = extractBodyMessage(bodyText);
  if (msg.includes("per-day") || msg.includes("per day")) return secondsUntilMidnightUTC();
  if (msg.includes("per-hour") || msg.includes("per hour")) return 3600;
  if (msg.includes("per-minute") || msg.includes("per minute")) return 60;

  return null;
}

function classifyScope(message: string): RateLimitScope {
  if (!message) return "unknown";

  // Limites de conta/key
  if (
    message.includes("free-models-per-day") ||
    message.includes("free-models-per-minute") ||
    message.includes("per-day") ||
    message.includes("per day") ||
    message.includes("per-hour") ||
    message.includes("per hour") ||
    message.includes("per-minute") ||
    message.includes("per minute") ||
    message.includes("daily limit") ||
    message.includes("account")
  ) {
    return "key";
  }

  // Limites de modelo específico (upstream / provider)
  if (
    message.includes("for this model") ||
    message.includes("model is") ||
    message.includes("provider") ||
    message.includes("upstream") ||
    message.includes("temporarily")
  ) {
    return "model";
  }

  return "unknown";
}

function extractBodyMessage(bodyText?: string): string {
  if (!bodyText) return "";
  try {
    const parsed = JSON.parse(bodyText) as { error?: { message?: string } };
    return parsed.error?.message?.toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function extractBodyErrorCode(bodyText?: string): string | null {
  if (!bodyText) return null;
  try {
    const parsed = JSON.parse(bodyText) as { error?: { code?: number | string } };
    return parsed.error?.code !== undefined ? String(parsed.error.code) : null;
  } catch {
    return null;
  }
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
