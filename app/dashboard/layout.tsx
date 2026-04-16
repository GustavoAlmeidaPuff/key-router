import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 p-4">
        <h1 className="mb-6 text-lg font-semibold">Key Rotator</h1>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="rounded px-2 py-1 hover:bg-zinc-800">
            Dashboard
          </Link>
          <Link
            href="/dashboard/openrouter-keys"
            className="rounded px-2 py-1 hover:bg-zinc-800"
          >
            OpenRouter Keys
          </Link>
          <Link
            href="/dashboard/proxy-keys"
            className="rounded px-2 py-1 hover:bg-zinc-800"
          >
            Proxy Keys
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
