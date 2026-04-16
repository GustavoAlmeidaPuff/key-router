"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface OpenRouterKeyRow {
  id: string;
  name: string;
  is_active: boolean;
  rate_limited_until: string | null;
  request_count: number;
}

interface OpenKeyRow {
  id: string;
  name: string;
  key: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DashboardPage() {
  const [keys, setKeys] = useState<OpenRouterKeyRow[]>([]);
  const [openKeys, setOpenKeys] = useState<OpenKeyRow[]>([]);
  const [proxyKey, setProxyKey] = useState("");
  const [model, setModel] = useState("meta-llama/llama-3.1-8b-instruct:free");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/internal/openrouter-keys")
      .then((r) => r.json())
      .then(setKeys);
    void fetch("/api/internal/proxy-keys")
      .then((r) => r.json())
      .then((data: OpenKeyRow[]) => {
        setOpenKeys(data);
        if (data.length > 0) setProxyKey(data[0].key);
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const stats = useMemo(() => {
    const now = new Date();
    const available = keys.filter(
      (k) =>
        k.is_active &&
        (!k.rate_limited_until || new Date(k.rate_limited_until) < now),
    ).length;
    const rateLimited = keys.filter(
      (k) => k.rate_limited_until && new Date(k.rate_limited_until) > now,
    ).length;
    const totalRequests = keys.reduce((s, k) => s + k.request_count, 0);
    return { total: keys.length, available, rateLimited, totalRequests };
  }, [keys]);

  async function sendMessage() {
    if (!input.trim() || !model || streaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${proxyKey}`,
        },
        body: JSON.stringify({ model, stream: true, messages: history }),
      });

      if (!response.ok || !response.body) {
        const err = await response.text();
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: `Erro: ${err}` },
        ]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = parsed.choices?.[0]?.delta?.content ?? "";
            if (token) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + token },
                ];
              });
            }
          } catch {
            // ignore parse errors on non-JSON lines
          }
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Status do proxy e teste rápido</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="OpenRouter Keys"
          value={String(stats.total)}
          sub={`${stats.available} disponíveis`}
          color="indigo"
          icon={
            <path d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          }
        />
        <StatCard
          label="Disponíveis agora"
          value={String(stats.available)}
          sub="prontas para uso"
          color="emerald"
          icon={
            <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          }
        />
        <StatCard
          label="Rate limitadas"
          value={String(stats.rateLimited)}
          sub="aguardando reset"
          color="amber"
          icon={
            <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>
          }
        />
        <StatCard
          label="Total de requests"
          value={stats.totalRequests.toLocaleString("pt-BR")}
          sub="via proxy"
          color="violet"
          icon={
            <><path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>
          }
        />
      </div>

      {/* Chat */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Chat de teste rápido</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Usa o proxy localmente com streaming</p>
        </div>

        {/* Config bar */}
        <div className="flex gap-3 border-b border-zinc-800/60 bg-zinc-950/40 px-5 py-3">
          <select
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
            value={proxyKey}
            onChange={(e) => setProxyKey(e.target.value)}
          >
            {openKeys.length === 0 ? (
              <option value="">Nenhuma Open Key criada</option>
            ) : (
              openKeys.map((k) => (
                <option key={k.id} value={k.key}>{k.name}</option>
              ))
            )}
          </select>
          <input
            className="w-72 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
            placeholder="modelo (ex: meta-llama/llama-3.1-8b-instruct:free)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        {/* Messages */}
        <div className="h-72 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-600">
              Envie uma mensagem para começar
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                  }`}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center text-zinc-500">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 border-t border-zinc-800 px-5 py-3">
          <input
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            disabled={streaming}
          />
          <button
            onClick={() => void sendMessage()}
            disabled={streaming || !input.trim() || !model || !proxyKey}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {streaming ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: "indigo" | "emerald" | "amber" | "violet";
  icon: React.ReactNode;
}) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
        <div className={`rounded-lg border p-1.5 ${colors[color]}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            {icon}
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-600">{sub}</p>
    </div>
  );
}
