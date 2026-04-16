import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDashboardAccess } from "@/lib/internalAuth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  await prisma.proxyKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
