import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { maskKey } from "@/lib/masks";

export async function GET(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const keys = await prisma.openRouterKey.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    keys.map((key) => ({
      ...key,
      key: maskKey(key.key),
      suffix: key.key.slice(-4),
    })),
  );
}

export async function POST(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as { name?: string; key?: string };
  if (!body.name || !body.key) {
    return NextResponse.json({ error: "name e key são obrigatórios" }, { status: 400 });
  }

  const created = await prisma.openRouterKey.create({
    data: { name: body.name, key: body.key },
  });

  return NextResponse.json({
    ...created,
    key: maskKey(created.key),
    suffix: created.key.slice(-4),
  });
}
