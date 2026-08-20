"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MapPin, Wallet, UserCheck, Check, Printer, ShieldCheck, FileText } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { SideMountains } from "@/components/SideMountains";
import { MountainDivider } from "@/components/MountainDivider";
import { camp, proficiencyOptions, feeLabel, type CampDetail } from "@/data/camp";
import { clsx } from "@/lib/clsx";

// Cashfree Web JS SDK v3 attaches constructor to window
declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_modal" | "_self" | "_blank";
      }) => Promise<{ error?: { message?: string } }>;
    };
  }
}

const CASHFREE_SDK_SCRIPT = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadCashfreeSDK(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (typeof window.Cashfree === "function") return resolve(true);

    const existingScript = document.querySelector(`script[src="${CASHFREE_SDK_SCRIPT}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      // Give it a brief grace period if already attached
      setTimeout(() => resolve(typeof window.Cashfree === "function"), 1000);
      return;
    }

    const script = document.createElement("script");
    script.src = CASHFREE_SDK_SCRIPT;
    script.async = true;
    script.onload = () => resolve(typeof window.Cashfree === "function");
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

const detailIcons: Record<string, typeof MapPin> = {
  Dates: CalendarDays,
  Venue: MapPin,
  Eligibility: UserCheck,
  Fee: Wallet,
};

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  age: "",
  proficiency: "",
  address: "",
};

export interface RegistrationSuccessData {
  registrationId: string;
  cashfreeOrderId: string;
  cashfreePaymentId?: string;
  name: string;
  email: string;
  mobile: string;
  proficiency: string;
  amount: number;
  paidAt?: string;
}

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "w-full rounded-xl border-2 border-ice-500/35 bg-navy-900/95 px-4 py-3 text-sm font-semibold text-white placeholder:text-ice-200/50 hover:border-ice-500/60 focus:border-ice-400 focus:bg-navy-900 focus:outline-none focus:ring-4 focus:ring-ice-500/25 transition-all duration-200 shadow-sm font-sans";
const labelClass =
  "mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-ice-400 font-sans";

export function Camp() {
  const reduced = useReducedMotion();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<RegistrationSuccessData | null>(null);

  const update =
    (key: keyof typeof form) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

  function fail(message: string) {
    setStatus("error");
    setError(message);
  }

  // Poll server verification until payment is confirmed
  async function pollStatus(regId: string, attempts = 0) {
    if (attempts > 12) {
      return fail(
        "Payment verification timed out. If money was deducted, your registration is safe — please contact support with your registration ID."
      );
    }

    try {
      const res = await fetch(`/api/cashfree/status/${regId}`);
      const data = await res.json();
      if (res.ok && data.registration) {
        const reg = data.registration;
        if (reg.status === "PAID") {
          const latestAttempt = reg.paymentAttempts?.[reg.paymentAttempts.length - 1];
          const successfulAttempt = reg.paymentAttempts?.find((a: { status: string }) => a.status === "SUCCESS") || latestAttempt;
          setSuccessData({
            registrationId: reg.registrationId,
            cashfreeOrderId: successfulAttempt?.cashfreeOrderId || "",
            cashfreePaymentId: successfulAttempt?.cashfreePaymentId || "",
            name: reg.name,
            email: reg.email,
            mobile: reg.mobile,
            proficiency: reg.proficiency,
            amount: successfulAttempt?.amount || 999,
            paidAt: reg.paidAt,
          });
          setStatus("success");
          setForm(emptyForm);
          return;
        } else if (reg.status === "EXPIRED") {
          return fail("Payment window (15 mins) expired. Please try submitting again to generate a new payment link.");
        }
      }
    } catch {
      // Ignore intermediate network glitch and continue polling
    }

    setTimeout(() => pollStatus(regId, attempts + 1), 2000);
  }

  // Check URL params for return redirect from Cashfree
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const regId = params.get("reg_id");

    if (regId) {
      setStatus("submitting");
      pollStatus(regId, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      // 1) Create Registration (PENDING) & Cashfree Order on Server
      const orderRes = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        return fail(orderData.error ?? "Could not initiate registration order.");
      }

      const { registrationId, paymentSessionId, env } = orderData;

      // 2) Load Cashfree SDK v3
      const sdkLoaded = await loadCashfreeSDK();
      if (!sdkLoaded || !window.Cashfree) {
        return fail("Could not load Cashfree Payment SDK. Please check connection.");
      }

      const cashfreeMode = env === "PRODUCTION" ? "production" : "sandbox";
      const cashfree = window.Cashfree({ mode: cashfreeMode });

      // 3) Open Cashfree Checkout Modal
      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_modal",
      });

      // 4) Poll server verification upon modal return/completion
      pollStatus(registrationId, 0);
    } catch (err) {
      fail(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  }

  function handlePrintReceipt() {
    if (typeof window === "undefined" || !successData) return;

    const printWin = window.open("", "_blank", "width=650,height=750");
    if (!printWin) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tehri Titans Receipt - ${successData.registrationId}</title>
          <style>
            @page { margin: 0; size: auto; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #01072F;
              color: #ffffff;
              margin: 0;
              padding: 32px 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .card {
              width: 100%;
              max-width: 500px;
              background-color: #000318;
              border: 2px solid #0ACFFB;
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 0 25px rgba(10, 207, 251, 0.2);
              box-sizing: border-box;
            }
            .brand-header {
              text-align: center;
              border-bottom: 1px solid #07196D;
              padding-bottom: 18px;
              margin-bottom: 20px;
            }
            .eyebrow {
              color: #0ACFFB;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.15em;
              text-transform: uppercase;
            }
            .title {
              font-size: 22px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: -0.02em;
              margin: 6px 0;
              color: #ffffff;
            }
            .status-tag {
              color: #34d399;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }
            .id-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #07196D;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .id-label {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #0ACFFB;
            }
            .id-val {
              font-family: monospace;
              font-size: 18px;
              font-weight: 800;
              color: #ffffff;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px 24px;
            }
            .item {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }
            .label {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #0ACFFB;
              margin-bottom: 4px;
            }
            .val {
              font-size: 14px;
              font-weight: 600;
              color: #ffffff;
              word-break: break-all;
            }
            .amount {
              color: #34d399;
              font-size: 16px;
              font-weight: 800;
            }
            .footer-note {
              margin-top: 28px;
              padding-top: 16px;
              border-top: 1px solid #07196D;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand-header">
              <div class="eyebrow">Tehri Titans · UPL Franchise</div>
              <div class="title">Registration Confirmed</div>
              <div class="status-tag">Payment Verified · Status: PAID</div>
            </div>

            <div class="id-row">
              <span class="id-label">Registration ID</span>
              <span class="id-val">${successData.registrationId}</span>
            </div>

            <div class="grid">
              <div class="item">
                <div class="label">Player Name</div>
                <div class="val">${successData.name}</div>
              </div>
              <div class="item">
                <div class="label">Mobile Number</div>
                <div class="val">${successData.mobile}</div>
              </div>
              <div class="item">
                <div class="label">Email Address</div>
                <div class="val">${successData.email}</div>
              </div>
              <div class="item">
                <div class="label">Cricket Role</div>
                <div class="val">${successData.proficiency}</div>
              </div>
              <div class="item">
                <div class="label">Amount Paid</div>
                <div class="val amount">₹${successData.amount.toFixed(2)}</div>
              </div>
              <div class="item">
                <div class="label">Cashfree Order ID</div>
                <div class="val" style="font-family: monospace; font-size: 11px;">${successData.cashfreeOrderId}</div>
              </div>
            </div>

            <div class="footer-note">
              Official Trial Entry Pass · Tehri Titans Franchise · Uttarakhand Premier League
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 200);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  }

  return (
    <section
      id="trials"
      className="relative scroll-mt-20 pt-20 pb-8 sm:pt-28 sm:pb-12 bg-white text-navy-950 overflow-hidden border-y border-navy-700/5"
    >
      {/* Side margin mountain outlines */}
      <SideMountains align="left" className="top-10 bottom-10" />
      <SideMountains align="right" className="top-24 bottom-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <SectionHeading
          eyebrow="Now Open · Trials Registration"
          title={camp.tagline}
          lede={camp.intro}
          align="center"
          theme="light"
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-5 lg:gap-14">
          {/* Camp details */}
          <div className="lg:col-span-2">
            <Reveal>
              <h3 className="text-2xl font-display uppercase tracking-tight text-navy-950">
                {camp.name}
              </h3>
            </Reveal>
            <dl className="mt-6 flex flex-col gap-5">
              {camp.details.map((d: CampDetail, i) => {
                const Icon = detailIcons[d.label] ?? CalendarDays;
                return (
                  <Reveal key={d.label} delay={i * 0.04}>
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-none border border-ice-500 bg-ice-500/10 text-ice-500 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-[0.15em] text-ice-500">
                          {d.label}
                        </dt>
                        <dd className="text-sm text-navy-900 font-semibold font-sans mt-0.5">
                          {d.value}
                        </dd>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </dl>

            <Reveal delay={0.1}>
              <div className="mt-8 border-t border-navy-700/10 pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-ice-500">
                  What to expect
                </p>
                <ul className="mt-3 flex flex-col gap-3 font-sans">
                  {camp.inclusions.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm text-navy-800 font-medium"
                    >
                      <Check className="h-4 w-4 flex-none text-ice-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Registration form & Cashfree checkout container */}
          <div className="lg:col-span-3">
            <GlassCard className="p-6 sm:p-8 border border-ice-500/30 shadow-glow-cyan-sm rounded-2xl" theme="dark">
              {status === "success" && successData ? (
                <motion.div
                  initial={reduced ? undefined : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6 font-sans printable-receipt"
                >
                  <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-navy-700/50">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-glow-cyan">
                      <ShieldCheck className="h-8 w-8" />
                    </span>
                    <h3 className="mt-4 text-2xl font-display uppercase tracking-tight text-white font-bold">
                      Registration Confirmed!
                    </h3>
                    <p className="mt-1 text-xs text-emerald-400 font-bold uppercase tracking-widest">
                      Payment Verified · Status: PAID
                    </p>
                  </div>

                  {/* Printable Receipt Card Details */}
                  <div className="bg-navy-950 border border-navy-700 p-6 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-navy-800 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-ice-500">
                        Registration ID
                      </span>
                      <span className="text-base font-mono font-bold text-white">
                        {successData.registrationId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-navy-400 uppercase font-bold text-[10px]">
                          Player Name
                        </span>
                        <p className="font-semibold text-white mt-0.5">
                          {successData.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-navy-400 uppercase font-bold text-[10px]">
                          Mobile
                        </span>
                        <p className="font-semibold text-white mt-0.5">
                          {successData.mobile}
                        </p>
                      </div>
                      <div>
                        <span className="text-navy-400 uppercase font-bold text-[10px]">
                          Email
                        </span>
                        <p className="font-semibold text-white mt-0.5 truncate">
                          {successData.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-navy-400 uppercase font-bold text-[10px]">
                          Cricket Role
                        </span>
                        <p className="font-semibold text-white mt-0.5">
                          {successData.proficiency}
                        </p>
                      </div>
                      <div>
                        <span className="text-navy-400 uppercase font-bold text-[10px]">
                          Amount Paid
                        </span>
                        <p className="font-bold text-emerald-400 mt-0.5">
                          ₹{successData.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-navy-400 uppercase font-bold text-[10px]">
                          Cashfree Order ID
                        </span>
                        <p className="font-mono text-[11px] text-ice-200/80 mt-0.5 truncate">
                          {successData.cashfreeOrderId}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 no-print">
                    <button
                      type="button"
                      onClick={handlePrintReceipt}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-navy-800 border border-navy-700 py-3 text-xs font-bold uppercase tracking-wider text-white rounded-lg hover:bg-navy-750 transition-colors"
                    >
                      <Printer className="h-4 w-4 text-ice-500" />
                      Print Receipt
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatus("idle");
                        setSuccessData(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-ice-500 text-navy-950 py-3 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ice-400 transition-colors shadow-glow-cyan-sm"
                    >
                      <FileText className="h-4 w-4" />
                      Register Another Player
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-5">
                  <h3 className="text-2xl font-display uppercase tracking-tight text-ice-200">
                    Trials Registration
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="name">
                        Full name *
                      </label>
                      <input
                        id="name"
                        className={fieldClass}
                        value={form.name}
                        onChange={update("name")}
                        required
                        placeholder="Full name"
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="email">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={fieldClass}
                        value={form.email}
                        onChange={update("email")}
                        required
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="mobile">
                        Mobile number *
                      </label>
                      <input
                        id="mobile"
                        type="tel"
                        className={fieldClass}
                        value={form.mobile}
                        onChange={update("mobile")}
                        required
                        placeholder="10-digit mobile"
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="age">
                        Age *
                      </label>
                      <input
                        id="age"
                        type="number"
                        min={16}
                        max={99}
                        className={fieldClass}
                        value={form.age}
                        onChange={update("age")}
                        required
                        placeholder="16 or above"
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="proficiency">
                        Proficiency in cricket *
                      </label>
                      <select
                        id="proficiency"
                        className={fieldClass}
                        value={form.proficiency}
                        onChange={update("proficiency")}
                        required
                      >
                        <option value="">Select</option>
                        {proficiencyOptions.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="address">
                        Address *
                      </label>
                      <textarea
                        id="address"
                        rows={3}
                        className={fieldClass}
                        value={form.address}
                        onChange={update("address")}
                        required
                        placeholder="Your full residential address"
                      />
                    </div>
                  </div>

                  {status === "error" && (
                    <p className="text-sm text-red-500 font-semibold font-sans">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className={clsx(
                      "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 skew-x-[-12deg] focus-visible:ring-2 focus-visible:ring-ice-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
                      "bg-ice-500 text-navy-950 hover:bg-ice-400 shadow-glow-cyan-sm hover:shadow-glow-cyan"
                    )}
                  >
                    <span className="skew-x-[12deg] inline-flex items-center gap-2">
                      {status === "submitting"
                        ? "Processing Payment…"
                        : `Pay ${feeLabel} & Register with Cashfree`}
                    </span>
                  </button>
                  <p className="text-xs text-ice-200/50 font-sans">
                    * Required. Secure payment via Cashfree Payment Gateway — UPI, cards &amp; netbanking.
                  </p>
                </form>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Mountain outline line-art section divider */}
      <MountainDivider className="mt-12 sm:mt-16" />
    </section>
  );
}
