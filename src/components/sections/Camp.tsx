"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MapPin, Wallet, UserCheck, Check, Printer, ShieldCheck, FileText, Mail, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { SideMountains } from "@/components/SideMountains";
import { MountainDivider } from "@/components/MountainDivider";
import { camp, proficiencyOptions, feeLabel, feeAmountRupees, type CampDetail } from "@/data/camp";
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
      setStatus("idle");
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
        } else if (reg.status === "CANCELLED" || reg.status === "FAILED") {
          setStatus("idle");
          setError("Payment was cancelled or unsuccessful. You can try again when ready.");
          return;
        } else if (reg.status === "EXPIRED") {
          setStatus("idle");
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

  function fillRandomTestData() {
    const firstNames = [
      "Rohit", "Aayush", "Suraj", "Vikas", "Deepak", "Amit", "Pawan", "Rahul",
      "Karan", "Siddharth", "Manish", "Yash", "Aditya", "Shubham", "Gaurav", "Pankaj"
    ];
    const lastNames = [
      "Garhwali", "Rawat", "Negi", "Chauhan", "Joshi", "Bhandari", "Bisht", "Rana",
      "Verma", "Bhatt", "Kandari", "Uniyal", "Panwar", "Gairola", "Semwal"
    ];
    const cities = [
      "New Tehri", "Chamba", "Dehradun", "Rishikesh", "Narendranagar",
      "Dharasu", "Ghansali", "Srinagar Garhwal", "Kirti Nagar"
    ];

    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];

    const randomName = `${fn} ${ln}`;
    const randomMobile = "9" + Math.floor(100000003 + Math.random() * 899999990).toString();
    const randomEmail = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 999)}@gmail.com`;
    const randomAge = (17 + Math.floor(Math.random() * 14)).toString();
    const randomProficiency = proficiencyOptions[Math.floor(Math.random() * proficiencyOptions.length)];
    const randomAddress = `House #${Math.floor(Math.random() * 250 + 1)}, Main Road, ${city}, Tehri Garhwal, Uttarakhand`;

    setForm({
      name: randomName,
      email: randomEmail,
      mobile: randomMobile,
      age: randomAge,
      proficiency: randomProficiency,
      address: randomAddress,
    });
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const cleanMobile = form.mobile.trim();
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return fail("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
    }

    const cleanEmail = form.email.trim();
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      return fail("Please enter a valid email address (e.g. player@gmail.com).");
    }

    try {
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
      const sdkLoaded = await loadCashfreeSDK();
      if (!sdkLoaded || !window.Cashfree) {
        return fail("Could not load Cashfree Payment SDK. Please check internet connection.");
      }

      const cashfreeMode = env === "PRODUCTION" ? "production" : "sandbox";
      const cashfree = window.Cashfree({ mode: cashfreeMode });

      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result && result.error) {
        setStatus("idle");
        const errMsg = result.error.message || "";
        if (errMsg && !errMsg.toLowerCase().includes("close") && !errMsg.toLowerCase().includes("cancel")) {
          setError(errMsg);
        }
        return;
      }

      pollStatus(registrationId, 0);
    } catch (err) {
      setStatus("idle");
      fail(
        err instanceof Error ? err.message : "An unexpected error occurred during checkout."
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
              <div class="status-tag">Status: PAID · Cashfree Verified</div>
            </div>

            <div class="id-row">
              <span class="id-label">Registration Reference Code</span>
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
                <div class="label">Registration Fee</div>
                <div class="val amount" style="color: #34d399;">₹${successData.amount.toFixed(2)} (Paid)</div>
              </div>
              <div class="item">
                <div class="label">Payment Mode / ID</div>
                <div class="val" style="font-family: monospace; font-size: 11px; color: #38bdf8;">CASHFREE (${successData.cashfreePaymentId || successData.cashfreeOrderId})</div>
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
              <h3 className="text-2xl font-display uppercase tracking-wide text-navy-950">
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
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-ice-500 bg-ice-500/15 text-ice-400 shadow-glow-cyan">
                      <ShieldCheck className="h-8 w-8" />
                    </span>
                    <h3 className="mt-4 text-2xl font-display uppercase tracking-wide text-white font-bold">
                      Registration Successful!
                    </h3>
                    <p className="mt-1 text-xs text-ice-400 font-bold uppercase tracking-widest">
                      Registration Pass Generated · Cashfree Payment Verified
                    </p>
                  </div>

                  {/* Screenshot Proof Notice */}
                  <div className="bg-navy-950 border border-ice-500/40 p-4 rounded-xl text-center space-y-1.5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-ice-400 flex items-center justify-center gap-1.5">
                      📸 Important: Save Your Pass &amp; Reference Code
                    </p>
                    <p className="text-xs text-ice-200/80 leading-relaxed font-sans">
                      Your payment of ₹{successData.amount} has been verified via Cashfree. Save your Reference Code <strong className="text-white font-mono">{successData.registrationId}</strong> and present this pass at the trial center on trial day.
                    </p>
                  </div>

                  {/* Printable Receipt Card Details */}
                  <div className="bg-navy-950 border border-navy-700 p-6 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-navy-800 pb-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-ice-500 block">
                          Registration Reference Code
                        </span>
                        <span className="text-[11px] text-ice-200/60 font-sans">Show at trial center</span>
                      </div>
                      <span className="text-xl font-mono font-extrabold text-white tracking-widest bg-navy-900 border border-ice-500/40 px-3.5 py-1 rounded-lg">
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
                          Trial Fee
                        </span>
                        <p className="font-bold text-emerald-400 mt-0.5">
                          ₹{successData.amount.toFixed(2)} (Paid)
                        </p>
                      </div>
                      <div>
                        <span className="text-navy-400 uppercase font-bold text-[10px]">
                          Payment Status
                        </span>
                        <p className="font-mono text-[11px] text-emerald-400 font-bold mt-0.5">
                          PAID (Cashfree Verified)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 no-print">
                    <button
                      type="button"
                      onClick={handlePrintReceipt}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-navy-900 border border-ice-500/40 text-white py-3 text-xs font-bold uppercase tracking-wider rounded-lg hover:border-ice-500 transition-colors shadow-glow-cyan-sm"
                    >
                      <Printer className="h-4 w-4 text-ice-500" />
                      Save / Print Pass
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
                  <div className="flex items-center justify-between gap-3 flex-wrap border-b border-navy-800/80 pb-3">
                    <h3 className="text-2xl font-display uppercase tracking-wide text-ice-200">
                      Trials Registration
                    </h3>
                    <button
                      type="button"
                      onClick={fillRandomTestData}
                      className="inline-flex items-center gap-1.5 bg-navy-900 border border-ice-500/40 text-ice-400 hover:text-white hover:bg-ice-500/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-glow-cyan-sm"
                      title="Auto-fill form with random player test data"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-ice-400" />
                      Test Random Data
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 font-sans">
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="name">
                        Full Name *
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
                        placeholder="player@gmail.com"
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="mobile">
                        Mobile number *
                      </label>
                      <input
                        id="mobile"
                        type="tel"
                        pattern="[6-9][0-9]{9}"
                        maxLength={10}
                        className={fieldClass}
                        value={form.mobile}
                        onChange={update("mobile")}
                        required
                        placeholder="10-digit mobile (e.g. 9876543210)"
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
                        ? "Initiating Cashfree Payment..."
                        : `Proceed to Pay ₹${feeAmountRupees}`}
                    </span>
                  </button>
                  <p className="text-xs text-ice-200/70 font-sans leading-relaxed">
                    * Official registration fee of ₹{feeAmountRupees} processed securely via Cashfree Payments Gateway (UPI, Credit/Debit Cards, Netbanking, Wallets).
                  </p>
                </form>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Contact Us Section */}
        <div id="contact" className="mt-20 scroll-mt-24 pt-12 border-t border-navy-700/20">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-ice-500">
              Get In Touch
            </span>
            <h3 className="mt-2 text-3xl sm:text-4xl font-display uppercase tracking-wide text-navy-950 font-extrabold">
              Contact Tehri Titans
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-navy-800 font-sans font-medium">
              Have questions regarding trials, academy admissions, or sponsorships? Reach out directly to our team.
            </p>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            {/* General Queries Card */}
            <Reveal delay={0.05}>
              <div className="bg-navy-950 border border-navy-800 p-6 rounded-2xl shadow-xl flex items-start gap-4 hover:border-ice-500/50 transition-all duration-300 group">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ice-500/15 border border-ice-500/30 text-ice-400 group-hover:scale-105 transition-transform">
                  <Mail className="h-6 w-6 text-ice-400" />
                </span>
                <div className="space-y-1 font-sans">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ice-500 block">
                    General &amp; Trial Inquiries
                  </span>
                  <a
                    href="mailto:info@tehrititans.in"
                    className="text-base sm:text-lg font-bold text-white hover:text-ice-400 transition-colors block font-mono"
                  >
                    info@tehrititans.in
                  </a>
                  <p className="text-xs text-ice-200/70 leading-relaxed">
                    For player support, trial dates, eligibility, and pass verification.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Marketing & Media Card */}
            <Reveal delay={0.1}>
              <div className="bg-navy-950 border border-navy-800 p-6 rounded-2xl shadow-xl flex items-start gap-4 hover:border-ice-500/50 transition-all duration-300 group">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ice-500/15 border border-ice-500/30 text-ice-400 group-hover:scale-105 transition-transform">
                  <Mail className="h-6 w-6 text-ice-400" />
                </span>
                <div className="space-y-1 font-sans">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ice-500 block">
                    Marketing &amp; Sponsorships
                  </span>
                  <a
                    href="mailto:marketing@tehrititans.in"
                    className="text-base sm:text-lg font-bold text-white hover:text-ice-400 transition-colors block font-mono"
                  >
                    marketing@tehrititans.in
                  </a>
                  <p className="text-xs text-ice-200/70 leading-relaxed">
                    For brand partnerships, commercial inquiries, media, and press.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Mountain outline line-art section divider */}
      <MountainDivider className="mt-12 sm:mt-16" />
    </section>
  );
}
