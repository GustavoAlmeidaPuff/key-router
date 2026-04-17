"use client";

import { useEffect, useState } from "react";

interface FreeModel {
  id: string;
  name: string;
  context_length?: number;
}

function formatContext(ctx?: number): string {
  if (!ctx) return "";
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(0)}M ctx`;
  if (ctx >= 1_000) return `${(ctx / 1_000).toFixed(0)}K ctx`;
  return `${ctx} ctx`;
}

export function FreeModelsAside() {
  const [models, setModels] = useState<FreeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/internal/free-models")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: FreeModel[]) => { setModels(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <aside className="w-64 shrink-0 sticky top-8">
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
          <span className="text-xs font-medium text-zinc-300">Modelos gratuitos</span>
          {!loading && !error && (
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              {models.length}
            </span>
          )}
        </div>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto divide-y divide-zinc-800/40">
          {loading ? (
            <p className="px-4 py-4 text-xs text-zinc-600">Carregando modelos...</p>
          ) : error ? (
            <p className="px-4 py-4 text-xs text-red-500">Erro ao carregar</p>
          ) : models.length === 0 ? (
            <p className="px-4 py-4 text-xs text-zinc-600">Nenhum modelo gratuito encontrado</p>
          ) : (
            models.map((m) => (
              <div key={m.id} className="px-4 py-2.5 hover:bg-zinc-900/30 transition-colors">
                <p className="text-xs font-medium text-zinc-300 leading-snug">{m.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono truncate">{m.id}</span>
                  {m.context_length && (
                    <span className="shrink-0 text-[10px] text-zinc-600">{formatContext(m.context_length)}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && !error && models.length > 0 && (
          <div className="border-t border-zinc-800 bg-zinc-900/40 px-4 py-2">
            <p className="text-[10px] text-zinc-700">$0 input · $0 output · via OpenRouter</p>
          </div>
        )}
      </div>
    </aside>
  );
}
