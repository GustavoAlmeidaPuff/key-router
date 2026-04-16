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
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key.key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "OpenRouter Key Rotator",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
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
