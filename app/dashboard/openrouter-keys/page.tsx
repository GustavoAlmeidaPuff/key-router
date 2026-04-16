"use client";

import { useEffect, useState } from "react";

interface OpenRouterKeyRow {
  id: string;
  name: string;
  key: string;
  suffix: string;
  isActive: boolean;
  requestCount: number;
  rateLimitedUntil: string | null;
}

export default function OpenRouterKeysPage() {
  const [keys, setKeys] = useState<OpenRouterKeyRow[]>([]);
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState("");
  const [createName, setCreateName] = useState("");
  const [createLimit, setCreateLimit] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/internal/openrouter-keys")
      .then((response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (data) setKeys(data);
      });
  }, []);

  async function loadKeys() {
    const response = await fetch("/api/internal/openrouter-keys");
    if (!response.ok) return;
    setKeys(await response.json());
  }

  async function addManual() {
    await fetch("/api/internal/openrouter-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, key: rawKey }),
    });
    setName("");
    setRawKey("");
    await loadKeys();
  }

  async function createViaOpenRouter() {
    const response = await fetch("/api/internal/openrouter-keys/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName,
        limit: createLimit ? Number(createLimit) : undefined,
      }),
    });
    const payload = await response.json();
    setCreatedKey(payload.key ?? null);
    setCreateName("");
    setCreateLimit("");
    await loadKeys();
  }

  async function remove(id: string) {
    await fetch(`/api/internal/openrouter-keys/${id}`, { method: "DELETE" });
    await loadKeys();
  }

  async function toggleActive(row: OpenRouterKeyRow) {
    await fetch(`/api/internal/openrouter-keys/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    await loadKeys();
  }

  async function testKey(id: string) {
    const response = await fetch(`/api/internal/openrouter-keys/${id}/test`, {
      method: "POST",
    });
    const payload = await response.json();
    alert(JSON.stringify(payload, null, 2));
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">OpenRouter Keys</h2>

      <div className="grid gap-3 rounded border border-zinc-800 p-4 md:grid-cols-3">
        <input
          className="rounded bg-zinc-900 p-2"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded bg-zinc-900 p-2"
          placeholder="sk-or-..."
          value={rawKey}
          onChange={(e) => setRawKey(e.target.value)}
        />
        <button className="rounded bg-blue-600 p-2" onClick={addManual}>
          Adicionar key
        </button>
      </div>

      <div className="grid gap-3 rounded border border-zinc-800 p-4 md:grid-cols-4">
        <input
          className="rounded bg-zinc-900 p-2"
          placeholder="Nome da nova key"
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
        />
        <input
          className="rounded bg-zinc-900 p-2"
          placeholder="Limite USD (opcional)"
          value={createLimit}
          onChange={(e) => setCreateLimit(e.target.value)}
        />
        <button className="rounded bg-emerald-600 p-2" onClick={createViaOpenRouter}>
          Criar key no OpenRouter
        </button>
        <div className="text-sm text-zinc-300">
          {createdKey ? `Nova key (mostrada uma vez): ${createdKey}` : "Sem key recém-gerada."}
        </div>
      </div>

      <div className="overflow-auto rounded border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Final</th>
              <th className="p-3">Status</th>
              <th className="p-3">Requests</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((row) => (
              <tr key={row.id} className="border-t border-zinc-800">
                <td className="p-3">{row.name}</td>
                <td className="p-3">{row.suffix}</td>
                <td className="p-3">
                  {!row.isActive
                    ? "Inativa"
                    : row.rateLimitedUntil
                      ? `Rate limited até ${new Date(row.rateLimitedUntil).toLocaleTimeString()}`
                      : "Disponível"}
                </td>
                <td className="p-3">{row.requestCount}</td>
                <td className="flex gap-2 p-3">
                  <button className="rounded bg-zinc-700 px-2 py-1" onClick={() => testKey(row.id)}>
                    Testar
                  </button>
                  <button
                    className="rounded bg-yellow-700 px-2 py-1"
                    onClick={() => toggleActive(row)}
                  >
                    {row.isActive ? "Desativar" : "Ativar"}
                  </button>
                  <button className="rounded bg-red-700 px-2 py-1" onClick={() => remove(row.id)}>
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
