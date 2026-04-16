import { NextRequest, NextResponse } from "next/server";

export function checkDashboardAccess(request: NextRequest): NextResponse | null {
  const requiredPassword = process.env.DASHBOARD_PASSWORD;
  if (!requiredPassword) return null;

  const incoming = request.headers.get("x-dashboard-password");
  if (incoming === requiredPassword) return null;

  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}
