"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Trash2,
  UserCheck,
  AlertCircle,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { type RegistrationRecord } from "@/lib/db";

interface Stats {
  total: number;
  paid: number;
  offline: number;
  pending: number;
  expired: number;
  totalRevenue: number;
}

export type SortOption =
  | "date_desc"
  | "date_asc"
  | "id_desc"
  | "id_asc"
  | "name_asc"
  | "name_desc";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    paid: 0,
    offline: 0,
    pending: 0,
    expired: 0,
    totalRevenue: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  async function handleMarkPaid(registrationId: string, name: string) {
    if (!window.confirm(`Confirm offline venue payment of ₹999 collected for ${name} (${registrationId})?`)) {
      return;
    }
    setMarkingPaidId(registrationId);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: registrationId, action: "mark_paid" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to mark registration as paid.");
      } else {
        fetchRegistrations();
      }
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setMarkingPaidId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Are you sure you want to delete registration ${id} (${name})? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      setRecords((prev) => prev.filter((r) => r.registrationId !== id && r.id !== id));

      const res = await fetch(`/api/admin/registrations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        fetchRegistrations();
      } else {
        alert(data.error || "Could not delete registration.");
        fetchRegistrations();
      }
    } catch {
      alert("Failed to delete registration. Please check connection.");
      fetchRegistrations();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAll() {
    if (
      !window.confirm(
        "WARNING: Are you sure you want to clear ALL registration entries? This will delete all stored test records."
      )
    ) {
      return;
    }

    setClearingAll(true);
    try {
      const res = await fetch("/api/admin/registrations?clearAll=true", {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setRecords([]);
        setStats({ total: 0, paid: 0, offline: 0, pending: 0, expired: 0, totalRevenue: 0 });
        alert("All test registration records cleared successfully.");
      } else {
        alert(data.error || "Could not clear records.");
      }
    } catch {
      alert("Failed to clear records. Please try again.");
    } finally {
      setClearingAll(false);
    }
  }

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
        setStats(
          data.stats || { total: 0, paid: 0, offline: 0, pending: 0, expired: 0, totalRevenue: 0 }
        );
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

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      switch (sortBy) {
        case "date_asc": {
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          if (timeA !== timeB) return timeA - timeB;
          return a.registrationId.localeCompare(b.registrationId, undefined, { numeric: true });
        }
        case "id_desc":
          return b.registrationId.localeCompare(a.registrationId, undefined, { numeric: true });
        case "id_asc":
          return a.registrationId.localeCompare(b.registrationId, undefined, { numeric: true });
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        case "date_desc":
        default: {
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          if (timeB !== timeA) return timeB - timeA;
          return b.registrationId.localeCompare(a.registrationId, undefined, { numeric: true });
        }
      }
    });
  }, [records, sortBy]);

  const filteredRecords = useMemo(() => {
    const searchClean = searchTerm.trim().toLowerCase();
    const searchDigits = searchClean.replace(/\D/g, "");

    return sortedRecords.filter((r) => {
      const regIdClean = (r.registrationId || "").toLowerCase();
      const regIdDigits = regIdClean.replace(/\D/g, "");

      const matchesSearch =
        !searchClean ||
        regIdClean.includes(searchClean) ||
        (searchDigits.length > 0 && regIdDigits.endsWith(searchDigits)) ||
        (searchDigits.length > 0 && searchDigits === regIdDigits) ||
        (r.name || "").toLowerCase().includes(searchClean) ||
        (r.email || "").toLowerCase().includes(searchClean) ||
        (r.mobile || "").includes(searchClean) ||
        (r.proficiency || "").toLowerCase().includes(searchClean) ||
        (r.address || "").toLowerCase().includes(searchClean) ||
        (r.paymentAttempts || []).some((a) =>
          (a.cashfreeOrderId || "").toLowerCase().includes(searchClean) ||
          (a.cashfreePaymentId || "").toLowerCase().includes(searchClean)
        );

      const matchesStatus =
        statusFilter === "ALL" || r.status.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sortedRecords, searchTerm, statusFilter]);

  const totalFiltered = filteredRecords.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-navy-950 pt-28">
        <RefreshCw className="h-8 w-8 animate-spin text-navy-800" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 pt-28 pb-16 text-navy-950 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-950 text-ice-400 shadow-md">
              <ShieldCheck className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-display uppercase tracking-wide text-navy-950 font-extrabold">
                Admin Portal
              </h1>
              <p className="text-xs text-slate-500 font-semibold">Tehri Titans Trials</p>
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
                className="w-full bg-slate-50 border border-slate-300 px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400 rounded-xl focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>

            {loginError && <p className="text-xs text-rose-600 font-bold">{loginError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-950 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl hover:bg-navy-900 transition-colors shadow-md disabled:opacity-50 text-xs"
            >
              {loading ? "Authenticating..." : "Login to Management Portal"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
            PAID (CONFIRMED)
          </span>
        );
      case "OFFLINE":
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            <UserCheck className="h-3 w-3 text-blue-700" />
            VENUE PAY
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <Clock className="h-3 w-3 text-amber-700" />
            PENDING
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <XCircle className="h-3 w-3 text-rose-700" />
            UNPAID / EXPIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pt-24 pb-16 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-navy-950 text-ice-400 px-2.5 py-1 rounded-md">
              Trials Management &amp; Audit Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-wide text-navy-950 font-extrabold mt-2">
              Registration Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchRegistrations}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <a
              href="/api/admin/export-csv"
              className="inline-flex items-center gap-1.5 bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
            {records.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearingAll}
                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white px-3 py-2 rounded-xl text-xs font-extrabold uppercase transition-all shadow-sm disabled:opacity-50"
                title="Wipe test data"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {clearingAll ? "Clearing..." : "Clear Test Data"}
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Total Entries</span>
              <UserCheck className="h-3.5 w-3.5 text-navy-950" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-navy-950 font-mono">
              {stats.total}
            </div>
          </div>

          <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Confirmed Paid</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">
              {stats.paid}
            </div>
          </div>

          <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Venue Pay</span>
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-700 font-mono">
              {stats.offline}
            </div>
          </div>

          <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Pending</span>
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono">
              {stats.pending}
            </div>
          </div>

          <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-rose-700 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Unpaid / Expired</span>
              <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-700 font-mono">
              {stats.expired}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-navy-950 border border-navy-800 p-4 rounded-2xl shadow-md text-white">
            <div className="flex items-center justify-between text-ice-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <span>Online Revenue</span>
              <IndianRupee className="h-3.5 w-3.5 text-ice-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-ice-400 font-mono">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, name, email, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-navy-950 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-bold text-navy-950 rounded-xl focus:outline-none focus:border-navy-900 shadow-sm cursor-pointer"
              >
                <option value="date_desc">Date: Newest First (Default)</option>
                <option value="date_asc">Date: Oldest First</option>
                <option value="id_desc">Reg ID: Highest First (TT-050 → TT-001)</option>
                <option value="id_asc">Reg ID: Lowest First (TT-001 → TT-050)</option>
                <option value="name_asc">Player Name: A → Z</option>
                <option value="name_desc">Player Name: Z → A</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
            {["ALL", "PAID", "OFFLINE", "PENDING", "EXPIRED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
                  statusFilter === status
                    ? "bg-navy-950 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* MOBILE CARD VIEW (Visible on mobile/small screens) */}
        <div className="block md:hidden space-y-3">
          {paginatedRecords.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-semibold text-xs">
              No registration records found matching criteria.
            </div>
          ) : (
            paginatedRecords.map((r) => {
              const isExpanded = expandedId === r.registrationId;
              const attempts = r.paymentAttempts || [];
              const latestAttempt = attempts[attempts.length - 1];

              return (
                <div
                  key={r.registrationId}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
                >
                  {/* Card Top Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-mono font-extrabold text-navy-950 text-sm">
                      {r.registrationId}
                    </span>
                    {renderBadge(r.status)}
                  </div>

                  {/* Player Name & Role */}
                  <div>
                    <h3 className="text-base font-extrabold text-navy-950 capitalize">{r.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-slate-200">
                        {r.proficiency}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Age: {r.age}</span>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <a
                      href={`tel:${r.mobile}`}
                      className="flex items-center gap-2 text-navy-900 font-semibold hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {r.mobile}
                    </a>
                    <a
                      href={`mailto:${r.email}`}
                      className="flex items-center gap-2 text-slate-600 hover:underline truncate"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{r.email}</span>
                    </a>
                    <div className="flex items-start gap-2 text-slate-500 pt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{r.address}</span>
                    </div>
                  </div>

                  {/* Timestamps & Payment Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </div>
                    {latestAttempt?.cashfreeOrderId && (
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                        ID: {latestAttempt.cashfreeOrderId}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : r.registrationId)
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-900 hover:text-navy-950"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      {attempts.length} Payment {attempts.length === 1 ? "Attempt" : "Attempts"}
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    <div className="flex items-center gap-2">
                      {r.status === "OFFLINE" && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(r.registrationId, r.name)}
                          disabled={markingPaidId === r.registrationId}
                          className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {markingPaidId === r.registrationId ? "Updating..." : "Mark Paid"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(r.registrationId, r.name)}
                        disabled={deletingId === r.registrationId}
                        className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        {deletingId === r.registrationId ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Payment Attempt Details */}
                  {isExpanded && (
                    <div className="bg-slate-900 text-white p-3 rounded-xl text-[11px] space-y-2 mt-1 font-mono">
                      <div className="text-ice-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                        Cashfree Payment Audit Log:
                      </div>
                      {attempts.length === 0 ? (
                        <div className="text-slate-400">No payment attempts logged.</div>
                      ) : (
                        attempts.map((att, idx) => (
                          <div
                            key={idx}
                            className="border-t border-slate-800 pt-1.5 first:border-0 first:pt-0"
                          >
                            <div className="flex justify-between text-slate-300">
                              <span>Order: {att.cashfreeOrderId}</span>
                              <span className="font-bold text-amber-400">{att.status}</span>
                            </div>
                            {att.cashfreePaymentId && (
                              <div className="text-slate-400 text-[10px]">
                                Pay ID: {att.cashfreePaymentId} ({att.paymentMethod || "UPI/Card"})
                              </div>
                            )}
                            <div className="text-slate-500 text-[9px]">
                              Amount: ₹{att.amount} | {new Date(att.createdAt).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Visible on medium/large screens) */}
        <div className="hidden md:block bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="p-4">
                    <button
                      type="button"
                      onClick={() => setSortBy(sortBy === "id_desc" ? "id_asc" : "id_desc")}
                      className="flex items-center gap-1 hover:text-navy-950 font-bold uppercase tracking-wider"
                    >
                      Reg ID
                      {sortBy === "id_desc" ? (
                        <ArrowDown className="h-3 w-3 text-navy-950" />
                      ) : sortBy === "id_asc" ? (
                        <ArrowUp className="h-3 w-3 text-navy-950" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Status</th>
                  <th className="p-4">
                    <button
                      type="button"
                      onClick={() => setSortBy(sortBy === "name_asc" ? "name_desc" : "name_asc")}
                      className="flex items-center gap-1 hover:text-navy-950 font-bold uppercase tracking-wider"
                    >
                      Player Details
                      {sortBy === "name_asc" ? (
                        <ArrowUp className="h-3 w-3 text-navy-950" />
                      ) : sortBy === "name_desc" ? (
                        <ArrowDown className="h-3 w-3 text-navy-950" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Role / Age</th>
                  <th className="p-4">
                    <button
                      type="button"
                      onClick={() => setSortBy(sortBy === "date_desc" ? "date_asc" : "date_desc")}
                      className="flex items-center gap-1 hover:text-navy-950 font-bold uppercase tracking-wider"
                    >
                      Created Date
                      {sortBy === "date_desc" ? (
                        <ArrowDown className="h-3 w-3 text-navy-950" />
                      ) : sortBy === "date_asc" ? (
                        <ArrowUp className="h-3 w-3 text-navy-950" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 font-semibold text-xs">
                      No registration records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r) => {
                    const isExpanded = expandedId === r.registrationId;
                    const attempts = r.paymentAttempts || [];
                    const latestAttempt = attempts[attempts.length - 1];

                    return (
                      <React.Fragment key={r.registrationId}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-mono font-bold text-navy-950 text-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : r.registrationId)
                              }
                              className="flex items-center gap-1 hover:underline text-navy-950"
                            >
                              {r.registrationId}
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                              )}
                            </button>
                            {latestAttempt?.cashfreeOrderId && (
                              <div className="text-[10px] text-slate-500 font-mono font-normal mt-0.5 truncate max-w-[120px]" title={latestAttempt.cashfreeOrderId}>
                                ID: {latestAttempt.cashfreeOrderId}
                              </div>
                            )}
                          </td>
                          <td className="p-4">{renderBadge(r.status)}</td>
                          <td className="p-4 font-semibold text-navy-950">
                            <div className="text-sm font-extrabold">{r.name}</div>
                            <div className="text-[11px] text-slate-500 font-normal truncate max-w-[200px]">
                              {r.address}
                            </div>
                          </td>
                          <td className="p-4 text-navy-900 font-medium">
                            <a href={`tel:${r.mobile}`} className="hover:underline font-bold block">
                              {r.mobile}
                            </a>
                            <a href={`mailto:${r.email}`} className="text-[11px] text-slate-500 hover:underline block truncate max-w-[180px]">
                              {r.email}
                            </a>
                          </td>
                          <td className="p-4 text-navy-900">
                            <div className="font-semibold text-xs">{r.proficiency}</div>
                            <div className="text-[11px] text-slate-500 font-normal">Age: {r.age}</div>
                          </td>
                          <td className="p-4 text-[11px] text-slate-500 whitespace-nowrap font-medium">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            {r.status === "OFFLINE" && (
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(r.registrationId, r.name)}
                                disabled={markingPaidId === r.registrationId}
                                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-all px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase disabled:opacity-50 shadow-sm mr-2"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {markingPaidId === r.registrationId ? "Updating..." : "Mark Paid"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(r.registrationId, r.name)}
                              disabled={deletingId === r.registrationId}
                              className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase disabled:opacity-50 shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingId === r.registrationId ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-900 text-white">
                            <td colSpan={7} className="p-4 font-mono text-xs">
                              <div className="text-ice-400 font-bold uppercase tracking-wider text-[11px] mb-2 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Payment Attempt Audit History for {r.registrationId} ({r.name}):
                              </div>
                              {attempts.length === 0 ? (
                                <div className="text-slate-400">No payment attempts recorded.</div>
                              ) : (
                                <div className="space-y-2">
                                  {attempts.map((att, idx) => (
                                    <div
                                      key={idx}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 gap-2"
                                    >
                                      <div>
                                        <span className="text-slate-300">Order ID: </span>
                                        <span className="font-bold text-white">{att.cashfreeOrderId}</span>
                                        {att.cashfreePaymentId && (
                                          <span className="text-emerald-400 ml-2">
                                            Payment ID: {att.cashfreePaymentId}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-slate-400">
                                        <span>Status: <strong className={att.status === "SUCCESS" ? "text-emerald-400" : "text-amber-400"}>{att.status}</strong></span>
                                        <span>Amount: ₹{att.amount}</span>
                                        <span>{new Date(att.createdAt).toLocaleString("en-IN")}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
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

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl text-xs font-sans shadow-sm">
          <div className="text-slate-600 font-medium">
            Showing{" "}
            <span className="font-bold text-navy-950">
              {totalFiltered === 0 ? 0 : startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-navy-950">
              {Math.min(startIndex + pageSize, totalFiltered)}
            </span>{" "}
            of <span className="font-bold text-navy-950">{totalFiltered}</span>{" "}
            registrations
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-navy-950 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-navy-950 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-mono font-bold text-navy-950 bg-slate-100 rounded-lg border border-slate-200">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-navy-950 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
