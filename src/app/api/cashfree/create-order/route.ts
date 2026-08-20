import { NextResponse } from "next/server";
import { findOrCreateRegistrationAndAttempt } from "@/lib/db";
import { createCashfreeOrder, getCashfreeConfig } from "@/lib/cashfree";
import { feeAmountRupees } from "@/data/camp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_FIELDS = [
  "name",
  "email",
  "mobile",
  "age",
  "proficiency",
  "address",
] as const;

export async function POST(request: Request) {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    return NextResponse.json(
      {
        error:
          "Cashfree Payment Gateway is not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env.local",
      },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 1) Validate required fields
  const missing = REQUIRED_FIELDS.filter(
    (k) => !String(body[k] ?? "").trim()
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Please fill in all required fields: ${missing.join(", ")}.` },
      { status: 400 }
    );
  }

  const name = String(body.name).trim();
  const email = String(body.email).trim().toLowerCase();
  const mobile = String(body.mobile).replace(/\D/g, "").slice(-10);
  const age = String(body.age).trim();
  const proficiency = String(body.proficiency).trim();
  const address = String(body.address).trim();

  // Basic validation
  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (mobile.length !== 10) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit mobile number." },
      { status: 400 }
    );
  }
  if (Number(age) < 16) {
    return NextResponse.json(
      { error: "Trials are open to players aged 16 and above." },
      { status: 400 }
    );
  }

  // 2) Server-side enforced payment amount
  const amount = feeAmountRupees || 999;

  // Generate unique Cashfree order ID per attempt
  const cashfreeOrderId = `CF_TT_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  try {
    // 3) Create Cashfree Order v3 via REST API
    const cfOrder = await createCashfreeOrder({
      orderId: cashfreeOrderId,
      orderAmount: amount,
      customerDetails: {
        customerId: `CUST_${mobile || Date.now()}`,
        customerName: name,
        customerEmail: email,
        customerPhone: mobile,
      },
    });

    // 4) Find existing PENDING registration or create a new one (15-min expiration window)
    const { registration } = await findOrCreateRegistrationAndAttempt({
      name,
      email,
      mobile,
      age,
      proficiency,
      address,
      cashfreeOrderId: cfOrder.order_id,
      paymentSessionId: cfOrder.payment_session_id,
      amount,
    });

    return NextResponse.json({
      ok: true,
      registrationId: registration.registrationId,
      orderId: cfOrder.order_id,
      paymentSessionId: cfOrder.payment_session_id,
      expiresAt: registration.expiresAt,
      env: config.env,
    });
  } catch (err) {
    console.error("Error initiating registration order:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create Cashfree payment order. Please try again.",
      },
      { status: 400 }
    );
  }
}
