import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

export function generateProxyKey(): string {
  return `sk-proxy-${nanoid(32)}`;
}

export async function validateProxyKey(key: string): Promise<boolean> {
  const found = await prisma.proxyKey.findUnique({ where: { key } });
  if (!found) return false;

  await prisma.proxyKey.update({
    where: { id: found.id },
    data: { lastUsedAt: new Date() },
  });

  return true;
}

export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}
