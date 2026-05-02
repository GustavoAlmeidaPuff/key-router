import { nanoid } from "nanoid";
import { validateProxyKey as validateProxyKeyDb } from "@/lib/firestore-data";

export function generateProxyKey(): string {
  return `sk-open-${nanoid(32)}`;
}

export async function validateProxyKey(key: string): Promise<{ id: string; name: string } | null> {
  return validateProxyKeyDb(key);
}

export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}
