import { NextResponse } from "next/server";
import {
  getRegistrationById,
  updateRegistrationPaymentStatus,
  cleanupExpiredRegistrations,
} from "@/lib/db";
import { fetchCashfreeOrder } from "@/lib/cashfree";
import { sendRegistrationConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  if (!id) {
    return NextResponse.json({ error: "Registration ID is required." }, { status: 400 });
  }

  // 1) Trigger auto-cleanup engine for expired registrations
  await cleanupExpiredRegistrations();

  let registration = await getRegistrationById(id);
  if (!registration) {
    return NextResponse.json({ error: "Registration record not found." }, { status: 404 });
  }

  // 2) Check if registration is PAID or check live Cashfree API
  if (registration.status === "PAID") {
    await sendRegistrationConfirmationEmail({
      registration,
      cashfreePaymentId: registration.paymentAttempts.find((a) => a.status === "SUCCESS")?.cashfreePaymentId,
      amount: 999,
    });
  } else if (registration.status === "PENDING") {
    for (const attempt of registration.paymentAttempts) {
      if (attempt.cashfreeOrderId) {
        const liveOrder = await fetchCashfreeOrder(attempt.cashfreeOrderId);
        if (liveOrder && liveOrder.order_status === "PAID") {
          const updated = await updateRegistrationPaymentStatus(
            attempt.cashfreeOrderId,
            "PAID"
          );
          if (updated) {
            registration = updated;
            await sendRegistrationConfirmationEmail({
              registration,
              cashfreePaymentId: liveOrder?.cf_order_id,
              amount: liveOrder?.order_amount || 999,
            });
            break;
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, registration });
}
