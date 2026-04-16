import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { createOpenRouterKey } from "@/lib/openrouterKeyCreator";

const schema = z.object({
  name: z.string().min(1),
  limit: z.number().nonnegative().optional(),
});

export async function POST(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const masterKey = process.env.OPENROUTER_MASTER_KEY;
  if (!masterKey) {
    return NextResponse.json(
      { error: "OPENROUTER_MASTER_KEY não configurada" },
      { status: 500 },
    );
  }

  try {
    const created = await createOpenRouterKey(masterKey, parsed.data);
    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado" },
      { status: 500 },
    );
  }
}
