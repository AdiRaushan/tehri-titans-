import { NextResponse } from "next/server";
import { createOfflineRegistration } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED = ["name", "email", "mobile", "age", "proficiency", "address"] as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers: corsHeaders });
  }

  const missing = REQUIRED.filter((k) => !String(body[k] ?? "").trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Please fill all required fields: ${missing.join(", ")}.` },
      { status: 400, headers: corsHeaders }
    );
  }

  const mobileClean = String(body.mobile ?? "").trim();
  const emailClean = String(body.email ?? "").trim();

  // Validate 10-digit Indian mobile number
  if (!/^[6-9]\d{9}$/.test(mobileClean)) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9." },
      { status: 400, headers: corsHeaders }
    );
  }

  // Validate email address
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailClean)) {
    return NextResponse.json(
      { error: "Please enter a valid email address (e.g. player@gmail.com)." },
      { status: 400, headers: corsHeaders }
    );
  }

  if (Number(body.age) < 16) {
    return NextResponse.json(
      { error: "Trials are open to players aged 16 and above." },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const { registration, isNew } = await createOfflineRegistration({
      name: String(body.name),
      email: String(body.email),
      mobile: String(body.mobile),
      age: String(body.age),
      proficiency: String(body.proficiency),
      address: String(body.address),
    });

    return NextResponse.json(
      {
        ok: true,
        isNew,
        registration,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record registration." },
      { status: 500, headers: corsHeaders }
    );
  }
}
