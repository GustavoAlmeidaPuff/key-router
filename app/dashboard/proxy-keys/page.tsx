"use client";

import { useEffect, useState } from "react";

interface ProxyKeyRow {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function ProxyKeysPage() {
  const [keys, setKeys] = useState<ProxyKeyRow[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/internal/proxy-keys")
      .then((response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (data) setKeys(data);
      });
  }, []);

  async function load() {
    const response = await fetch("/api/internal/proxy-keys");
    if (!response.ok) return;
    setKeys(await response.json());
  }

  async function create() {
    setErrorMessage(null);
    const response = await fetch("/api/internal/proxy-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setErrorMessage(payload.error ?? "Não foi possível criar a proxy key.");
      return;
    }
    const payload = await response.json();
    setNewKey(payload.key ?? null);
    setName("");
    await load();
  }

  async function revoke(id: string) {
    await fetch(`/api/internal/proxy-keys/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Proxy Keys</h2>

      <div className="flex gap-3 rounded border border-zinc-800 p-4">
        <input
          className="flex-1 rounded bg-zinc-900 p-2"
          placeholder="Nome da key"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-blue-600 px-3" onClick={create}>
          Criar nova Proxy Key
        </button>
      </div>

      {newKey ? (
        <div className="rounded border border-emerald-700 bg-emerald-900/20 p-3 text-sm">
          Nova key (mostrada uma vez): {newKey}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded border border-red-700 bg-red-900/20 p-3 text-sm">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-auto rounded border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Key</th>
              <th className="p-3">Criada em</th>
              <th className="p-3">Último uso</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((row) => (
              <tr key={row.id} className="border-t border-zinc-800">
                <td className="p-3">{row.name}</td>
                <td className="p-3">{row.key}</td>
                <td className="p-3">{new Date(row.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  {row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString() : "Nunca"}
                </td>
                <td className="p-3">
                  <button className="rounded bg-red-700 px-2 py-1" onClick={() => revoke(row.id)}>
                    Revogar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded border border-zinc-800 p-4 text-sm text-zinc-300">
        <p>Base URL: {process.env.NEXT_PUBLIC_PROXY_URL ?? "http://localhost:3000"}/v1</p>
        <p>API Key: sk-proxy-xxxx</p>
        <p>Qualquer produto OpenAI-compatível funciona aqui.</p>
      </div>
    </section>
  );
}
