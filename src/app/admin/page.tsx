'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  DollarSign,
  Ticket,
  Users,
  Armchair,
  Activity,
  Scan,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Film,
  Search,
} from 'lucide-react';

interface MetricsData {
  revenueCents: number;
  revenueFormatted: string;
  confirmedBookings: number;
  totalSeats: number;
  bookedSeats: number;
  heldSeats: number;
  occupancyRate: number;
  ticketsCheckedIn: number;
  totalTicketsIssued: number;
}

interface BookingRecord {
  id: string;
  bookingReference: string;
  status: string;
  customerName: string;
  customerEmail: string;
  totalInCents: number;
  createdAt: string;
  showtime: {
    startTime: string;
    movie: {
      title: string;
    };
    auditorium: {
      name: string;
      cinema: {
        name: string;
      };
    };
  };
  items: Array<{
    seat: {
      row: string;
      seatNumber: number;
    };
  }>;
  tickets: Array<{
    ticketCode: string;
    isCheckedIn: boolean;
  }>;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

export default function AdminPortalPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'bookings' | 'audit'>('overview');

  // Scanner state
  const [scanCode, setScanCode] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const fetchDashboard = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/metrics'),
      fetch('/api/admin/bookings'),
      fetch('/api/admin/audit-logs'),
    ])
      .then(async ([mRes, bRes, lRes]) => {
        if (mRes.status === 403 || bRes.status === 403) {
          setAuthorized(false);
          return;
        }
        const mData = await mRes.json();
        const bData = await bRes.json();
        const lData = await lRes.json();

        setMetrics(mData);
        setBookings(bData.bookings || []);
        setLogs(lData.logs || []);
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleScanTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanCode.trim()) return;

    setScanLoading(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: scanCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScanResult({
          success: false,
          message: data.error || 'Check-in validation failed.',
        });
      } else {
        setScanResult({
          success: true,
          message: data.message,
          data: data.ticket,
        });
        setScanCode('');
        fetchDashboard();
      }
    } catch (err: unknown) {
      setScanResult({
        success: false,
        message: 'Network error checking in ticket.',
      });
    } finally {
      setScanLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-sm text-zinc-400">
          This portal is restricted to authorized cinema operations staff. Please sign in with an administrator account.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded">
              Operator Mode
            </span>
            <h1 className="text-3xl font-extrabold text-white">Cinema Operations & Control</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time occupancy tracking, turnstile QR admissions, and audit ledger.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="px-4 py-2 rounded-xl cinema-glass text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 flex items-center space-x-2 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Overview */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="cinema-glass rounded-2xl p-5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Gross Box Office</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics.revenueFormatted}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              {metrics.confirmedBookings} Confirmed Transactions
            </div>
          </div>

          <div className="cinema-glass rounded-2xl p-5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Seat Occupancy Rate</span>
              <Armchair className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics.occupancyRate}%
            </div>
            <div className="text-[11px] text-zinc-400">
              {metrics.bookedSeats} booked / {metrics.totalSeats} capacity
            </div>
          </div>

          <div className="cinema-glass rounded-2xl p-5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Active Seat Holds</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {metrics.heldSeats}
            </div>
            <div className="text-[11px] text-zinc-400">In checkout pipeline</div>
          </div>

          <div className="cinema-glass rounded-2xl p-5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Gate Turnstile Check-ins</span>
              <Ticket className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {metrics.ticketsCheckedIn}
            </div>
            <div className="text-[11px] text-cyan-400">
              of {metrics.totalTicketsIssued} passes issued
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'cinema-glass text-zinc-400 hover:text-white'
          }`}
        >
          Bookings Ledger
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
            activeTab === 'scanner'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'cinema-glass text-zinc-400 hover:text-white'
          }`}
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Turnstile QR Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'cinema-glass text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>System Audit Log</span>
        </button>
      </div>

      {/* Tab: Turnstile Scanner Simulator */}
      {activeTab === 'scanner' && (
        <div className="max-w-xl mx-auto cinema-glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Scan className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Ticket Turnstile Check-in</h2>
            <p className="text-xs text-zinc-400">
              Simulate barcode or QR code scans at the theater entry gate to admit patrons.
            </p>
          </div>

          <form onSubmit={handleScanTicket} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-semibold">
                Ticket Barcode / Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. TKT-9A24-C4"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={scanLoading || !scanCode.trim()}
              className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {scanLoading ? (
                <span>Validating Pass...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Admit Patron & Mark Checked In</span>
                </>
              )}
            </button>
          </form>

          {scanResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 ${
                scanResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="font-bold text-sm flex items-center space-x-1.5">
                {scanResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{scanResult.message}</span>
              </div>
              {scanResult.data && (
                <div className="text-[11px] text-zinc-300 pt-1">
                  Ticket Code: <span className="font-mono text-white">{scanResult.data.ticketCode}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Click Demo Codes */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold block">
              Recent Issued Passes (Click to test scan)
            </span>
            <div className="flex flex-wrap gap-2">
              {bookings
                .flatMap((b) => b.tickets || [])
                .slice(0, 4)
                .map((t) => (
                  <button
                    key={t.ticketCode}
                    onClick={() => {
                      setScanCode(t.ticketCode);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      t.isCheckedIn
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10'
                    }`}
                  >
                    {t.ticketCode} {t.isCheckedIn && '✓'}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bookings Ledger Table */}
      {activeTab === 'overview' && (
        <div className="cinema-glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Customer Reservations
            </h3>
            <span className="text-xs text-zinc-400">{bookings.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/5 text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Movie & Screen</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{b.customerName}</div>
                      <div className="text-[10px] text-zinc-400">{b.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{b.showtime?.movie?.title}</div>
                      <div className="text-[10px] text-zinc-400">
                        {b.showtime?.auditorium?.cinema?.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {b.items?.map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-white/5 text-zinc-300 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {item.seat?.row}{item.seat?.seatNumber}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      ${(b.totalInCents / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-zinc-400">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/tickets/${b.bookingReference}`}
                        className="text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: System Audit Log */}
      {activeTab === 'audit' && (
        <div className="cinema-glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              System Audit Trail & Security Ledger
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-white/5 text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-400">{log.action}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {log.entityType} ({log.entityId.substring(0, 8)}...)
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {log.userEmail || 'System / Guest'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-zinc-400">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {log.ipAddress || 'internal'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
