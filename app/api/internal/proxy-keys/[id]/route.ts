import { NextRequest, NextResponse } from "next/server";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { deleteProxyKey } from "@/lib/firestore-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  try {
    await deleteProxyKey(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao remover";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
