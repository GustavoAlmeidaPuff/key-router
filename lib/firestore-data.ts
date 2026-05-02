import { FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import { firestoreDb } from "@/lib/firebase-admin";
import type { OpenRouterKey, ProxyKey } from "@/lib/db-types";

const COL_OPENROUTER = "openrouter_keys";
const COL_PROXY = "proxy_keys";
const COL_ACTIVITY = "activity_events";

function db() {
  return firestoreDb();
}

function toIso(v: unknown): string {
  if (typeof v === "string") return v;
  if (
    v &&
    typeof v === "object" &&
    "toDate" in v &&
    typeof (v as { toDate: () => Date }).toDate === "function"
  ) {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

export async function releaseExpiredRateLimits(): Promise<void> {
  const now = new Date().toISOString();
  const snap = await db().collection(COL_OPENROUTER).get();
  const batch = db().batch();
  let n = 0;
  for (const doc of snap.docs) {
    const r = doc.get("rate_limited_until") as string | null | undefined;
    if (r && r <= now) {
      batch.update(doc.ref, { rate_limited_until: null });
      n++;
    }
  }
  if (n > 0) await batch.commit();
}

export async function getAvailableKey(): Promise<OpenRouterKey | null> {
  await releaseExpiredRateLimits();

  const snap = await db().collection(COL_OPENROUTER).where("is_active", "==", true).get();
  const now = Date.now();
  const list: OpenRouterKey[] = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const rateLimitedUntil = d.rate_limited_until as string | null | undefined;
    if (rateLimitedUntil && new Date(rateLimitedUntil).getTime() > now) continue;
    list.push({
      id: doc.id,
      name: d.name as string,
      key: d.key as string,
      rate_limited_until: (d.rate_limited_until as string | null) ?? null,
      created_at: toIso(d.created_at),
      last_used_at: (d.last_used_at as string | null) ?? null,
      request_count: (d.request_count as number) ?? 0,
      is_active: (d.is_active as boolean) ?? true,
    });
  }
  list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return list[0] ?? null;
}

export async function markAsRateLimited(
  keyId: string,
  retryAfterSeconds?: number,
): Promise<void> {
  const seconds = retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : 60;
  const until = new Date(Date.now() + seconds * 1000).toISOString();
  await db().collection(COL_OPENROUTER).doc(keyId).update({ rate_limited_until: until });
}

export async function touchOpenRouterKeyUsage(keyId: string): Promise<void> {
  await db()
    .collection(COL_OPENROUTER)
    .doc(keyId)
    .update({
      last_used_at: new Date().toISOString(),
      request_count: FieldValue.increment(1),
    });
}

export async function clearOpenRouterKeyRateLimit(keyId: string): Promise<void> {
  await db().collection(COL_OPENROUTER).doc(keyId).update({ rate_limited_until: null });
}

export async function getOpenRouterKeySecret(
  id: string,
): Promise<{ key: string } | null> {
  const doc = await db().collection(COL_OPENROUTER).doc(id).get();
  if (!doc.exists) return null;
  return { key: doc.get("key") as string };
}

export async function listOpenRouterKeys(): Promise<OpenRouterKey[]> {
  const snap = await db()
    .collection(COL_OPENROUTER)
    .orderBy("created_at", "desc")
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name as string,
      key: d.key as string,
      rate_limited_until: (d.rate_limited_until as string | null) ?? null,
      created_at: toIso(d.created_at),
      last_used_at: (d.last_used_at as string | null) ?? null,
      request_count: (d.request_count as number) ?? 0,
      is_active: (d.is_active as boolean) ?? true,
    };
  });
}

export async function insertOpenRouterKey(
  name: string,
  key: string,
): Promise<OpenRouterKey> {
  const dup = await db().collection(COL_OPENROUTER).where("key", "==", key).limit(1).get();
  if (!dup.empty) {
    const err = new Error("duplicate_key") as Error & { code?: string };
    err.code = "23505";
    throw err;
  }
  const id = nanoid();
  const created_at = new Date().toISOString();
  const row: Omit<OpenRouterKey, "id"> = {
    name,
    key,
    rate_limited_until: null,
    created_at,
    last_used_at: null,
    request_count: 0,
    is_active: true,
  };
  await db().collection(COL_OPENROUTER).doc(id).set(row);
  return { id, ...row };
}

export async function insertOpenRouterKeySimple(input: {
  name: string;
  key: string;
}): Promise<void> {
  const dup = await db().collection(COL_OPENROUTER).where("key", "==", input.key).limit(1).get();
  if (!dup.empty) return;
  const id = nanoid();
  const created_at = new Date().toISOString();
  await db()
    .collection(COL_OPENROUTER)
    .doc(id)
    .set({
      name: input.name,
      key: input.key,
      rate_limited_until: null,
      created_at,
      last_used_at: null,
      request_count: 0,
      is_active: true,
    });
}

export async function patchOpenRouterKey(
  id: string,
  update: Record<string, unknown>,
): Promise<OpenRouterKey | null> {
  const ref = db().collection(COL_OPENROUTER).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  await ref.update(update);
  const next = await ref.get();
  const d = next.data()!;
  return {
    id: next.id,
    name: d.name as string,
    key: d.key as string,
    rate_limited_until: (d.rate_limited_until as string | null) ?? null,
    created_at: toIso(d.created_at),
    last_used_at: (d.last_used_at as string | null) ?? null,
    request_count: (d.request_count as number) ?? 0,
    is_active: (d.is_active as boolean) ?? true,
  };
}

export async function deleteOpenRouterKey(id: string): Promise<void> {
  await db().collection(COL_OPENROUTER).doc(id).delete();
}

export async function listProxyKeys(): Promise<ProxyKey[]> {
  const snap = await db().collection(COL_PROXY).orderBy("created_at", "desc").get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name as string,
      key: d.key as string,
      created_at: toIso(d.created_at),
      last_used_at: (d.last_used_at as string | null) ?? null,
    };
  });
}

export async function insertProxyKey(name: string, rawKey: string): Promise<ProxyKey> {
  const id = nanoid();
  const created_at = new Date().toISOString();
  const row: Omit<ProxyKey, "id"> = {
    name,
    key: rawKey,
    created_at,
    last_used_at: null,
  };
  await db().collection(COL_PROXY).doc(id).set(row);
  return { id, ...row };
}

export async function deleteProxyKey(id: string): Promise<void> {
  await db().collection(COL_PROXY).doc(id).delete();
}

export async function validateProxyKey(
  key: string,
): Promise<{ id: string; name: string } | null> {
  const snap = await db().collection(COL_PROXY).where("key", "==", key).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  const id = doc.id;
  await doc.ref.update({ last_used_at: new Date().toISOString() });
  return { id, name: doc.get("name") as string };
}

type ActivityPayload = {
  type: string;
  key_id?: string | null;
  key_name?: string | null;
  client_name?: string | null;
  latency_ms?: number | null;
  attempt?: number | null;
};

export async function insertActivityEvent(event: ActivityPayload): Promise<void> {
  const created_at = new Date().toISOString();
  await db().collection(COL_ACTIVITY).add({
    ...event,
    created_at,
  });

  const cutoff = new Date(Date.now() - 3_600_000).toISOString();
  const old = await db().collection(COL_ACTIVITY).where("created_at", "<", cutoff).get();
  const batch = db().batch();
  old.docs.forEach((d) => batch.delete(d.ref));
  if (!old.empty) await batch.commit();
}
