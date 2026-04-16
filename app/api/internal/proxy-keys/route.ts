import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateProxyKey } from "@/lib/proxyAuth";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { maskKey } from "@/lib/masks";

export async function GET(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { data: keys, error } = await supabase
    .from("proxy_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (keys ?? []).map((key) => ({ ...key, key: maskKey(key.key, 6) })),
  );
}

export async function POST(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as { name?: string };
  const normalizedName = body.name?.trim() || `Open Key ${new Date().toLocaleString("pt-BR")}`;

  const rawKey = generateProxyKey();

  const { data: created, error } = await supabase
    .from("proxy_keys")
    .insert({ name: normalizedName, key: rawKey })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ...created, key: rawKey });
}
