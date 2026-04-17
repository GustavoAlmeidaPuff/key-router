// Server-only — não importar em client components
import { after } from "next/server";
import { supabase } from "@/lib/supabase";
import type { ActivityEvent } from "@/lib/activityTypes";

export type { ActivityEvent, ActivityEventRow } from "@/lib/activityTypes";
export { rowToEvent } from "@/lib/activityTypes";

type AnyEvent = {
  type: string;
  keyId?: string;
  keyName?: string;
  clientName?: string;
  latencyMs?: number;
  attempt?: number;
};

// Em serverless (Vercel), fire-and-forget é descartado quando a função termina.
// `after()` estende o lifetime da invocação até o insert completar.
export function emitActivity(event: AnyEvent): void {
  after(async () => {
    await supabase.from("activity_events").insert({
      type: event.type,
      key_id: event.keyId ?? null,
      key_name: event.keyName ?? null,
      client_name: event.clientName ?? null,
      latency_ms: event.latencyMs ?? null,
      attempt: event.attempt ?? null,
    });

    await supabase
      .from("activity_events")
      .delete()
      .lt("created_at", new Date(Date.now() - 3_600_000).toISOString());
  });
}
