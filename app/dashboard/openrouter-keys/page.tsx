"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/app/_components/Modal";
import { useToast } from "@/app/_components/ToastProvider";

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

  async function loadKeys() {
    const r = await fetch("/api/internal/openrouter-keys");
    if (!r.ok) return;
    setKeys(await r.json());
    setLoading(false);
  }

  useEffect(() => { void loadKeys(); }, []);

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
  }

  function getStatus(row: OpenRouterKeyRow) {
    const now = new Date();
    if (!row.is_active) return "inactive";
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
                return (
                  <tr key={row.id} className="hover:bg-zinc-900/30 transition-colors">
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void testKey(row.id)}
                          disabled={testResult === "loading"}
                          className="rounded px-2 py-1 text-xs text-zinc-400 border border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50 transition-colors"
                        >
                          {testResult === "loading"
                            ? "..."
                            : testResult
                              ? testResult.success
                                ? `✓ ${testResult.latencyMs}ms`
                                : "✗ falhou"
                              : "Testar"}
                        </button>
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
            Crie uma conta em{" "}
            <span className="text-zinc-300">openrouter.ai</span>, gere uma API key gratuita em{" "}
            <span className="text-zinc-300">openrouter.ai/settings/keys</span> e cole aqui.
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">Nome (ex: Conta 1, Alt email)</label>
              <input
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                placeholder="Conta pessoal"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-400">API Key do OpenRouter</label>
              <input
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 font-mono focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                placeholder="sk-or-v1-..."
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

function StatusBadge({ status, rateLimitedUntil }: { status: string; rateLimitedUntil: string | null }) {
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Disponível
      </span>
    );
  }
  if (status === "limited") {
    const until = rateLimitedUntil ? new Date(rateLimitedUntil).toLocaleTimeString("pt-BR") : "";
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400" title={`Reset às ${until}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Rate limit · {until}
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
