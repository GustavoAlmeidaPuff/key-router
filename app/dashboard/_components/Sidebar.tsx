"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/openrouter-keys",
    label: "OpenRouter Keys",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="6" cy="9" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6" cy="9" r="1.5" fill="currentColor" />
        <path d="M10 9H17M14 6.5L17 9L14 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/proxy-keys",
    label: "Open Keys",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2L16 5.5V9C16 12.5 13 15.5 9 17C5 15.5 2 12.5 2 9V5.5L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6.5 9L8 10.5L11.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-zinc-800/60 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-zinc-800/60 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="white" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-zinc-100">Key Router</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 font-medium"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              <span className={isActive ? "text-indigo-400" : "text-zinc-600"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800/60 p-3">
        {user ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            {/* Avatar */}
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url as string}
                alt="avatar"
                className="h-7 w-7 rounded-full"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600/30 text-xs font-medium text-indigo-300">
                {(user.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">
                {user.user_metadata?.name ?? user.email}
              </p>
            </div>
            <button
              onClick={() => void signOut()}
              title="Sair"
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M6 2H3C2.45 2 2 2.45 2 3V12C2 12.55 2.45 13 3 13H6M10 10.5L13 7.5L10 4.5M13 7.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="px-2 py-2">
            <p className="text-[11px] text-zinc-700">Carregando...</p>
          </div>
        )}
      </div>
    </aside>
  );
}
