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

export function extractRetryAfter(response: Response): number | null {
  const retryAfter = response.headers.get("Retry-After");
  if (!retryAfter) return null;
  const parsed = Number(retryAfter);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}
