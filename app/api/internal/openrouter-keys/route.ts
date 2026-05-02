import { NextRequest, NextResponse } from "next/server";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { insertOpenRouterKey, listOpenRouterKeys } from "@/lib/firestore-data";
import { maskKey } from "@/lib/masks";

export async function GET(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  try {
    const keys = await listOpenRouterKeys();
    return NextResponse.json(
      keys.map((key) => ({
        ...key,
        key: maskKey(key.key),
        suffix: key.key.slice(-4),
      })),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao listar keys";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as { name?: string; key?: string };
  if (!body.name || !body.key) {
    return NextResponse.json({ error: "name e key são obrigatórios" }, { status: 400 });
  }

  try {
    const created = await insertOpenRouterKey(body.name, body.key);
    return NextResponse.json({
      ...created,
      key: maskKey(created.key),
      suffix: created.key.slice(-4),
    });
  } catch (e) {
    const err = e as Error & { code?: string };
    if (err.code === "23505") {
      return NextResponse.json({ error: "Essa key já está cadastrada" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message ?? "Erro ao criar" }, { status: 500 });
  }
}
