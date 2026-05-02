import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://juqxwrwarvzkfhszskwo.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export async function middleware(request: NextRequest) {
  if (!SUPABASE_ANON_KEY) {
    return new NextResponse(
      [
        "Falta configurar o Supabase no ambiente local.",
        "",
        "Crie um arquivo .env.local na raiz do projeto com:",
        "NEXT_PUBLIC_SUPABASE_URL=https://juqxwrwarvzkfhszskwo.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key em Settings → API>",
        "SUPABASE_SERVICE_ROLE_KEY=<service_role — só servidor>",
        "",
        "Opcional (schema dedicado): NEXT_PUBLIC_SUPABASE_SCHEMA e SUPABASE_SCHEMA",
        "",
        "Depois reinicie: npx next dev -p 3002",
      ].join("\n"),
      {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      },
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (request.nextUrl.pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
