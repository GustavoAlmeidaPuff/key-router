// Tipos e helpers puros — sem imports server-only, seguro para client components

export type ActivityEvent =
  | { type: "using"; keyId: string; keyName: string; clientName: string; ts: number }
  | { type: "success"; keyId: string; keyName: string; clientName: string; latencyMs: number; ts: number }
  | { type: "rate_limit_hit"; keyId: string; keyName: string; clientName: string; ts: number }
  | { type: "retrying"; attempt: number; clientName: string; ts: number }
  | { type: "no_keys"; clientName: string; ts: number }
  | { type: "all_limited"; clientName: string; ts: number };

export type ActivityEventRow = {
  id: string;
  type: string;
  key_id: string | null;
  key_name: string | null;
  client_name: string | null;
  latency_ms: number | null;
  attempt: number | null;
  created_at: string;
};

export function rowToEvent(row: ActivityEventRow): ActivityEvent {
  const ts = new Date(row.created_at).getTime();
  switch (row.type) {
    case "using":
      return { type: "using", keyId: row.key_id!, keyName: row.key_name!, clientName: row.client_name!, ts };
    case "success":
      return { type: "success", keyId: row.key_id!, keyName: row.key_name!, clientName: row.client_name!, latencyMs: row.latency_ms!, ts };
    case "rate_limit_hit":
      return { type: "rate_limit_hit", keyId: row.key_id!, keyName: row.key_name!, clientName: row.client_name!, ts };
    case "retrying":
      return { type: "retrying", attempt: row.attempt!, clientName: row.client_name!, ts };
    case "no_keys":
      return { type: "no_keys", clientName: row.client_name!, ts };
    default:
      return { type: "all_limited", clientName: row.client_name!, ts };
  }
}
