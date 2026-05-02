import { NextRequest, NextResponse } from "next/server";
import { emitActivity } from "@/lib/activityStream";
import { touchOpenRouterKeyUsage } from "@/lib/firestore-data";
import { getAvailableKey, markAsRateLimited } from "@/lib/keyRouter";
import { detectRateLimit, extractRetryAfter } from "@/lib/rateLimitDetector";
import { parseBearerToken, validateProxyKey } from "@/lib/proxyAuth";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: NextRequest) {
  const token = parseBearerToken(request.headers.get("authorization"));
  const proxyKey = token ? await validateProxyKey(token) : null;
  if (!proxyKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clientName = proxyKey.name;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const isStreaming = Boolean((body as { stream?: boolean }).stream);
  let lastStatus = 429;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) emitActivity({ type: "retrying", attempt, clientName });

    const openRouterKey = await getAvailableKey();
    if (!openRouterKey) {
      emitActivity({ type: "no_keys", clientName });
      return NextResponse.json(
        { error: "Nenhuma OpenRouter key disponível" },
        { status: 503 },
      );
    }

    emitActivity({ type: "using", keyId: openRouterKey.id, keyName: openRouterKey.name, clientName });

    const startedAt = Date.now();
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

    await touchOpenRouterKeyUsage(openRouterKey.id);

    if (response.ok) {
      emitActivity({ type: "success", keyId: openRouterKey.id, keyName: openRouterKey.name, clientName, latencyMs: Date.now() - startedAt });

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
    const rl = detectRateLimit(response, text);
    if (rl.isRateLimited) {
      emitActivity({ type: "rate_limit_hit", keyId: openRouterKey.id, keyName: openRouterKey.name, clientName });
      // Conservador: só marca a key quando o escopo é claramente de conta.
      if (rl.scope === "key") {
        await markAsRateLimited(openRouterKey.id, extractRetryAfter(response, text) ?? undefined);
      }
      lastStatus = response.status;
      lastError = text;
      continue;
    }

    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
    });
  }

  emitActivity({ type: "all_limited", clientName });

  // Repassa o erro real do OpenRouter pra facilitar debug no cliente.
  let upstream: unknown = lastError;
  if (lastError) {
    try {
      upstream = JSON.parse(lastError);
    } catch {
      /* mantém texto */
    }
  }

  return NextResponse.json(
    {
      error: "Todas as keys retornaram rate limit após 3 tentativas",
      status: lastStatus,
      upstream,
    },
    { status: 429 },
  );
}
