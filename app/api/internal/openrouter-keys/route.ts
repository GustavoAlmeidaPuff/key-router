import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { maskKey } from "@/lib/masks";

export async function GET(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { data: keys, error } = await db()
    .from("openrouter_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (keys ?? []).map((key) => ({
      ...key,
      key: maskKey(key.key as string),
      suffix: (key.key as string).slice(-4),
    })),
  );
}

export async function POST(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as { name?: string; key?: string };
  if (!body.name || !body.key) {
    return NextResponse.json({ error: "name e key são obrigatórios" }, { status: 400 });
  }

  const { data: created, error } = await db()
    .from("openrouter_keys")
    .insert({ name: body.name, key: body.key })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Essa key já está cadastrada" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...created,
    key: maskKey(created.key as string),
    suffix: (created.key as string).slice(-4),
  });
}
