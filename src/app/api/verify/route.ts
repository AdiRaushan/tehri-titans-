import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Verifies the Razorpay payment signature, and ONLY on success saves the
// registration (with payment reference) to the local store.
// NOTE: on serverless hosts the filesystem is ephemeral — swap this store for a
// database before deploying to production.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORE = path.join(process.cwd(), "registrations.json");
const REQUIRED = ["name", "age", "proficiency", "mobile", "address"] as const;

async function readAll(): Promise<Record<string, unknown>[]> {
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8"));
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    registration?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  // Signature = HMAC_SHA256(order_id | payment_id, key_secret)
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(razorpay_signature),
    );

  if (!valid) {
    return NextResponse.json(
      { error: "Payment could not be verified." },
      { status: 400 },
    );
  }

  const reg = body.registration ?? {};
  const missing = REQUIRED.filter((k) => !String(reg[k] ?? "").trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing registration fields: ${missing.join(", ")}.` },
      { status: 400 },
    );
  }

  const entry = {
    name: String(reg.name ?? "").trim(),
    age: String(reg.age ?? "").trim(),
    proficiency: String(reg.proficiency ?? "").trim(),
    mobile: String(reg.mobile ?? "").trim(),
    address: String(reg.address ?? "").trim(),
    payment: {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: "paid",
    },
    submittedAt: new Date().toISOString(),
  };

  try {
    const all = await readAll();
    all.push(entry);
    await fs.writeFile(STORE, JSON.stringify(all, null, 2), "utf8");
  } catch {
    return NextResponse.json(
      {
        error:
          "Payment succeeded but we could not save your registration. Please contact us with your payment ID.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, paymentId: razorpay_payment_id }, { status: 201 });
}
