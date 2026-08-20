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
  Trash2,
  UserCheck,
  AlertCircle,
  Filter,
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete registration ${id} (${name})? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      // Optimistically remove from state immediately for instant feedback
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

  const totalFiltered = filteredRecords.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + pageSize
  );

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
              <h1 className="text-2xl font-display uppercase tracking-wide text-navy-950 font-extrabold">
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
              className="w-full bg-navy-950 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl hover:bg-navy-900 transition-colors shadow-md disabled:opacity-50 text-xs"
            >
              {loading ? "Authenticating..." : "Login to Management Portal"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pt-28 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] bg-navy-950 text-ice-400 px-3 py-1 rounded-md">
              Management &amp; Audit Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-wide text-navy-950 font-extrabold mt-3">
              Registration Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchRegistrations}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
            <a
              href="/api/admin/export-csv"
              className="inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-emerald-800 transition-colors shadow-md"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Registrations</span>
              <UserCheck className="h-4 w-4 text-navy-950" />
            </div>
            <div className="text-2xl font-extrabold text-navy-950 font-mono">
              {stats.total}
            </div>
          </div>

          <div className="bg-white border border-emerald-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Confirmed (Paid)</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono">
              {stats.paid}
            </div>
          </div>

          <div className="bg-white border border-blue-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Offline Venue Pay</span>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-blue-700 font-mono">
              {stats.offline}
            </div>
          </div>

          <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Pending Online</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-700 font-mono">
              {stats.pending}
            </div>
          </div>

          <div className="bg-white border border-rose-200 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Expired</span>
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-rose-700 font-mono">
              {stats.expired}
            </div>
          </div>

          <div className="bg-navy-950 border border-navy-800 p-5 rounded-2xl shadow-md text-white">
            <div className="flex items-center justify-between text-ice-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Confirmed Revenue</span>
              <IndianRupee className="h-4 w-4 text-ice-400" />
            </div>
            <div className="text-2xl font-extrabold text-ice-400 font-mono">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, email, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-navy-950 placeholder:text-slate-400 focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            {["ALL", "PAID", "OFFLINE", "PENDING", "EXPIRED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
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

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="p-4">Reg ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Player Details</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Role / Age</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400 font-semibold">
                      No registration records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r) => {
                    let badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
                    if (r.status === "PAID")
                      badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold";
                    if (r.status === "OFFLINE")
                      badgeClass = "bg-blue-100 text-blue-900 border-blue-300 font-extrabold";
                    if (r.status === "EXPIRED")
                      badgeClass = "bg-rose-100 text-rose-800 border-rose-300";

                    return (
                      <tr key={r.registrationId} className="hover:bg-slate-50 transition-colors">
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
                          <div className="text-[11px] text-slate-500 font-normal truncate max-w-[180px]">
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
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(r.registrationId, r.name)}
                            disabled={deletingId === r.registrationId}
                            className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase disabled:opacity-50 shadow-sm"
                            title={`Delete registration ${r.registrationId}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === r.registrationId ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
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
