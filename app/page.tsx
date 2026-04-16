import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-4xl font-bold">OpenRouter Key Rotator</h1>
      <p className="text-zinc-300">
        Proxy OpenAI-compatível com rotação automática de keys e dashboard interno.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
      >
        Abrir dashboard
      </Link>
    </main>
  );
}
