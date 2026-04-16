import type { OpenRouterKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let roundRobinIndex = 0;

export async function releaseExpiredRateLimits(): Promise<void> {
  await prisma.openRouterKey.updateMany({
    where: { rateLimitedUntil: { lt: new Date() } },
    data: { rateLimitedUntil: null },
  });
}

export async function getAvailableKey(): Promise<OpenRouterKey | null> {
  await releaseExpiredRateLimits();

  const keys = await prisma.openRouterKey.findMany({
    where: {
      isActive: true,
      OR: [{ rateLimitedUntil: null }, { rateLimitedUntil: { lt: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
  });

  if (keys.length === 0) return null;

  const selected = keys[roundRobinIndex % keys.length];
  roundRobinIndex = (roundRobinIndex + 1) % keys.length;
  return selected;
}

export async function markAsRateLimited(
  keyId: string,
  retryAfterSeconds?: number,
): Promise<void> {
  const seconds = retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : 60;
  const until = new Date(Date.now() + seconds * 1000);
  await prisma.openRouterKey.update({
    where: { id: keyId },
    data: { rateLimitedUntil: until },
  });
}
