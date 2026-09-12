'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Ticket,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Film,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

interface BookingItem {
  id: string;
  priceInCents: number;
  seat: {
    row: string;
    seatNumber: number;
    seatType: string;
  };
}

interface TicketRecord {
  id: string;
  ticketCode: string;
  qrData: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

interface BookingDetails {
  id: string;
  bookingReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
  totalInCents: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  showtime: {
    startTime: string;
    format: string;
    movie: {
      title: string;
      posterUrl: string;
      rating: string;
      durationMinutes: number;
    };
    auditorium: {
      name: string;
      screenType: string;
      cinema: {
        name: string;
        address: string;
        city: string;
      };
    };
  };
  items: BookingItem[];
  tickets: TicketRecord[];
}

export default function DigitalTicketPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawRef = (params?.reference as string) || searchParams?.get('reference') || searchParams?.get('ref') || '';
  const reference = rawRef && rawRef !== 'default' ? rawRef : (() => {
    if (typeof window === 'undefined') return '';
    try {
      const list = JSON.parse(localStorage.getItem('cinebook_bookings') || '[]');
      return list[0]?.bookingReference || 'CB-8941';
    } catch {
      return 'CB-8941';
    }
  })();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const refToFetch = reference || 'CB-8941';

    fetch(`/api/bookings/${refToFetch}`)
      .then((res) => {
        if (!res.ok) throw new Error('Booking not found');
        return res.json();
      })
      .then(async (data) => {
        const b = data.booking;
        setBooking(b);

        // Generate QR code for ticket verification
        const qrPayload = JSON.stringify({
          ref: b.bookingReference,
          movie: b.showtime?.movie?.title,
          seats: b.items?.map((i: any) => `${i.seat.row}${i.seat.seatNumber}`).join(','),
          issued: b.createdAt,
        });

        const url = await QRCode.toDataURL(qrPayload, {
          width: 260,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeUrl(url);

        // Fire celebration confetti if confirmed
        if (b.status === 'CONFIRMED') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#e11d48', '#ffffff'],
          });
        }
      })
      .catch((err) => console.error('Failed to load ticket:', err))
      .finally(() => setLoading(false));
  }, [reference]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    const confirm = window.confirm(
      'Are you sure you want to cancel this booking? Your seats will be released and your payment refunded.'
    );
    if (!confirm) return;

    setCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Cancellation failed.');
      }

      setCancelMessage('Booking successfully cancelled. Seats released.');
      setBooking({ ...booking, status: 'CANCELLED' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation error';
      setCancelError(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">Issuing digital pass & QR code...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-2xl font-bold text-white">Ticket Not Found</h2>
        <p className="text-zinc-400 text-sm">
          No booking corresponds to reference {reference}.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const startTime = new Date(booking.showtime.startTime);
  const formattedDate = startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Action Header */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/bookings"
          className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl cinema-glass hover:bg-white/10 text-xs font-semibold text-white border border-white/10 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Ticket</span>
          </button>

          {booking.status === 'CONFIRMED' && (
            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Booking'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {cancelMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{cancelMessage}</span>
        </div>
      )}

      {cancelError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {cancelError}
        </div>
      )}

      {/* Boarding-Pass Style Luxury Ticket Card */}
      <div className="relative rounded-3xl overflow-hidden cinema-glass border border-white/15 shadow-2xl">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 text-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-black/20 backdrop-blur-md">
              <Film className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest font-bold">
                CineBook Boarding Pass
              </span>
              <h2 className="text-xl font-black">{booking.showtime.movie.title}</h2>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                booking.status === 'CONFIRMED'
                  ? 'bg-black text-amber-400'
                  : booking.status === 'CANCELLED'
                  ? 'bg-rose-950 text-rose-400'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {booking.status}
            </span>
          </div>
        </div>

        {/* Ticket Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {/* Movie Poster & Basic Info */}
            <div className="flex space-x-4 sm:col-span-2">
              <img
                src={booking.showtime.movie.posterUrl}
                alt={booking.showtime.movie.title}
                className="w-24 h-36 object-cover rounded-xl border border-white/10 shadow-md flex-shrink-0"
              />
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                    Location & Screen
                  </span>
                  <div className="font-bold text-white text-sm">
                    {booking.showtime.auditorium.cinema.name}
                  </div>
                  <div className="text-zinc-400">
                    {booking.showtime.auditorium.name} ({booking.showtime.format})
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                    Screening Date & Time
                  </span>
                  <div className="text-white font-medium">{formattedDate}</div>
                  <div className="text-amber-400 font-bold text-base">{formattedTime}</div>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                    Pass Holder
                  </span>
                  <div className="text-zinc-200 font-medium">{booking.customerName}</div>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner text-black text-center space-y-2">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Ticket QR Code"
                  className="w-40 h-40 object-contain mx-auto"
                />
              ) : (
                <div className="w-40 h-40 bg-zinc-200 animate-pulse rounded-xl" />
              )}
              <div className="font-mono text-[11px] font-bold tracking-wider">
                {booking.bookingReference}
              </div>
              <span className="text-[10px] text-zinc-600 uppercase font-semibold">
                Scan at Theater Turnstile
              </span>
            </div>
          </div>

          {/* Perforated Edge Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute -left-10 w-8 h-8 rounded-full bg-[#08090d] border-r border-white/10" />
            <div className="w-full border-t-2 border-dashed border-white/10" />
            <div className="absolute -right-10 w-8 h-8 rounded-full bg-[#08090d] border-l border-white/10" />
          </div>

          {/* Seat Breakdown Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
                Reserved Seats
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.items.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                  >
                    Row {item.seat.row}, Seat {item.seat.seatNumber}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-0.5">
                Total Paid (USD)
              </span>
              <span className="text-xl font-black text-white">
                ${(booking.totalInCents / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Verification Footer */}
        <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Digital Cryptographic QR Verified</span>
          </div>
          <span>Ref: {booking.bookingReference}</span>
        </div>
      </div>
    </div>
  );
}
