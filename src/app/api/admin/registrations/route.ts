import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  readRegistrations,
  cleanupExpiredRegistrations,
  deleteRegistration,
  clearAllRegistrations,
} from "@/lib/db";
import { feeAmountRupees } from "@/data/camp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET() {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // Safely auto-cleanup expired registrations without crashing on API warnings
    try {
      await cleanupExpiredRegistrations();
    } catch (err) {
      console.warn("Non-critical cleanup warning:", err);
    }

    const records = await readRegistrations();

    // Compute stats with exact revenue accounting
    let total = records.length;
    let paid = 0;
    let offline = 0;
    let pending = 0;
    let expired = 0;
    let totalRevenue = 0;

    for (const r of records) {
      if (r.status === "PAID") {
        paid++;
        const successfulAttempt = r.paymentAttempts?.find((a) => a.status === "SUCCESS");
        const paidAmount = Number(successfulAttempt?.amount) || feeAmountRupees || 999;
        totalRevenue += paidAmount;
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
  } catch (err) {
    console.error("Admin GET registrations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch registrations data." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("clearAll") === "true";
    let id = searchParams.get("id");

    if (clearAll) {
      await clearAllRegistrations();
      return NextResponse.json({ ok: true, message: "All registration records cleared successfully." });
    }

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

export async function PATCH(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = body?.id || body?.registrationId;
    const action = body?.action;

    if (!id) {
      return NextResponse.json({ error: "Registration ID is required." }, { status: 400 });
    }

    if (action === "mark_paid") {
      const { markOfflineRegistrationPaid } = await import("@/lib/db");
      const updated = await markOfflineRegistrationPaid(String(id));
      if (!updated) {
        return NextResponse.json({ error: "Registration record not found." }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        message: `Registration ${id} marked as PAID.`,
        registration: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action requested." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update registration status." },
      { status: 500 }
    );
  }
}

