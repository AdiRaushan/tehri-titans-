import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readRegistrations, cleanupExpiredRegistrations, deleteRegistration } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  // Auto-cleanup expired registrations before returning stats
  await cleanupExpiredRegistrations();

  const records = await readRegistrations();

  // Compute stats
  let total = records.length;
  let paid = 0;
  let offline = 0;
  let pending = 0;
  let expired = 0;
  let totalRevenue = 0;

  for (const r of records) {
    if (r.status === "PAID") {
      paid++;
      totalRevenue += 999; // ₹999 per confirmed registration
    } else if (r.status === "OFFLINE") {
      offline++;
    } else if (r.status === "PENDING") {
      pending++;
    } else if (r.status === "EXPIRED") {
      expired++;
    }
  }

  return NextResponse.json({
    ok: true,
    stats: {
      total,
      paid,
      offline,
      pending,
      expired,
      totalRevenue,
    },
    records,
  });
}

export async function DELETE(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id || body?.registrationId;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Registration ID is required." }, { status: 400 });
    }

    const success = await deleteRegistration(String(id));
    if (!success) {
      return NextResponse.json({ error: "Registration not found or already deleted." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: `Registration ${id} deleted successfully.` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete registration." },
      { status: 500 }
    );
  }
}
