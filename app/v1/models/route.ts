import { NextRequest, NextResponse } from "next/server";
import { parseBearerToken, validateProxyKey } from "@/lib/proxyAuth";

let modelsCache: { data: unknown; expiresAt: number } | null = null;

export async function GET(request: NextRequest) {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token || !(await validateProxyKey(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const onlyFree = request.nextUrl.searchParams.get("free") === "true";
  const now = Date.now();

  if (modelsCache && modelsCache.expiresAt > now) {
    return NextResponse.json(filterModels(modelsCache.data, onlyFree));
  }

  const key = process.env.OPENROUTER_MASTER_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENROUTER_MASTER_KEY não configurada" },
      { status: 500 },
    );
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "Key Router",
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `Erro ao buscar modelos: ${response.status}` },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as unknown;
  modelsCache = { data: payload, expiresAt: now + 5 * 60 * 1000 };
  return NextResponse.json(filterModels(payload, onlyFree));
}

function filterModels(payload: unknown, onlyFree: boolean): unknown {
  if (!onlyFree) return payload;
  if (!payload || typeof payload !== "object") return payload;

  const data = (payload as { data?: Array<{ id?: string }> }).data;
  if (!Array.isArray(data)) return payload;

  return {
    ...payload,
    data: data.filter((model) => model.id?.includes(":free")),
  };
}
