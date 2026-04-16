import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 bg-zinc-950">
      {/* Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6 text-center max-w-lg">
        {/* Logo */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" fill="white" fillOpacity="0.9" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-zinc-50">Key Router</h1>
          <p className="mt-2 text-zinc-400 text-sm leading-relaxed">
            Proxy OpenAI-compatível que gerencia múltiplas keys do OpenRouter e
            rotaciona automaticamente ao atingir rate limits.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
          >
            Abrir Dashboard →
          </Link>
        </div>

        {/* Endpoint pill */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-left w-full">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-2">
            Endpoint compatível com OpenAI
          </p>
          <code className="text-xs text-zinc-300">
            http://localhost:3000<span className="text-indigo-400">/v1/chat/completions</span>
          </code>
        </div>
      </div>
    </main>
  );
}
