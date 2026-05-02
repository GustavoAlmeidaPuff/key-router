import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { checkDashboardAccess } from "@/lib/internalAuth";

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

  const { data, error } = await db()
    .from("openrouter_keys")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = checkDashboardAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const { error } = await db().from("openrouter_keys").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
