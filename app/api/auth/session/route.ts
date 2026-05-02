import { NextRequest, NextResponse } from "next/server";
import { firebaseAdminAuth } from "@/lib/firebase-admin";

const MAX_AGE_SEC = 60 * 60 * 24 * 5; // 5 dias

export async function POST(request: NextRequest) {
  let idToken: string;
  try {
    const body = (await request.json()) as { idToken?: string };
    idToken = body.idToken ?? "";
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!idToken) {
    return NextResponse.json({ error: "idToken é obrigatório" }, { status: 400 });
  }

  const expiresIn = MAX_AGE_SEC * 1000;
  const sessionCookie = await firebaseAdminAuth().createSessionCookie(idToken, {
    expiresIn,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return res;
}
