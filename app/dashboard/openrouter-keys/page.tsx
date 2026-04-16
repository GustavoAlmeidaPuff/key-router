"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/app/_components/Modal";
import { useToast } from "@/app/_components/ToastProvider";
import type { ActivityEvent, ActivityEventRow } from "@/lib/activityTypes";
import { rowToEvent } from "@/lib/activityTypes";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface OpenRouterKeyRow {
  id: string;
  name: string;
  key: string;
  suffix: string;
  is_active: boolean;
  request_count: number;
  rate_limited_until: string | null;
}

interface TestResult {
  success: boolean;
  latencyMs?: number;
  model?: string;
  error?: string;
  rateLimited?: boolean;
  rate_limited_until?: string;
}

export default function OpenRouterKeysPage() {
  const toast = useToast();
  const [keys, setKeys] = useState<OpenRouterKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [addName, setAddName] = useState("");
  const [addKey, setAddKey] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [testResults, setTestResults] = useState<Record<string, TestResult | "loading">>({});
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([]);
  const [sseConnected, setSseConnected] = useState(false);
  async function loadKeys(): Promise<OpenRouterKeyRow[]> {
    const r = await fetch("/api/internal/openrouter-keys");
    if (!r.ok) return [];
    const data = (await r.json()) as OpenRouterKeyRow[];
    setKeys(data);
    setLoading(false);
    return data;
  }

  async function addManual() {
    if (!addName || !addKey) return;
    setAddLoading(true);
    const r = await fetch("/api/internal/openrouter-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName, key: addKey }),
    });
    setAddLoading(false);
    if (r.ok) {
      toast("Key registrada!", "success");
      setAddName("");
      setAddKey("");
      setAddOpen(false);
      await loadKeys();
    } else {
      const err = (await r.json().catch(() => ({}))) as { error?: string };
      toast(err.error ?? "Erro ao registrar key", "error");
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remover a key "${name}"?`)) return;
    const r = await fetch(`/api/internal/openrouter-keys/${id}`, { method: "DELETE" });
    if (r.ok) { toast("Key removida", "success"); await loadKeys(); }
    else toast("Erro ao remover", "error");
  }

  async function toggleActive(row: OpenRouterKeyRow) {
    const r = await fetch(`/api/internal/openrouter-keys/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    if (r.ok) {
      toast(row.is_active ? "Key pausada" : "Key ativada", "success");
      await loadKeys();
    }
  }

  async function testKey(id: string) {
    setTestResults((prev) => ({ ...prev, [id]: "loading" }));
    const r = await fetch(`/api/internal/openrouter-keys/${id}/test`, { method: "POST" });
    const result = (await r.json()) as TestResult;
    setTestResults((prev) => ({ ...prev, [id]: result }));
    await loadKeys();
  }

  useEffect(() => { void loadKeys(); }, []);

  // Supabase Realtime — atividade em tempo real
  useEffect(() => {
    const sb = createSupabaseBrowserClient();

    // Carrega os últimos eventos ao montar
    void sb
      .from("activity_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setActivityLog((data as ActivityEventRow[]).map(rowToEvent));
      });

    const channel = sb
      .channel("activity_events_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_events" },
        (payload) => {
          const event = rowToEvent(payload.new as ActivityEventRow);
          setActivityLog((prev) => [event, ...prev].slice(0, 30));
          if (event.type === "using") {
            setActiveKeyId(event.keyId);
          } else if (event.type === "success" || event.type === "rate_limit_hit") {
            setActiveKeyId(null);
            void loadKeys();
          }
        },
      )
      .subscribe((status) => setSseConnected(status === "SUBSCRIBED"));

    return () => { void sb.removeChannel(channel); setSseConnected(false); };
  }, []);

  function getStatus(row: OpenRouterKeyRow) {
    const now = new Date();
    if (!row.is_active) return "inactive";
    // Se o último teste desta key detectou rate limit, mostra como limitada
    const lastTest = testResults[row.id];
    if (lastTest && lastTest !== "loading" && lastTest.rateLimited) return "limited";
    if (row.rate_limited_until && new Date(row.rate_limited_until) > now) return "limited";
    return "available";
  }

  const available = keys.filter((k) => getStatus(k) === "available").length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">OpenRouter Keys</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Registre uma key por conta do OpenRouter — o proxy rotaciona entre elas automaticamente
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          + Registrar key
        </button>
      </div>

      {/* Summary bar */}
      {keys.length > 0 && (
        <div className="flex items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-3 text-sm">
          <span className="text-zinc-400">
            <span className="font-semibold text-zinc-100">{keys.length}</span> keys registradas
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-400">
            <span className="font-semibold text-emerald-400">{available}</span> disponíveis agora
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-400">
            <span className="font-semibold text-zinc-100">
              {keys.reduce((s, k) => s + k.request_count, 0).toLocaleString("pt-BR")}
            </span> requests no total
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Nome / Conta</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Key</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Requests</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-600">
                  Carregando...
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm text-zinc-500">Nenhuma key registrada ainda.</p>
                  <p className="mt-1 text-xs text-zinc-700">
                    Crie contas no OpenRouter, pegue as API keys e registre aqui.
                  </p>
                  <button
                    onClick={() => setAddOpen(true)}
                    className="mt-3 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-4 py-1.5 text-xs text-indigo-400 hover:bg-indigo-600/30 transition-colors"
                  >
                    + Registrar primeira key
                  </button>
                </td>
              </tr>
            ) : (
              keys.map((row) => {
                const status = getStatus(row);
                const testResult = testResults[row.id];
                const isActive = activeKeyId === row.id;
                return (
                  <tr key={row.id} className={`transition-colors ${isActive ? "bg-indigo-950/40 border-l-2 border-l-indigo-500" : "hover:bg-zinc-900/30"}`}>
                    <td className="px-4 py-3 font-medium text-zinc-200">{row.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-zinc-500 font-mono">····{row.suffix}</code>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} rateLimitedUntil={row.rate_limited_until} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">
                      {row.request_count.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                        <button
                          onClick={() => void testKey(row.id)}
                          disabled={testResult === "loading"}
                          className={`rounded px-2 py-1 text-xs border transition-colors disabled:opacity-50 ${
                            testResult && testResult !== "loading"
                              ? testResult.success
                                ? "border-emerald-800 text-emerald-400"
                                : "border-red-900 text-red-400"
                              : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                          }`}
                        >
                          {testResult === "loading"
                            ? "..."
                            : testResult
                              ? testResult.success
                                ? `✓ ${testResult.latencyMs}ms`
                                : "✗ falhou"
                              : "Testar"}
                        </button>
                        </div>
                        {testResult && testResult !== "loading" && !testResult.success && testResult.error && (
                          <p className="text-[11px] text-red-400 max-w-xs truncate" title={testResult.error}>
                            {testResult.error}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                        <button
                          onClick={() => void toggleActive(row)}
                          className={`rounded px-2 py-1 text-xs border transition-colors ${
                            row.is_active
                              ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                              : "border-emerald-800 text-emerald-500 hover:bg-emerald-950"
                          }`}
                        >
                          {row.is_active ? "Pausar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => void remove(row.id, row.name)}
                          className="rounded px-2 py-1 text-xs text-red-500 border border-red-900/50 hover:bg-red-950/50 transition-colors"
                        >
                          Remover
                        </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Atividade em tempo real */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
          <span className={`h-2 w-2 rounded-full ${sseConnected ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
          <span className="text-xs font-medium text-zinc-400">Atividade em tempo real</span>
          {!sseConnected && <span className="text-[10px] text-zinc-600">desconectado</span>}
        </div>
        <div className="divide-y divide-zinc-800/40 max-h-48 overflow-y-auto">
          {activityLog.length === 0 ? (
            <p className="px-4 py-4 text-xs text-zinc-600">Aguardando requests...</p>
          ) : (
            activityLog.map((event, i) => (
              <ActivityRow key={i} event={event} />
            ))
          )}
        </div>
      </div>

      {/* Tip */}
      {keys.length > 0 && (
        <p className="text-xs text-zinc-700">
          💡 Quanto mais keys registradas, mais requests simultâneos você consegue antes de atingir rate limits.
        </p>
      )}

      {/* ── Modal: Registrar key ───────────────────────────────── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Registrar OpenRouter Key">
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500 leading-relaxed">
            Cole a API key da conta que deseja adicionar à rotação.
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">Nome</label>
              <input
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                placeholder="Nome para identificar esta key"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">API Key do OpenRouter</label>
              <input
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 font-mono focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                placeholder="Cole sua API key aqui"
                value={addKey}
                onChange={(e) => setAddKey(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => void addManual()}
              disabled={addLoading || !addName || !addKey}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
            >
              {addLoading ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function StatusBadge({ status, rateLimitedUntil: _rateLimitedUntil }: { status: string; rateLimitedUntil: string | null }) {
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Disponível
      </span>
    );
  }
  if (status === "limited") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        Rate limited
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
      Pausada
    </span>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const time = new Date(event.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  let icon: string;
  let text: string;
  let color: string;

  switch (event.type) {
    case "using":
      icon = "→";
      text = `Usando ${event.keyName}`;
      color = "text-indigo-400";
      break;
    case "success":
      icon = "✓";
      text = `${event.keyName} respondeu em ${event.latencyMs}ms`;
      color = "text-emerald-400";
      break;
    case "rate_limit_hit":
      icon = "⚠";
      text = `${event.keyName} atingiu rate limit — tentando outra`;
      color = "text-amber-400";
      break;
    case "retrying":
      icon = "↺";
      text = `Tentativa ${event.attempt + 1}...`;
      color = "text-zinc-400";
      break;
    case "no_keys":
      icon = "✗";
      text = "Nenhuma key disponível";
      color = "text-red-400";
      break;
    case "all_limited":
      icon = "✗";
      text = "Todas as keys em rate limit";
      color = "text-red-400";
      break;
  }

  const client = "clientName" in event ? event.clientName : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs">
      <span className="shrink-0 text-zinc-600 tabular-nums">{time}</span>
      <span className={`shrink-0 w-4 text-center font-mono ${color}`}>{icon}</span>
      <span className={color}>{text}</span>
      {client && (
        <span className="ml-auto shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
          {client}
        </span>
      )}
    </div>
  );
}
