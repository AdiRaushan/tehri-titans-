import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { fetchCashfreeOrder } from "@/lib/cashfree";

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

export type RegistrationStatus = "PENDING" | "PAID" | "EXPIRED" | "OFFLINE";
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

const EXPIRATION_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Returns writable storage path.
 * On Vercel & AWS Lambda Serverless environments, process.cwd() is read-only (/var/task).
 * We fallback to os.tmpdir() (/tmp/registrations.json) which is guaranteed writable.
 */
function getStorePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "registrations.json");
  }
  return path.join(process.cwd(), "registrations.json");
}

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
  else if (rawStatus === "OFFLINE") status = "OFFLINE";
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
    name: sanitizeName(String(raw.name || "")),
    email: String(raw.email || "").trim().toLowerCase(),
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

let memoryStore: RegistrationRecord[] | null = null;

/**
 * Reads all registrations from persistent file store or Supabase cloud store
 */
export async function readRegistrations(): Promise<RegistrationRecord[]> {
  let fileRecords: RegistrationRecord[] = [];
  const storePath = getStorePath();
  const seedPath = path.join(process.cwd(), "registrations.json");

  try {
    const content = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(content) as Record<string, unknown>[];
    fileRecords = parsed.map(migrateRecord);
  } catch {
    try {
      const seedContent = await fs.readFile(seedPath, "utf8");
      const parsedSeed = JSON.parse(seedContent) as Record<string, unknown>[];
      fileRecords = parsedSeed.map(migrateRecord);
    } catch {
      fileRecords = [];
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("registrations").select("*");
      if (!error && Array.isArray(data) && data.length > 0) {
        const supabaseRecords = data.map((row) =>
          migrateRecord({
            id: row.id,
            registrationId: row.registration_id,
            name: row.name,
            email: row.email,
            mobile: row.mobile,
            age: row.age,
            proficiency: row.proficiency,
            address: row.address,
            status: row.status,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            paidAt: row.paid_at,
            paymentAttempts: row.payment_attempts,
          })
        );

        const map = new Map<string, RegistrationRecord>();
        for (const r of fileRecords) map.set(r.registrationId, r);
        for (const r of supabaseRecords) map.set(r.registrationId, r);
        memoryStore = Array.from(map.values());
        return memoryStore;
      }
    } catch (err) {
      console.warn("Supabase read fallback to local JSON file:", err);
    }
  }

  memoryStore = fileRecords;
  return memoryStore;
}

/**
 * Sanitizes and formats player names cleanly to Title Case (Name Proofing)
 */
export function sanitizeName(input: string): string {
  if (!input) return "";
  const cleaned = input
    .replace(/[<>{}[\]\\\/]/g, "") // strip dangerous HTML/script tags
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(" ")
    .map((word) => {
      if (word.length === 0) return "";
      // Keep initial dot format e.g. D.K. or S.
      if (/^[a-zA-Z]\.$/.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

let writeQueueLock: Promise<void> = Promise.resolve();

/**
 * Writes registrations array atomically with writeQueueLock concurrency safety and Supabase cloud sync
 */
export async function writeRegistrations(records: RegistrationRecord[]): Promise<void> {
  memoryStore = records; // Keep in-memory cache instantly updated

  const supabase = getSupabaseClient();
  if (supabase && records.length > 0) {
    try {
      const rows = records.map((r) => ({
        id: r.id,
        registration_id: r.registrationId,
        name: r.name,
        email: r.email,
        mobile: r.mobile,
        age: r.age,
        proficiency: r.proficiency,
        address: r.address,
        status: r.status,
        created_at: r.createdAt,
        expires_at: r.expiresAt,
        paid_at: r.paidAt || null,
        payment_attempts: r.paymentAttempts,
      }));

      await supabase.from("registrations").upsert(rows, { onConflict: "id" });
    } catch (err) {
      console.warn("Supabase upsert sync error:", err);
    }
  }

  const task = writeQueueLock.then(async () => {
    let storePath = getStorePath();

    try {
      const dir = path.dirname(storePath);
      await fs.mkdir(dir, { recursive: true });
      const tempPath = `${storePath}.tmp.${Date.now()}`;
      await fs.writeFile(tempPath, JSON.stringify(records, null, 2), "utf8");
      await fs.rename(tempPath, storePath);
    } catch {
      try {
        const tmpPath = path.join(os.tmpdir(), "registrations.json");
        const dir = path.dirname(tmpPath);
        await fs.mkdir(dir, { recursive: true });
        const tempPath = `${tmpPath}.tmp.${Date.now()}`;
        await fs.writeFile(tempPath, JSON.stringify(records, null, 2), "utf8");
        await fs.rename(tempPath, tmpPath);
      } catch {
        // Silently preserve in memoryStore if filesystem is unavailable
      }
    }
  });

  writeQueueLock = task.catch(() => {});
  return task;
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

/**
 * Creates an offline registration record directly (saving registration info for offline venue payment)
 */
export async function createOfflineRegistration(data: {
  name: string;
  email: string;
  mobile: string;
  age: string;
  proficiency: string;
  address: string;
}): Promise<{ registration: RegistrationRecord; isNew: boolean }> {
  const records = await readRegistrations();
  const now = new Date();
  const cleanMobile = data.mobile.trim();
  const cleanEmail = data.email.trim().toLowerCase();

  // Check if player is already registered under this mobile or email
  const existing = records.find(
    (r) =>
      r.mobile === cleanMobile ||
      (cleanEmail && r.email.toLowerCase() === cleanEmail)
  );

  if (existing) {
    return { registration: existing, isNew: false };
  }

  const id = generateNextRegistrationId(records);
  const newRegistration: RegistrationRecord = {
    id,
    registrationId: id,
    name: sanitizeName(data.name),
    email: cleanEmail,
    mobile: cleanMobile,
    age: data.age.trim(),
    proficiency: data.proficiency.trim(),
    address: data.address.trim(),
    status: "OFFLINE",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    paymentAttempts: [
      {
        cashfreeOrderId: `OFFLINE-${id}`,
        amount: 999,
        status: "PENDING",
        paymentMethod: "Offline at Center",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ],
  };

  records.push(newRegistration);
  await writeRegistrations(records);
  return { registration: newRegistration, isNew: true };
}

/**
 * Deletes a registration record by Registration ID
 */
export async function deleteRegistration(queryStr: string): Promise<boolean> {
  const records = await readRegistrations();
  const query = queryStr.trim().toUpperCase();
  const queryDigits = query.replace(/\D/g, "");
  const initialLength = records.length;

  const target = records.find((r) => {
    const regId = (r.registrationId || "").trim().toUpperCase();
    const id = (r.id || "").trim().toUpperCase();
    if (regId === query || id === query) return true;
    if (queryDigits && regId.replace(/\D/g, "") === queryDigits && queryDigits.length > 0) return true;
    return false;
  });

  const filtered = records.filter((r) => {
    const regId = (r.registrationId || "").trim().toUpperCase();
    const id = (r.id || "").trim().toUpperCase();
    if (regId === query || id === query) return false;
    if (queryDigits && regId.replace(/\D/g, "") === queryDigits && queryDigits.length > 0) return false;
    return true;
  });

  if (filtered.length === initialLength) {
    return false;
  }

  const supabase = getSupabaseClient();
  if (supabase && target) {
    try {
      await supabase.from("registrations").delete().eq("id", target.id);
    } catch (err) {
      console.warn("Supabase delete error:", err);
    }
  }

  await writeRegistrations(filtered);
  return true;
}

/**
 * Clears all registration records from local store and Supabase cloud database
 */
export async function clearAllRegistrations(): Promise<void> {
  memoryStore = [];
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("registrations").delete().neq("id", "KEEP_NONE");
    } catch (err) {
      console.warn("Supabase clear error:", err);
    }
  }
  await writeRegistrations([]);
}
