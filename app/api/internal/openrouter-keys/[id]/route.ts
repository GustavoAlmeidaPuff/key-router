import { NextRequest, NextResponse } from "next/server";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { deleteOpenRouterKey, patchOpenRouterKey } from "@/lib/firestore-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = (await request.json()) as { name?: string; is_active?: boolean };

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.is_active !== undefined) update.is_active = body.is_active;

  try {
    const data = await patchOpenRouterKey(id, update);
    if (!data) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao atualizar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    await deleteOpenRouterKey(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao remover";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
