import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "titans2025";
  const inputPassword = String(body.password || "").trim();

  if (inputPassword !== adminPassword) {
    return NextResponse.json(
      { error: "Incorrect admin password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true, message: "Login successful" });
  response.cookies.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return response;
}
