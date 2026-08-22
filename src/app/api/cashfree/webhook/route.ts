import { NextResponse } from "next/server";
import {
  updateRegistrationPaymentStatus,
  getRegistrationById,
} from "@/lib/db";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { sendRegistrationConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("x-webhook-signature") || "";
  const timestamp = request.headers.get("x-webhook-timestamp") || "";

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid webhook body" }, { status: 400 });
  }

  // 1) Verify Cashfree HMAC signature
  const isValid = verifyCashfreeWebhookSignature(rawBody, timestamp, signature);
  if (!isValid) {
    console.warn("Cashfree Webhook Signature Verification Failed");
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const data = (payload.data || {}) as Record<string, unknown>;
  const order = (data.order || {}) as Record<string, unknown>;
  const payment = (data.payment || {}) as Record<string, unknown>;

  const orderId = String(order.order_id || "").trim();
  const paymentId = String(payment.cf_payment_id || "").trim();
  const rawStatus = String(payment.payment_status || "").toUpperCase();
  const paymentGroup = String(payment.payment_group || "").toLowerCase();

  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  // Find existing registration record
  const existing = await getRegistrationById(orderId);
  if (!existing) {
    console.warn(`Webhook received for non-existent order ID: ${orderId}`);
    return NextResponse.json({ status: "OK", message: "Record not found" }, { status: 200 });
  }

  let newStatus: "PAID" | "FAILED" | "CANCELLED" = "FAILED";
  if (rawStatus === "SUCCESS") {
    newStatus = "PAID";
  } else if (rawStatus === "USER_DROPPED") {
    newStatus = "CANCELLED";
  }

  // 2) Idempotently update registration record in DB
  const updated = await updateRegistrationPaymentStatus(orderId, newStatus, {
    cashfreePaymentId: paymentId,
    paymentMethod: paymentGroup,
  });

  if (newStatus === "PAID" && updated) {
    await sendRegistrationConfirmationEmail({
      registration: updated,
      cashfreePaymentId: paymentId,
      amount: Number(order.order_amount) || 999,
    });
  }

  return NextResponse.json({ status: "OK", orderId, registrationId: existing.registrationId });
}
