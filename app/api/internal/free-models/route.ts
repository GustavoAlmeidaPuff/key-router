import { NextRequest, NextResponse } from "next/server";
import { checkDashboardAccess } from "@/lib/internalAuth";

interface OpenRouterModel {
  id: string;
  name: string;
  context_length?: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export async function GET(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const res = await fetch("https://openrouter.ai/api/v1/models", {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 502 });
  }

  const { data } = (await res.json()) as { data: OpenRouterModel[] };

  const freeModels = data
    .filter((m) => m.pricing.prompt === "0" && m.pricing.completion === "0")
    .map((m) => ({
      id: m.id,
      name: m.name,
      context_length: m.context_length,
    }));

  return NextResponse.json(freeModels);
}
