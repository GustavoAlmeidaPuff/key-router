import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { isRateLimitError, extractRetryAfter } from "@/lib/rateLimitDetector";
import { markAsRateLimited } from "@/lib/keyRouter";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  const { data: keyRow } = await supabase
    .from("openrouter_keys")
    .select("key")
    .eq("id", id)
    .single();

  if (!keyRow) return NextResponse.json({ error: "Key não encontrada" }, { status: 404 });

  const startedAt = Date.now();
  const model = await getFirstFreeModel(keyRow.key);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keyRow.key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "Key Router",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Say 'OK' and nothing else." }],
    }),
  });

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const errorText = await response.text();

    // Se for rate limit, marca no banco e retorna status atualizado
    if (isRateLimitError(response, errorText)) {
      const retryAfter = extractRetryAfter(response, errorText);
      await markAsRateLimited(id, retryAfter ?? undefined);

      const until = new Date(Date.now() + (retryAfter ?? 60) * 1000).toISOString();
      return NextResponse.json({
        success: false,
        rateLimited: true,
        error: "Rate limit atingido",
        rate_limited_until: until,
        latencyMs,
        model,
      }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: errorText, latencyMs, model },
      { status: 400 },
    );
  }

  // Limpa qualquer rate limit anterior
  await supabase
    .from("openrouter_keys")
    .update({ rate_limited_until: null })
    .eq("id", id);

  return NextResponse.json({ success: true, latencyMs, model });
}

async function getFirstFreeModel(openRouterKey: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "Key Router",
    },
  });

  if (!response.ok) return "google/gemma-2-9b-it:free";

  const payload = (await response.json()) as { data?: Array<{ id?: string }> };
  const firstFree = payload.data?.find((m) => m.id?.includes(":free"))?.id;
  return firstFree ?? "google/gemma-2-9b-it:free";
}
