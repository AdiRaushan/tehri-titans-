import { promises as fs } from "fs";
import path from "path";
import { fetchCashfreeOrder } from "@/lib/cashfree";

export type RegistrationStatus = "PENDING" | "PAID" | "EXPIRED";
export type PaymentAttemptStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface PaymentAttempt {
  cashfreeOrderId: string;
  cashfreePaymentId?: string;
  paymentSessionId?: string;
  amount: number;
  status: PaymentAttemptStatus;
  paymentMethod?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface RegistrationRecord {
  id: string; // e.g. "TT-000001"
  registrationId: string;
  name: string;
  email: string;
  mobile: string;
  age: string;
  proficiency: string;
  address: string;
  status: RegistrationStatus;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string (15 minutes after creation/last attempt)
  paidAt?: string; // ISO string
  paymentAttempts: PaymentAttempt[];
}

const STORE_PATH = path.join(process.cwd(), "registrations.json");
const EXPIRATION_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Migrates old legacy records into the new schema cleanly
 */
function migrateRecord(raw: Record<string, unknown>): RegistrationRecord {
  const attempts: PaymentAttempt[] = Array.isArray(raw.paymentAttempts)
    ? (raw.paymentAttempts as PaymentAttempt[])
    : [];

  // Migration for legacy single-order schema
  if (attempts.length === 0 && raw.cashfreeOrderId) {
    const rawStatus = String(raw.status || "").toUpperCase();
    let attemptStatus: PaymentAttemptStatus = "PENDING";
    if (rawStatus === "PAID") attemptStatus = "SUCCESS";
    if (rawStatus === "FAILED") attemptStatus = "FAILED";
    if (rawStatus === "CANCELLED") attemptStatus = "CANCELLED";

    attempts.push({
      cashfreeOrderId: String(raw.cashfreeOrderId),
      cashfreePaymentId: raw.cashfreePaymentId ? String(raw.cashfreePaymentId) : undefined,
      paymentSessionId: raw.paymentSessionId ? String(raw.paymentSessionId) : undefined,
      amount: Number(raw.amount) || 999,
      status: attemptStatus,
      paymentMethod: raw.paymentMethod ? String(raw.paymentMethod) : undefined,
      createdAt: String(raw.createdAt || new Date().toISOString()),
      updatedAt: String(raw.paidAt || raw.createdAt || new Date().toISOString()),
    });
  }

  const rawStatus = String(raw.status || "").toUpperCase();
  let status: RegistrationStatus = "PENDING";
  if (rawStatus === "PAID") status = "PAID";
  else if (rawStatus === "EXPIRED" || rawStatus === "FAILED" || rawStatus === "CANCELLED") {
    status = "EXPIRED";
  }

  const createdAt = String(raw.createdAt || new Date().toISOString());
  const expiresAt = String(
    raw.expiresAt || new Date(new Date(createdAt).getTime() + EXPIRATION_WINDOW_MS).toISOString()
  );

  return {
    id: String(raw.id || raw.registrationId || "TT-000000"),
    registrationId: String(raw.registrationId || raw.id || "TT-000000"),
    name: String(raw.name || "").trim(),
    email: String(raw.email || "").trim(),
    mobile: String(raw.mobile || "").trim(),
    age: String(raw.age || "").trim(),
    proficiency: String(raw.proficiency || "").trim(),
    address: String(raw.address || "").trim(),
    status,
    createdAt,
    expiresAt,
    paidAt: raw.paidAt ? String(raw.paidAt) : undefined,
    paymentAttempts: attempts,
  };
}

/**
 * Reads all registrations from persistent file store
 */
export async function readRegistrations(): Promise<RegistrationRecord[]> {
  try {
    const content = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(content) as Record<string, unknown>[];
    return parsed.map(migrateRecord);
  } catch {
    return [];
  }
}

/**
 * Writes registrations array atomically to file store
 */
export async function writeRegistrations(records: RegistrationRecord[]): Promise<void> {
  const dir = path.dirname(STORE_PATH);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = `${STORE_PATH}.tmp.${Date.now()}`;
  await fs.writeFile(tempPath, JSON.stringify(records, null, 2), "utf8");
  await fs.rename(tempPath, STORE_PATH);
}

/**
 * Generates next padded registration ID, e.g. "TT-000001"
 */
export function generateNextRegistrationId(records: RegistrationRecord[]): string {
  let maxNum = 0;
  for (const r of records) {
    const match = r.registrationId?.match(/^TT-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = maxNum + 1;
  return `TT-${String(nextNum).padStart(6, "0")}`;
}

/**
 * Finds or creates a registration record for a player.
 * If user retries payment within an active window, reuses existing Registration ID
 * and appends a new PaymentAttempt instead of creating duplicate profiles.
 */
export async function findOrCreateRegistrationAndAttempt(data: {
  name: string;
  email: string;
  mobile: string;
  age: string;
  proficiency: string;
  address: string;
  cashfreeOrderId: string;
  paymentSessionId?: string;
  amount: number;
}): Promise<{ registration: RegistrationRecord; isNewRegistration: boolean }> {
  const records = await readRegistrations();
  const now = new Date();
  const cleanMobile = data.mobile.trim();
  const cleanEmail = data.email.trim().toLowerCase();

  // Check if player is ALREADY PAID
  const existingPaid = records.find(
    (r) =>
      r.status === "PAID" &&
      (r.mobile === cleanMobile || r.email.toLowerCase() === cleanEmail)
  );
  if (existingPaid) {
    throw new Error(
      `Player is already registered and confirmed under ID ${existingPaid.registrationId}.`
    );
  }

  // Check if active PENDING registration exists for this user
  const existingPendingIndex = records.findIndex(
    (r) =>
      r.status === "PENDING" &&
      (r.mobile === cleanMobile || r.email.toLowerCase() === cleanEmail) &&
      new Date(r.expiresAt).getTime() > now.getTime()
  );

  const newAttempt: PaymentAttempt = {
    cashfreeOrderId: data.cashfreeOrderId,
    paymentSessionId: data.paymentSessionId,
    amount: data.amount,
    status: "PENDING",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (existingPendingIndex !== -1) {
    // Reuse existing registration & append attempt
    const existing = records[existingPendingIndex];
    const newExpiresAt = new Date(now.getTime() + EXPIRATION_WINDOW_MS).toISOString();

    const updated: RegistrationRecord = {
      ...existing,
      name: data.name.trim() || existing.name,
      age: data.age.trim() || existing.age,
      proficiency: data.proficiency.trim() || existing.proficiency,
      address: data.address.trim() || existing.address,
      expiresAt: newExpiresAt,
      paymentAttempts: [...existing.paymentAttempts, newAttempt],
    };

    records[existingPendingIndex] = updated;
    await writeRegistrations(records);
    return { registration: updated, isNewRegistration: false };
  }

  // Create brand new Registration Record
  const id = generateNextRegistrationId(records);
  const expiresAt = new Date(now.getTime() + EXPIRATION_WINDOW_MS).toISOString();

  const newRegistration: RegistrationRecord = {
    id,
    registrationId: id,
    name: data.name.trim(),
    email: cleanEmail,
    mobile: cleanMobile,
    age: data.age.trim(),
    proficiency: data.proficiency.trim(),
    address: data.address.trim(),
    status: "PENDING",
    createdAt: now.toISOString(),
    expiresAt,
    paymentAttempts: [newAttempt],
  };

  records.push(newRegistration);
  await writeRegistrations(records);
  return { registration: newRegistration, isNewRegistration: true };
}

/**
 * Retrieves a registration record by Registration ID, Cashfree Order ID, or Payment ID
 */
export async function getRegistrationById(
  queryStr: string
): Promise<RegistrationRecord | null> {
  const records = await readRegistrations();
  const query = queryStr.trim().toUpperCase();

  for (const r of records) {
    if (r.registrationId.toUpperCase() === query || r.id.toUpperCase() === query) {
      return r;
    }
    const hasOrder = r.paymentAttempts.some(
      (a) =>
        a.cashfreeOrderId.toUpperCase() === query ||
        (a.cashfreePaymentId && a.cashfreePaymentId.toUpperCase() === query)
    );
    if (hasOrder) return r;
  }
  return null;
}

/**
 * Updates payment attempt and registration status idempotently.
 * Safe against delayed webhooks and handles EXPIRED -> PAID transitions seamlessly.
 */
export async function updateRegistrationPaymentStatus(
  orderId: string,
  newStatus: "PAID" | "FAILED" | "CANCELLED",
  details?: {
    cashfreePaymentId?: string;
    paymentMethod?: string;
  }
): Promise<RegistrationRecord | null> {
  const records = await readRegistrations();
  const nowStr = new Date().toISOString();
  let targetIndex = -1;
  let targetAttemptIndex = -1;

  for (let i = 0; i < records.length; i++) {
    const attIdx = records[i].paymentAttempts.findIndex(
      (a) => a.cashfreeOrderId.toUpperCase() === orderId.trim().toUpperCase()
    );
    if (attIdx !== -1) {
      targetIndex = i;
      targetAttemptIndex = attIdx;
      break;
    }
  }

  if (targetIndex === -1) return null;

  const reg = records[targetIndex];
  const attempt = reg.paymentAttempts[targetAttemptIndex];

  // Map to attempt status
  let attemptStatus: PaymentAttemptStatus = "PENDING";
  if (newStatus === "PAID") attemptStatus = "SUCCESS";
  else if (newStatus === "FAILED") attemptStatus = "FAILED";
  else if (newStatus === "CANCELLED") attemptStatus = "CANCELLED";

  const updatedAttempt: PaymentAttempt = {
    ...attempt,
    status: attemptStatus,
    cashfreePaymentId: details?.cashfreePaymentId || attempt.cashfreePaymentId,
    paymentMethod: details?.paymentMethod || attempt.paymentMethod,
    updatedAt: nowStr,
  };

  const updatedAttempts = [...reg.paymentAttempts];
  updatedAttempts[targetAttemptIndex] = updatedAttempt;

  let finalRegStatus = reg.status;

  // Handle PAID transition (works for PENDING and delayed webhooks on EXPIRED records)
  if (newStatus === "PAID") {
    finalRegStatus = "PAID";
  }

  const updatedReg: RegistrationRecord = {
    ...reg,
    status: finalRegStatus,
    paidAt: finalRegStatus === "PAID" ? reg.paidAt || nowStr : reg.paidAt,
    paymentAttempts: updatedAttempts,
  };

  records[targetIndex] = updatedReg;
  await writeRegistrations(records);
  return updatedReg;
}

/**
 * Server-side cleanup engine: Checks PENDING registrations whose 15-minute window has passed.
 * Verifies with Cashfree API before marking any registration EXPIRED.
 */
export async function cleanupExpiredRegistrations(): Promise<number> {
  const records = await readRegistrations();
  const nowMs = Date.now();
  let modifiedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const reg = records[i];
    if (reg.status === "PENDING" && new Date(reg.expiresAt).getTime() < nowMs) {
      let foundSuccessfulPayment = false;

      // Double-check with Cashfree API for every attempt before marking EXPIRED
      for (const attempt of reg.paymentAttempts) {
        if (attempt.cashfreeOrderId) {
          const cfOrder = await fetchCashfreeOrder(attempt.cashfreeOrderId);
          if (cfOrder && cfOrder.order_status === "PAID") {
            foundSuccessfulPayment = true;
            attempt.status = "SUCCESS";
            break;
          }
        }
      }

      if (foundSuccessfulPayment) {
        records[i].status = "PAID";
        records[i].paidAt = records[i].paidAt || new Date().toISOString();
      } else {
        records[i].status = "EXPIRED";
      }
      modifiedCount++;
    }
  }

  if (modifiedCount > 0) {
    await writeRegistrations(records);
  }

  return modifiedCount;
}

/**
 * Generates clean CSV output for Excel / Google Sheets export
 */
export function generateRegistrationsCSV(records: RegistrationRecord[]): string {
  const headers = [
    "Registration ID",
    "Registration Status",
    "Name",
    "Email",
    "Mobile",
    "Age",
    "Proficiency",
    "Address",
    "Total Attempts",
    "Latest Cashfree Order ID",
    "Cashfree Payment ID",
    "Payment Method",
    "Amount (INR)",
    "Created Date",
    "Expiration Date",
    "Payment Confirmed Date",
  ];

  const escapeCSV = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r) => {
    const latestAttempt = r.paymentAttempts[r.paymentAttempts.length - 1];
    const successfulAttempt = r.paymentAttempts.find((a) => a.status === "SUCCESS") || latestAttempt;

    return [
      r.registrationId,
      r.status,
      r.name,
      r.email,
      r.mobile,
      r.age,
      r.proficiency,
      r.address,
      r.paymentAttempts.length,
      latestAttempt?.cashfreeOrderId || "",
      successfulAttempt?.cashfreePaymentId || "",
      successfulAttempt?.paymentMethod || "",
      (latestAttempt?.amount || 999).toFixed(2),
      r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "",
      r.expiresAt ? new Date(r.expiresAt).toLocaleString("en-IN") : "",
      r.paidAt ? new Date(r.paidAt).toLocaleString("en-IN") : "",
    ]
      .map(escapeCSV)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}
