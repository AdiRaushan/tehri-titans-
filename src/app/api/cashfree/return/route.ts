import { NextResponse } from "next/server";
import { getRegistrationById, updateRegistrationPaymentStatus } from "@/lib/db";
import { fetchCashfreeOrder } from "@/lib/cashfree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id") || "";

  if (!orderId) {
    return NextResponse.redirect(new URL("/#trials", request.url));
  }

  // Fetch registration
  let reg = await getRegistrationById(orderId);
  if (!reg) {
    return NextResponse.redirect(new URL("/#trials", request.url));
  }

  // Double-check status from Cashfree API
  const cfOrder = await fetchCashfreeOrder(orderId);
  if (cfOrder && cfOrder.order_status === "PAID") {
    reg = (await updateRegistrationPaymentStatus(orderId, "PAID")) || reg;
  }

  const redirectUrl = new URL("/#trials", request.url);
  redirectUrl.searchParams.set("reg_id", reg.registrationId);
  redirectUrl.searchParams.set("status", reg.status.toLowerCase());

  return NextResponse.redirect(redirectUrl);
}
