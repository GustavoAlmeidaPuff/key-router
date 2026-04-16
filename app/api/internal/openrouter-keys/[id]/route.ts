import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDashboardAccess } from "@/lib/internalAuth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = (await request.json()) as { name?: string; isActive?: boolean };
  const updated = await prisma.openRouterKey.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  await prisma.openRouterKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
