import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white tracking-tight">
              KR
            </div>
            <span className="font-semibold text-zinc-100">Key Router</span>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pt-24 pb-20 text-center">
          {/* Radial glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
            aria-hidden="true"
          >
            <div className="h-[480px] w-[800px] rounded-full bg-indigo-600/12 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              OpenAI-compatible drop-in
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
              One endpoint.
              <br />
              <span className="text-indigo-400">All your keys.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
              Key Router sits in front of your OpenRouter accounts. When one key
              hits a rate limit, it instantly switches to the next — no errors,
              no manual retries, no babysitting.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
              >
                Open Dashboard →
              </Link>
              <a
                href="#how-it-works"
                className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
              >
                How it works
              </a>
            </div>

            {/* Code snippet */}
            <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-left">
              <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="ml-2 text-xs text-zinc-600">migration.py</span>
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-relaxed" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                <code>
                  <span className="text-zinc-500"># Before</span>{"\n"}
                  <span className="text-zinc-300">client </span>
                  <span className="text-zinc-500">= </span>
                  <span className="text-indigo-400">OpenAI</span>
                  <span className="text-zinc-300">(</span>
                  <span className="text-zinc-300">base_url</span>
                  <span className="text-zinc-500">=</span>
                  <span className="text-emerald-400">&quot;https://openrouter.ai/api/v1&quot;</span>
                  <span className="text-zinc-300">, api_key</span>
                  <span className="text-zinc-500">=</span>
                  <span className="text-emerald-400">&quot;sk-or-...&quot;</span>
                  <span className="text-zinc-300">)</span>
                  {"\n\n"}
                  <span className="text-zinc-500"># After — that&apos;s it</span>{"\n"}
                  <span className="text-zinc-300">client </span>
                  <span className="text-zinc-500">= </span>
                  <span className="text-indigo-400">OpenAI</span>
                  <span className="text-zinc-300">(</span>
                  <span className="text-zinc-300">base_url</span>
                  <span className="text-zinc-500">=</span>
                  <span className="text-emerald-400">&quot;https://your-keyrouter.app/v1&quot;</span>
                  <span className="text-zinc-300">, api_key</span>
                  <span className="text-zinc-500">=</span>
                  <span className="text-emerald-400">&quot;sk-open-...&quot;</span>
                  <span className="text-zinc-300">)</span>
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* ── Feature cards ──────────────────────────────────────── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Card 1 — Rotation */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
                  {/* Circular arrows */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-zinc-100">Automatic rotation</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  The moment a key returns a 429, Key Router picks the next
                  available one and retries the request. Your app never sees the
                  error.
                </p>
              </div>

              {/* Card 2 — Compatibility */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
                  {/* Plug/connector */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22v-5" />
                    <path d="M9 8V2" />
                    <path d="M15 8V2" />
                    <path d="M18 8H6a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0v-3a2 2 0 0 0-2-2Z" />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-zinc-100">Drop-in compatible</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Speaks the OpenAI API protocol exactly. Change one line —
                  the base URL — and every SDK, library, and tool you already
                  use keeps working.
                </p>
              </div>

              {/* Card 3 — Monitoring */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
                  {/* Pulse / activity line */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-zinc-100">Live dashboard</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Watch requests stream in real time. See which key is active,
                  per-request latency, and exactly when a rate limit was hit and
                  how long the cooldown lasted.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section id="how-it-works" className="px-6 py-20 border-t border-zinc-800/60">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-zinc-50">
              Up in three steps
            </h2>

            <div className="grid gap-8 sm:grid-cols-3">
              <div className="flex flex-col gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-sm font-bold text-indigo-400 ring-1 ring-indigo-600/40">
                  1
                </div>
                <h3 className="font-semibold text-zinc-100">Register your OpenRouter keys</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Paste in as many <code className="rounded bg-zinc-800 px-1 text-xs text-indigo-300">sk-or-...</code> keys as you have. Key Router stores them and tracks rate limit state for each one independently.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-sm font-bold text-indigo-400 ring-1 ring-indigo-600/40">
                  2
                </div>
                <h3 className="font-semibold text-zinc-100">Get your unified endpoint</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  You get a single <code className="rounded bg-zinc-800 px-1 text-xs text-indigo-300">sk-open-...</code> key and a <code className="rounded bg-zinc-800 px-1 text-xs text-indigo-300">/v1</code> base URL to use everywhere. One credential, all your capacity behind it.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-sm font-bold text-indigo-400 ring-1 ring-indigo-600/40">
                  3
                </div>
                <h3 className="font-semibold text-zinc-100">Ship without thinking about it</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Your app calls Key Router like it would call OpenAI. Rate limits are handled silently. Check the dashboard whenever you&apos;re curious — otherwise, just forget about it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA banner ─────────────────────────────────────────── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-indigo-500/20 bg-indigo-600/5 p-10 text-center">
            <h2 className="text-2xl font-bold text-zinc-50">
              Ready to stop worrying about rate limits?
            </h2>
            <p className="mt-3 text-zinc-400">
              Open the dashboard, add your keys, and get your endpoint in under
              a minute.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
            >
              Open Dashboard →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-[9px] font-bold text-white">
              KR
            </div>
            <span>Key Router</span>
          </div>
          <span>Self-hosted · OpenAI-compatible · OpenRouter</span>
        </div>
      </footer>
    </div>
  );
}
