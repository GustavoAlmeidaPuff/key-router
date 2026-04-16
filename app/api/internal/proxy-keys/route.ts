import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProxyKey } from "@/lib/proxyAuth";
import { checkDashboardAccess } from "@/lib/internalAuth";
import { maskKey } from "@/lib/masks";

export async function GET(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const keys = await prisma.proxyKey.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(keys.map((key) => ({ ...key, key: maskKey(key.key, 6) })));
}

export async function POST(request: NextRequest) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as { name?: string };
  const normalizedName = body.name?.trim() || `Proxy Key ${new Date().toLocaleString("pt-BR")}`;

  const rawKey = generateProxyKey();
  const created = await prisma.proxyKey.create({
    data: { name: normalizedName, key: rawKey },
  });

  return NextResponse.json({
    ...created,
    key: rawKey,
  });
}
