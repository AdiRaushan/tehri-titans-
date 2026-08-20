"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
  FileSpreadsheet,
} from "lucide-react";
import { type RegistrationRecord } from "@/lib/db";

interface Stats {
  total: number;
  paid: number;
  pending: number;
  expired: number;
  totalRevenue: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    paid: 0,
    pending: 0,
    expired: 0,
    totalRevenue: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchRegistrations() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/registrations");
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.ok && data.ok) {
        setIsAuthenticated(true);
        setRecords(data.records || []);
        setStats(data.stats || { total: 0, paid: 0, pending: 0, expired: 0, totalRevenue: 0 });
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRegistrations();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Incorrect password.");
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        setPassword("");
        fetchRegistrations();
      }
    } catch {
      setLoginError("Login failed. Please check server.");
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mobile.includes(searchTerm) ||
      r.paymentAttempts.some((a) =>
        a.cashfreeOrderId.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "ALL" || r.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-navy-950 pt-28">
        <RefreshCw className="h-8 w-8 animate-spin text-navy-800" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 pt-28 pb-16 text-navy-950 font-sans">
        <div className="w-full max-w-md bg-slate-50 border border-slate-200 p-8 rounded-2xl shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-950 text-ice-400 shadow-md">
              <ShieldCheck className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-display uppercase tracking-tight text-navy-950 font-extrabold">
                Admin Portal
              </h1>
              <p className="text-xs text-slate-500 font-semibold">
                Tehri Titans Trials
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                className="w-full bg-white border border-slate-300 px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400 rounded-xl focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-600 font-bold">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-navy-950 text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl hover:bg-navy-900 transition-colors shadow-md"
            >
              {loading ? "Authenticating..." : "Access Admin Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-navy-950 font-sans pt-28 sm:pt-36 pb-16 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] bg-navy-950 text-ice-400 px-3 py-1 rounded-md">
              Management &amp; Audit Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-navy-950 font-extrabold mt-3">
              Registration Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchRegistrations}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-navy-800 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <a
              href="/api/admin/export-csv"
              className="inline-flex items-center gap-2 bg-navy-950 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-navy-900 transition-colors shadow-md"
            >
              <FileSpreadsheet className="h-4 w-4 text-ice-400" />
              Export CSV
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-emerald-50 border-2 border-emerald-500/40 p-5 rounded-2xl col-span-2 sm:col-span-1 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Confirmed (PAID)
            </span>
            <p className="text-3xl font-display font-extrabold text-emerald-950 mt-1">
              {stats.paid}
            </p>
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
              Official Registered Players
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Records
            </span>
            <p className="text-2xl font-display font-bold text-navy-950 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-600" /> Active (15-min Window)
            </span>
            <p className="text-2xl font-display font-bold text-amber-950 mt-1">
              {stats.pending}
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-rose-600" /> Expired / Abandoned
            </span>
            <p className="text-2xl font-display font-bold text-rose-950 mt-1">
              {stats.expired}
            </p>
          </div>

          <div className="bg-navy-950 border border-navy-900 p-5 rounded-2xl text-white col-span-2 sm:col-span-1 shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ice-400 flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4" /> Revenue (PAID)
            </span>
            <p className="text-2xl font-display font-bold text-white mt-1">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, mobile, order ID..."
              className="w-full bg-white border border-slate-300 pl-10 pr-4 py-2 text-xs text-navy-950 placeholder:text-slate-400 rounded-xl focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Filter Status:
            </span>
            {["ALL", "PAID", "PENDING", "EXPIRED"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  statusFilter === s
                    ? "bg-navy-950 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-navy-950 text-white font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Reg ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Player Details</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Role / Age</th>
                  <th className="p-4">Attempts</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4">Audit Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-semibold">
                      No registration records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    let badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
                    if (r.status === "PAID")
                      badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold";
                    if (r.status === "EXPIRED")
                      badgeClass = "bg-rose-100 text-rose-800 border-rose-300";

                    const isExpanded = expandedId === r.registrationId;
                    const attemptsCount = r.paymentAttempts?.length || 0;

                    return (
                      <React.Fragment key={r.registrationId}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-navy-950 text-sm">
                            {r.registrationId}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border ${badgeClass}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-navy-950">
                            <div className="text-sm">{r.name}</div>
                            <div className="text-[11px] text-slate-500 font-normal truncate max-w-[160px]">
                              {r.address}
                            </div>
                          </td>
                          <td className="p-4 text-navy-900 font-medium">
                            <div>{r.mobile}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{r.email}</div>
                          </td>
                          <td className="p-4 text-navy-900">
                            <div className="font-semibold">{r.proficiency}</div>
                            <div className="text-[11px] text-slate-500 font-normal">Age: {r.age}</div>
                          </td>
                          <td className="p-4 font-semibold text-navy-950">
                            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg text-slate-800 font-mono text-[11px]">
                              <History className="h-3 w-3 text-navy-700" />
                              {attemptsCount} attempt{attemptsCount === 1 ? "" : "s"}
                            </span>
                          </td>
                          <td className="p-4 text-[11px] text-slate-500 whitespace-nowrap">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : r.registrationId)}
                              className="inline-flex items-center gap-1 text-navy-900 hover:text-navy-700 font-bold uppercase text-[11px]"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-navy-950" /> : <ChevronDown className="h-4 w-4 text-navy-950" />}
                              Audit Log
                            </button>
                          </td>
                        </tr>

                        {/* Audit Log Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-100/90">
                            <td colSpan={8} className="p-4 border-t border-slate-300">
                              <div className="bg-white border border-slate-300 p-5 rounded-xl space-y-3 shadow-sm">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-2">
                                  <History className="h-4 w-4 text-navy-900" />
                                  Payment Attempt Trace History for {r.registrationId}
                                </h4>
                                <div className="space-y-2">
                                  {r.paymentAttempts.map((att, idx) => (
                                    <div
                                      key={att.cashfreeOrderId}
                                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-2"
                                    >
                                      <div>
                                        <span className="font-mono text-navy-950 font-bold">
                                          #{idx + 1} · Order ID: {att.cashfreeOrderId}
                                        </span>
                                        {att.cashfreePaymentId && (
                                          <div className="text-emerald-700 font-mono font-semibold text-[11px] mt-0.5">
                                            Payment ID: {att.cashfreePaymentId} ({att.paymentMethod || "online"})
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="font-bold text-navy-950">₹{att.amount.toFixed(2)}</span>
                                        <span
                                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                            att.status === "SUCCESS"
                                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                              : att.status === "CANCELLED"
                                              ? "bg-rose-100 text-rose-800 border-rose-300"
                                              : "bg-amber-100 text-amber-800 border-amber-300"
                                          }`}
                                        >
                                          {att.status}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          {new Date(att.createdAt).toLocaleTimeString("en-IN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
