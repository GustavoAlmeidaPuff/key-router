"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/app/_components/Modal";
import { CopyButton } from "@/app/_components/CopyButton";
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

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);

  // Add form
  const [addName, setAddName] = useState("");
  const [addKey, setAddKey] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Create form
  const [createName, setCreateName] = useState("");
  const [createLimit, setCreateLimit] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Test results
  const [testResults, setTestResults] = useState<Record<string, TestResult | "loading">>({});

  async function loadKeys() {
    const r = await fetch("/api/internal/openrouter-keys");
    if (!r.ok) return;
    setKeys(await r.json());
    setLoading(false);
  }

  useEffect(() => {
    void loadKeys();
  }, []);

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
      toast("Key adicionada com sucesso!", "success");
      setAddName("");
      setAddKey("");
      setAddOpen(false);
      await loadKeys();
    } else {
      const err = (await r.json().catch(() => ({}))) as { error?: string };
      toast(err.error ?? "Erro ao adicionar key", "error");
    }
  }

  async function createViaApi() {
    if (!createName) return;
    setCreateLoading(true);
    const r = await fetch("/api/internal/openrouter-keys/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName,
        limit: createLimit ? Number(createLimit) : undefined,
      }),
    });
    setCreateLoading(false);
    if (r.ok) {
      const payload = (await r.json()) as { key?: string };
      setRevealKey(payload.key ?? null);
      setCreateName("");
      setCreateLimit("");
      setCreateOpen(false);
      await loadKeys();
    } else {
      const err = (await r.json().catch(() => ({}))) as { error?: string };
      toast(err.error ?? "Erro ao criar key", "error");
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remover a key "${name}"?`)) return;
    const r = await fetch(`/api/internal/openrouter-keys/${id}`, { method: "DELETE" });
    if (r.ok) {
      toast("Key removida", "success");
      await loadKeys();
    } else {
      toast("Erro ao remover key", "error");
    }
  }

  async function toggleActive(row: OpenRouterKeyRow) {
    const r = await fetch(`/api/internal/openrouter-keys/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !row.is_active }),
    });
    if (r.ok) {
      toast(row.is_active ? "Key desativada" : "Key ativada", "success");
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

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">OpenRouter Keys</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Keys usadas internamente para roteamento
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            + Adicionar
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            ✦ Criar via OpenRouter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Nome</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Key</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Requests</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-600">
                  Carregando...
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-600">
                  Nenhuma key cadastrada ainda.{" "}
                  <button onClick={() => setAddOpen(true)} className="text-indigo-400 hover:underline">
                    Adicionar uma
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
                      <code className="text-xs text-zinc-500 font-mono">
                        ····{row.suffix}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={status}
                        rateLimitedUntil={row.rate_limited_until}
                      />
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">
                      {row.request_count.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Test button */}
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
                                : "✗ erro"
                              : "Testar"}
                        </button>
                        {/* Toggle */}
                        <button
                          onClick={() => void toggleActive(row)}
                          className={`rounded px-2 py-1 text-xs border transition-colors ${
                            row.is_active
                              ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                              : "border-emerald-800 text-emerald-500 hover:bg-emerald-950"
                          }`}
                        >
                          {row.is_active ? "Desativar" : "Ativar"}
                        </button>
                        {/* Delete */}
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

      {/* ── Modal: Adicionar manualmente ────────────────────────── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar OpenRouter Key">
        <div className="space-y-3">
          <Field label="Nome" placeholder="Ex: Conta pessoal">
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              placeholder="Ex: Conta pessoal"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
            />
          </Field>
          <Field label="API Key">
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 font-mono focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              placeholder="sk-or-v1-..."
              value={addKey}
              onChange={(e) => setAddKey(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
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
              {addLoading ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Criar via OpenRouter ─────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Criar key no OpenRouter"
      >
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            Requer <code className="text-zinc-400">OPENROUTER_MASTER_KEY</code> configurada no servidor.
          </p>
          <Field label="Nome da key">
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              placeholder="Ex: Bot secundário"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
          </Field>
          <Field label="Limite de crédito em USD (0 = sem limite)">
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              placeholder="0"
              type="number"
              min="0"
              step="0.01"
              value={createLimit}
              onChange={(e) => setCreateLimit(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => void createViaApi()}
              disabled={createLoading || !createName}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
            >
              {createLoading ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Revelar nova key ─────────────────────────────── */}
      <Modal
        open={!!revealKey}
        onClose={() => setRevealKey(null)}
        title="Key criada com sucesso"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-xs font-medium text-amber-400">
              ⚠ Anote esta key agora — ela não será mostrada novamente
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
            <code className="break-all text-sm text-zinc-200 font-mono">{revealKey}</code>
          </div>
          <div className="flex justify-end gap-2">
            <CopyButton value={revealKey ?? ""} label="Copiar key" />
            <button
              onClick={() => setRevealKey(null)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({
  status,
  rateLimitedUntil,
}: {
  status: "available" | "limited" | "inactive";
  rateLimitedUntil: string | null;
}) {
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
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400"
        title={`Reset às ${until}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Rate limit · {until}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
      Inativa
    </span>
  );
}

function Field({ label, children }: { label: string; placeholder?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
