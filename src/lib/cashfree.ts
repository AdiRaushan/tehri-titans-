import crypto from "crypto";

export interface CashfreeOrderParams {
  orderId: string;
  orderAmount: number;
  customerDetails: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  returnUrl?: string;
}

export interface CashfreeOrderResponse {
  order_id: string;
  payment_session_id: string;
  order_status: string;
  order_amount: number;
  order_currency: string;
  cf_order_id?: string;
}

export function getCashfreeConfig() {
  const appId = (process.env.CASHFREE_APP_ID || "").trim();
  const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();
  const env = (process.env.CASHFREE_ENV || "SANDBOX").trim().toUpperCase();

  const missingVars: string[] = [];
  if (!appId) missingVars.push("CASHFREE_APP_ID");
  if (!secretKey) missingVars.push("CASHFREE_SECRET_KEY");

  const baseUrl =
    env === "PRODUCTION"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

  return {
    appId,
    secretKey,
    env,
    baseUrl,
    isConfigured: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Creates a Cashfree Order v3 via REST API
 */
export async function createCashfreeOrder(
  params: CashfreeOrderParams
): Promise<CashfreeOrderResponse> {
  const config = getCashfreeConfig();

  if (!config.isConfigured) {
    throw new Error(
      "Cashfree PG credentials are not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env.local"
    );
  }

  const websiteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3010";
  let returnUrl =
    params.returnUrl ||
    `${websiteUrl}/api/cashfree/return?order_id={order_id}`;

  // Cashfree Production API strictly requires return_url to start with https://
  if (config.env === "PRODUCTION" && returnUrl.startsWith("http://")) {
    returnUrl = returnUrl.replace(/^http:\/\//, "https://");
  }

  // Clean phone number (remove leading +91 or spaces, Cashfree expects 10 digits)
  const phoneClean = params.customerDetails.customerPhone
    .replace(/\D/g, "")
    .slice(-10);

  const payload = {
    order_id: params.orderId,
    order_amount: params.orderAmount,
    order_currency: "INR",
    customer_details: {
      customer_id: params.customerDetails.customerId,
      customer_name: params.customerDetails.customerName,
      customer_email: params.customerDetails.customerEmail,
      customer_phone: phoneClean,
    },
    order_meta: {
      return_url: returnUrl,
    },
  };

  const response = await fetch(`${config.baseUrl}/orders`, {
    method: "POST",
    headers: {
      "x-client-id": config.appId,
      "x-client-secret": config.secretKey,
      "x-api-version": "2023-08-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Cashfree Order Creation Error:", data);
    throw new Error(data?.message || "Failed to create Cashfree Order.");
  }

  return data as CashfreeOrderResponse;
}

/**
 * Fetches Cashfree Order details from Cashfree API
 */
export async function fetchCashfreeOrder(
  orderId: string
): Promise<CashfreeOrderResponse | null> {
  const config = getCashfreeConfig();
  if (!config.isConfigured) return null;

  try {
    const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "x-client-id": config.appId,
        "x-client-secret": config.secretKey,
        "x-api-version": "2023-08-01",
      },
    });

    if (!response.ok) return null;
    return (await response.json()) as CashfreeOrderResponse;
  } catch (err) {
    console.error("Error fetching Cashfree Order:", err);
    return null;
  }
}

/**
 * Verifies Cashfree Webhook signature using HMAC-SHA256
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const config = getCashfreeConfig();
  if (!config.secretKey || !timestamp || !signature) return false;

  try {
    // Signature payload = timestamp + rawBody
    const dataToSign = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac("sha256", config.secretKey)
      .update(dataToSign)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}
