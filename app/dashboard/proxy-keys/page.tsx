"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/app/_components/Modal";
import { CopyButton } from "@/app/_components/CopyButton";
import { useToast } from "@/app/_components/ToastProvider";

interface ProxyKeyRow {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at: string | null;
}

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_PROXY_URL ?? "http://localhost:3000";

export default function ProxyKeysPage() {
  const toast = useToast();
  const [keys, setKeys] = useState<ProxyKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/internal/proxy-keys");
    if (!r.ok) return;
    setKeys(await r.json());
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function create() {
    setCreating(true);
    const r = await fetch("/api/internal/proxy-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    if (r.ok) {
      const payload = (await r.json()) as { key?: string };
      setNewKey(payload.key ?? null);
      setName("");
      setCreateOpen(false);
      toast("Open Key criada!", "success");
      await load();
    } else {
      const err = (await r.json().catch(() => ({}))) as { error?: string };
      toast(err.error ?? "Erro ao criar key", "error");
    }
  }

  async function revoke(id: string, keyName: string) {
    if (!confirm(`Revogar "${keyName}"? Essa ação não pode ser desfeita.`)) return;
    const r = await fetch(`/api/internal/proxy-keys/${id}`, { method: "DELETE" });
    if (r.ok) { toast("Key revogada", "success"); await load(); }
    else toast("Erro ao revogar key", "error");
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Open Keys</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gere keys para usar no seu cliente de IA
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          + Nova Open Key
        </button>
      </div>

      {/* Connection info */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Configuração
          </span>
          <span className="h-px flex-1 bg-zinc-800" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CodeLine label="Base URL" value={`${BASE_URL}/v1`} />
          <CodeLine label="API Key" value="sua open key" />
        </div>
        <p className="text-xs text-zinc-600">
          Use estas credenciais no seu cliente de IA no lugar da chave original.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Nome</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Key</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Criada em</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Último uso</th>
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
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="text-sm text-zinc-500">Nenhuma Open Key criada ainda.</p>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="mt-3 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-4 py-1.5 text-xs text-indigo-400 hover:bg-indigo-600/30 transition-colors"
                  >
                    + Criar primeira
                  </button>
                </td>
              </tr>
            ) : (
              keys.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-200">{row.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-zinc-500 font-mono">{row.key}</code>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {new Date(row.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {row.last_used_at
                      ? new Date(row.last_used_at).toLocaleString("pt-BR")
                      : <span className="text-zinc-700">Nunca</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void revoke(row.id, row.name)}
                      className="rounded px-2 py-1 text-xs text-red-500 border border-red-900/50 hover:bg-red-950/50 transition-colors"
                    >
                      Revogar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Criar key ─────────────────────────────────── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova Open Key">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Nome</label>
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              placeholder="Nome para identificar esta key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void create()}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => void create()}
              disabled={creating || !name.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
            >
              {creating ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Revelar key criada ─────────────────────────── */}
      <Modal open={!!newKey} onClose={() => setNewKey(null)} title="Open Key criada!">
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-xs font-medium text-amber-400">
              ⚠ Salve esta key agora — ela não será mostrada novamente
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
            <code className="break-all text-sm text-zinc-200 font-mono">{newKey}</code>
          </div>
          <div className="flex justify-end gap-2">
            <CopyButton value={newKey ?? ""} label="Copiar key" />
            <button
              onClick={() => setNewKey(null)}
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

function CodeLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <code className="text-xs text-zinc-300 font-mono truncate">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}
