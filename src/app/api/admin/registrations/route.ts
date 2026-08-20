import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readRegistrations, cleanupExpiredRegistrations } from "@/lib/db";

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

  // Compute stats (Count ONLY PAID as confirmed registrations)
  let total = records.length;
  let paid = 0;
  let pending = 0;
  let expired = 0;
  let totalRevenue = 0;

  for (const r of records) {
    if (r.status === "PAID") {
      paid++;
      totalRevenue += 999; // ₹999 per confirmed registration
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
      pending,
      expired,
      totalRevenue,
    },
    records,
  });
}
