import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAvailableKey, markAsRateLimited } from "@/lib/keyRouter";
import { extractRetryAfter, isRateLimitError } from "@/lib/rateLimitDetector";
import { parseBearerToken, validateProxyKey } from "@/lib/proxyAuth";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: NextRequest) {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token || !(await validateProxyKey(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const isStreaming = Boolean((body as { stream?: boolean }).stream);
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const openRouterKey = await getAvailableKey();
    if (!openRouterKey) {
      return NextResponse.json(
        { error: "Nenhuma OpenRouter key disponível" },
        { status: 503 },
      );
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey.key}`,
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
        "X-Title": "Key Router",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    await supabase
      .from("openrouter_keys")
      .update({
        last_used_at: new Date().toISOString(),
        request_count: openRouterKey.request_count + 1,
      })
      .eq("id", openRouterKey.id);

    if (response.ok) {
      if (isStreaming) {
        return new NextResponse(response.body, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      const text = await response.text();
      return new NextResponse(text, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const text = await response.text();
    if (isRateLimitError(response, text)) {
      await markAsRateLimited(openRouterKey.id, extractRetryAfter(response) ?? undefined);
      lastResponse = response;
      continue;
    }

    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    });
  }

  return NextResponse.json(
    { error: "Todas as keys estão em rate limit", status: lastResponse?.status ?? 429 },
    { status: 429 },
  );
}
