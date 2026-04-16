export type ActivityEvent =
  | { type: "using"; keyId: string; keyName: string; ts: number }
  | { type: "success"; keyId: string; keyName: string; latencyMs: number; ts: number }
  | { type: "rate_limit_hit"; keyId: string; keyName: string; ts: number }
  | { type: "retrying"; attempt: number; ts: number }
  | { type: "no_keys"; ts: number }
  | { type: "all_limited"; ts: number };

type Subscriber = (event: ActivityEvent) => void;

// Persiste no globalThis para sobreviver a hot-reloads do Next.js dev
const g = globalThis as typeof globalThis & {
  __activitySubscribers?: Set<Subscriber>;
};
if (!g.__activitySubscribers) g.__activitySubscribers = new Set();

export function emitActivity(event: Omit<ActivityEvent, "ts">): void {
  const full = { ...event, ts: Date.now() } as ActivityEvent;
  g.__activitySubscribers!.forEach((cb) => {
    try { cb(full); } catch { /* subscriber desconectado */ }
  });
}

export function subscribeToActivity(cb: Subscriber): () => void {
  g.__activitySubscribers!.add(cb);
  return () => g.__activitySubscribers!.delete(cb);
}
