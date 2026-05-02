import { NextRequest, NextResponse } from "next/server";
import { insertProxyKey, listProxyKeys } from "@/lib/firestore-data";
import { generateProxyKey } from "@/lib/proxyAuth";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { maskKey } from "@/lib/masks";

export async function GET(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  try {
    const keys = await listProxyKeys();
    return NextResponse.json(
      keys.map((key) => ({ ...key, key: maskKey(key.key, 6) })),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao listar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as { name?: string };
  const normalizedName = body.name?.trim() || `Open Key ${new Date().toLocaleString("pt-BR")}`;

  const rawKey = generateProxyKey();

  try {
    const created = await insertProxyKey(normalizedName, rawKey);
    return NextResponse.json({ ...created, key: rawKey });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
