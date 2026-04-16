import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDashboardAccess } from "@/lib/internalAuth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const key = await prisma.openRouterKey.findUnique({ where: { id } });
  if (!key) return NextResponse.json({ error: "Key não encontrada" }, { status: 404 });

  const startedAt = Date.now();
  const model = await getFirstFreeModel(key.key);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key.key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "OpenRouter Key Rotator",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Say 'OK' and nothing else." }],
    }),
  });

  const latencyMs = Date.now() - startedAt;
  if (!response.ok) {
    return NextResponse.json(
      { success: false, error: await response.text(), latencyMs },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, latencyMs });
}

async function getFirstFreeModel(openRouterKey: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "OpenRouter Key Rotator",
    },
  });

  if (!response.ok) {
    return "google/gemma-2-9b-it:free";
  }

  const payload = (await response.json()) as { data?: Array<{ id?: string }> };
  const firstFree = payload.data?.find((item) => item.id?.includes(":free"))?.id;
  return firstFree ?? "google/gemma-2-9b-it:free";
}
