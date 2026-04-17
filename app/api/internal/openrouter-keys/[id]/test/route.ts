import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { detectRateLimit, extractRetryAfter } from "@/lib/rateLimitDetector";
import { markAsRateLimited } from "@/lib/keyRouter";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface AuthKeyPayload {
  data?: {
    label?: string;
    usage?: number;
    limit?: number | null;
    is_free_tier?: boolean;
    rate_limit?: { requests?: number; interval?: string };
  };
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
  const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: {
      Authorization: `Bearer ${keyRow.key}`,
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "Key Router",
    },
  });

  const latencyMs = Date.now() - startedAt;
  const bodyText = await response.text();

  if (!response.ok) {
    const rl = detectRateLimit(response, bodyText);

    // Só marca a key como bloqueada se o rate limit for de conta, não de modelo.
    if (rl.isRateLimited && rl.scope !== "model") {
      const retryAfter = extractRetryAfter(response, bodyText);
      await markAsRateLimited(id, retryAfter ?? undefined);

      const until = new Date(Date.now() + (retryAfter ?? 60) * 1000).toISOString();
      return NextResponse.json({
        success: false,
        rateLimited: true,
        scope: rl.scope,
        error: "Rate limit atingido na key",
        rate_limited_until: until,
        latencyMs,
      }, { status: 400 });
    }

    // 401/403 = key inválida ou revogada
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { success: false, error: "Key inválida ou revogada", latencyMs },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: bodyText || `HTTP ${response.status}`, latencyMs },
      { status: 400 },
    );
  }

  // Sucesso: key é válida. Limpa qualquer rate limit anterior.
  await supabase
    .from("openrouter_keys")
    .update({ rate_limited_until: null })
    .eq("id", id);

  let usage: AuthKeyPayload["data"] | undefined;
  try {
    usage = (JSON.parse(bodyText) as AuthKeyPayload).data;
  } catch {
    // ignora
  }

  return NextResponse.json({
    success: true,
    latencyMs,
    usage: usage ? {
      used: usage.usage,
      limit: usage.limit,
      isFreeTier: usage.is_free_tier,
      rateLimit: usage.rate_limit,
    } : undefined,
  });
}
