'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  ShieldCheck,
  CreditCard,
  Sparkles,
  AlertTriangle,
  Film,
  MapPin,
  Ticket,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
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

interface BookingDetails {
  id: string;
  bookingReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
  subtotalInCents: number;
  taxInCents: number;
  bookingFeeInCents: number;
  totalInCents: number;
  holdExpiresAt: string;
  customerName: string;
  customerEmail: string;
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
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Booking not found');
        return res.json();
      })
      .then((data) => {
        setBooking(data.booking);

        if (data.booking.status === 'CONFIRMED') {
          router.replace(`/tickets/${data.booking.bookingReference}`);
          return;
        }

        const expiresAt = new Date(data.booking.holdExpiresAt).getTime();
        const diff = expiresAt - Date.now();
        if (diff <= 0) {
          setIsExpired(true);
        } else {
          setTimeLeftMs(diff);
        }
      })
      .catch((err) => {
        console.error('Failed to load booking:', err);
        setErrorMsg('Booking session not found or invalid.');
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeftMs <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftMs]);

  // Format countdown minutes:seconds
  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const formattedCountdown = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const handleSandboxPayment = async () => {
    if (!booking || isExpired) return;
    setPaying(true);
    setErrorMsg(null);

    try {
      const idempotencyKey = `pay_sb_${booking.id}_${Date.now()}`;
      const res = await fetch('/api/checkout/sandbox-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed.');
      }

      // Success! Redirect to digital ticket
      router.push(`/tickets/${data.bookingReference}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment error';
      setErrorMsg(msg);
      setPaying(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!booking || isExpired) return;
    setPaying(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not initiate checkout.');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout error';
      setErrorMsg(msg);
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">Loading checkout session...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-2xl font-bold text-white">Booking Session Not Found</h2>
        <p className="text-zinc-400 text-sm max-w-md">
          {errorMsg || 'The reservation you are looking for does not exist.'}
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  if (isExpired || booking.status === 'EXPIRED') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <Clock className="w-12 h-12 text-amber-500" />
        <h2 className="text-2xl font-bold text-white">Seat Hold Expired</h2>
        <p className="text-zinc-400 text-sm max-w-md">
          Your 10-minute temporary seat hold has expired and the seats were released back to the general inventory.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400"
        >
          Reselect Your Seats
        </button>
      </div>
    );
  }

  const startTimeDate = new Date(booking.showtime.startTime);
  const formattedDate = startTimeDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = startTimeDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hold Expiration Countdown Bar */}
      <div className="p-4 rounded-2xl cinema-glass border border-amber-500/30 flex items-center justify-between shadow-lg shadow-amber-500/5">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Reserved Seats Held
            </div>
            <p className="text-xs text-zinc-300">
              Please complete checkout before your hold timer expires.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono text-amber-400">
            {formattedCountdown}
          </div>
          <span className="text-[10px] text-zinc-400">Time Remaining</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Reservation Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="cinema-glass rounded-2xl p-6 border border-white/10 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Film className="w-5 h-5 text-amber-400" />
              <span>Screening Information</span>
            </h2>

            <div className="flex space-x-4 pt-2">
              <img
                src={booking.showtime.movie.posterUrl}
                alt={booking.showtime.movie.title}
                className="w-20 h-28 object-cover rounded-xl border border-white/10 flex-shrink-0"
              />
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">
                    {booking.showtime.movie.title}
                  </h3>
                  <span className="text-[10px] bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded">
                    {booking.showtime.movie.rating}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {booking.showtime.auditorium.cinema.name} • {booking.showtime.auditorium.name}
                  </span>
                </p>
                <p className="text-xs text-zinc-400">
                  {formattedDate} at <strong className="text-white">{formattedTime}</strong> ({booking.showtime.format})
                </p>
                <p className="text-xs text-amber-400 font-mono pt-1">
                  Reference: {booking.bookingReference}
                </p>
              </div>
            </div>

            {/* Reserved Seats List */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Reserved Seats ({booking.items.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {booking.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-400">
                        Row {item.seat.row}, Seat {item.seat.seatNumber}
                      </span>
                      <div className="text-[10px] text-zinc-400">{item.seat.seatType}</div>
                    </div>
                    <span className="text-zinc-200 font-medium">
                      ${(item.priceInCents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Details */}
            <div className="pt-4 border-t border-white/5 text-xs text-zinc-400 space-y-1">
              <div>
                Purchaser: <span className="text-white font-medium">{booking.customerName}</span>
              </div>
              <div>
                Confirmation Email: <span className="text-white font-medium">{booking.customerEmail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Payment Options */}
        <div className="cinema-glass rounded-2xl p-6 border border-white/10 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <span>Payment Summary</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Tickets Subtotal</span>
              <span className="text-white font-medium">
                ${(booking.subtotalInCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Online Booking Fee</span>
              <span className="text-white font-medium">
                ${(booking.bookingFeeInCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Sales Tax (8.875%)</span>
              <span className="text-white font-medium">
                ${(booking.taxInCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-lg font-extrabold text-white">
              <span>Total Due</span>
              <span className="text-amber-400">${(booking.totalInCents / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* 1-Click Sandbox Test Mode Button */}
            <button
              onClick={handleSandboxPayment}
              disabled={paying || isExpired}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {paying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Test Payment...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm Test Payment (Sandbox)</span>
                </>
              )}
            </button>

            {/* Standard Stripe Checkout Button */}
            <button
              onClick={handleStripeCheckout}
              disabled={paying || isExpired}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
              <span>Pay via Stripe Checkout</span>
            </button>
          </div>

          <div className="pt-2 text-center text-[11px] text-zinc-400 space-y-1">
            <p className="flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Mode Enabled • No Real Charge</span>
            </p>
            <p>Idempotency Key enforces single charge guarantee.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
