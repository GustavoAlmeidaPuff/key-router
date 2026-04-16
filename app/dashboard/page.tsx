"use client";

import { useEffect, useMemo, useState } from "react";

interface OpenRouterKeyRow {
  id: string;
  name: string;
  isActive: boolean;
  rateLimitedUntil: string | null;
  requestCount: number;
}

export default function DashboardPage() {
  const [keys, setKeys] = useState<OpenRouterKeyRow[]>([]);
  const [model, setModel] = useState("meta-llama/llama-3.1-8b-instruct:free");
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/internal/openrouter-keys")
      .then((r) => r.json())
      .then((data) => setKeys(data));
  }, []);

  const stats = useMemo(() => {
    const available = keys.filter((key) => key.isActive && !key.rateLimitedUntil).length;
    const rateLimited = keys.filter((key) => key.rateLimitedUntil).length;
    const totalRequests = keys.reduce((sum, key) => sum + key.requestCount, 0);
    return { total: keys.length, available, rateLimited, totalRequests };
  }, [keys]);

  async function runTestChat() {
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${prompt("Informe uma proxy key válida para teste:") ?? ""}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [{ role: "user", content: message }],
        }),
      });

      if (!response.ok || !response.body) {
        setAnswer(await response.text());
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        setAnswer((prev) => prev + decoder.decode(chunk.value, { stream: true }));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="OpenRouter keys">{stats.total} (disponíveis: {stats.available})</Card>
        <Card title="Requests totais">{stats.totalRequests}</Card>
        <Card title="Keys em rate limit">{stats.rateLimited}</Card>
      </div>

      <div className="space-y-3 rounded border border-zinc-800 p-4">
        <h3 className="text-lg font-semibold">Chat de teste rápido</h3>
        <input
          className="w-full rounded bg-zinc-900 p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Modelo"
        />
        <textarea
          className="w-full rounded bg-zinc-900 p-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensagem"
          rows={4}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 disabled:opacity-60"
          onClick={runTestChat}
          disabled={loading || !message}
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
        <pre className="min-h-36 overflow-auto rounded bg-black p-3 text-xs text-zinc-200">
          {answer}
        </pre>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-2xl font-semibold">{children}</p>
    </div>
  );
}
