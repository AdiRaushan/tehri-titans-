import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readRegistrations, generateRegistrationsCSV } from "@/lib/db";

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

  const records = await readRegistrations();
  const csv = generateRegistrationsCSV(records);

  const filename = `tehri_titans_registrations_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
