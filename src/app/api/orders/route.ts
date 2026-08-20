import { NextResponse } from "next/server";
import { feeAmountPaise } from "@/data/camp";

// Creates a Razorpay order for the trials fee. The registration is NOT saved
// here — it is saved only after the payment signature is verified in /api/verify.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED = ["name", "age", "proficiency", "mobile", "address"] as const;

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const missing = REQUIRED.filter((k) => !String(body[k] ?? "").trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Please fill the required fields: ${missing.join(", ")}.` },
      { status: 400 },
    );
  }
  if (Number(body.age) < 16) {
    return NextResponse.json(
      { error: "Trials are open to players aged 16 and above." },
      { status: 400 },
    );
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: feeAmountPaise,
        currency: "INR",
        receipt: `trials_${Date.now()}`,
        notes: { name: String(body.name), mobile: String(body.mobile) },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not start the payment. Please try again." },
        { status: 502 },
      );
    }

    const order = await res.json();
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the payment service. Please try again." },
      { status: 502 },
    );
  }
}
