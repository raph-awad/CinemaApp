'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Film,
  MapPin,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Armchair,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';

interface SeatItem {
  showtimeSeatId: string;
  seatId: string;
  row: string;
  seatNumber: number;
  seatType: 'STANDARD' | 'VIP' | 'RECLINER' | 'ACCESSIBLE';
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
  priceInCents: number;
}

interface ShowtimeInfo {
  id: string;
  startTime: string;
  format: string;
  basePriceInCents: number;
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    rating: string;
    durationMinutes: number;
  };
  auditorium: {
    id: string;
    name: string;
    screenType: string;
  };
  cinema: {
    id: string;
    name: string;
    city: string;
    address: string;
  };
}

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const showtimeId = params?.id as string;

  const [showtime, setShowtime] = useState<ShowtimeInfo | null>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Fetch current user if logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCustomerName(data.user.name);
          setCustomerEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, []);

  const loadSeats = () => {
    if (!showtimeId) return;
    setLoading(true);
    fetch(`/api/showtimes/${showtimeId}/seats`)
      .then((res) => {
        if (!res.ok) throw new Error('Showtime not found');
        return res.json();
      })
      .then((data) => {
        setShowtime(data.showtime);
        setSeats(data.seats || []);
      })
      .catch((err) => {
        console.error('Failed to load seats:', err);
        setErrorMsg('Unable to load seat availability. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSeats();
    // Poll seat availability every 15s to catch new holds
    const interval = setInterval(loadSeats, 15000);
    return () => clearInterval(interval);
  }, [showtimeId]);

  const toggleSeat = (seat: SeatItem) => {
    if (seat.status !== 'AVAILABLE') return;

    setErrorMsg(null);
    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.seatId));
    } else {
      if (selectedSeatIds.length >= 8) {
        setErrorMsg('You can select a maximum of 8 seats per booking.');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.seatId]);
    }
  };

  // Group seats by Row (A, B, C...)
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, SeatItem[]>);

  // Sort rows alphabetically
  const sortedRows = Object.keys(seatsByRow).sort();

  // Selected seats details
  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.seatId));
  const subtotalInCents = selectedSeats.reduce((sum, s) => sum + s.priceInCents, 0);
  const bookingFeeInCents = selectedSeats.length * 150; // $1.50 per seat
  const taxInCents = Math.round(subtotalInCents * 0.08875);
  const totalInCents = subtotalInCents + bookingFeeInCents + taxInCents;

  const handleProceedToHold = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMsg('Please select at least one seat to proceed.');
      return;
    }

    if (!customerEmail || !customerName) {
      setErrorMsg('Please provide your name and email for the tickets.');
      return;
    }

    setReserving(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeatIds,
          customerName,
          customerEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Double booking race condition or validation error
        setErrorMsg(data.error || 'Seat selection conflict. Please pick another seat.');
        // Refresh seat map immediately to reflect latest taken seats
        loadSeats();
        setSelectedSeatIds([]);
        return;
      }

      // Seat hold successfully created! Redirect to checkout
      router.push(`/checkout/${data.booking.id}`);
    } catch (err: unknown) {
      console.error('Reservation error:', err);
      setErrorMsg('Network error while holding seats. Please retry.');
    } finally {
      setReserving(false);
    }
  };

  if (loading && !showtime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">Loading seat map & auditorium layout...</span>
        </div>
      </div>
    );
  }

  if (!showtime) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-2xl font-bold text-white">Showtime Unavailable</h2>
        <p className="text-zinc-400 text-sm">
          This showtime could not be found or has already begun.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm"
        >
          View Other Showtimes
        </Link>
      </div>
    );
  }

  const startTimeDate = new Date(showtime.startTime);
  const formattedDate = startTimeDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = startTimeDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen pb-24">
      {/* Top Showtime Banner */}
      <div className="cinema-glass border-b border-white/10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link
              href={`/movies/${showtime.movie.id}`}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {showtime.movie.title}
                </h1>
                <span className="text-[10px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded font-bold">
                  {showtime.movie.rating}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                  {showtime.format}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {showtime.cinema.name} • {showtime.auditorium.name} ({showtime.auditorium.screenType})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="text-right">
              <div className="font-semibold text-white">{formattedDate}</div>
              <div className="text-amber-400 font-bold">{formattedTime}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs underline hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Seat Map Column */}
          <div className="lg:col-span-2 cinema-glass rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col items-center space-y-8">
            {/* Curved Cinema Screen */}
            <div className="w-full max-w-xl flex flex-col items-center space-y-2">
              <div className="w-full h-10 curved-screen bg-gradient-to-b from-amber-500/20 to-transparent flex items-center justify-center">
                <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-400/90 drop-shadow">
                  SCREEN
                </span>
              </div>
              <div className="w-3/4 h-3 cinema-screen-glow mx-auto" />
            </div>

            {/* Seat Grid Layout */}
            <div className="w-full max-w-xl overflow-x-auto pb-4 flex flex-col items-center space-y-3">
              {sortedRows.map((rowName) => {
                const rowSeats = seatsByRow[rowName].sort(
                  (a, b) => a.seatNumber - b.seatNumber
                );
                return (
                  <div key={rowName} className="flex items-center space-x-2">
                    {/* Row Letter label */}
                    <span className="w-6 text-center text-xs font-bold text-zinc-500">
                      {rowName}
                    </span>

                    {/* Row Seats */}
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      {rowSeats.map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.seatId);
                        const isAvailable = seat.status === 'AVAILABLE';
                        const isHeld = seat.status === 'HELD';
                        const isBooked = seat.status === 'BOOKED' || seat.status === 'BLOCKED';

                        let seatStyles = 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-amber-400 hover:text-white cursor-pointer';

                        if (isSelected) {
                          seatStyles = 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-500/40 scale-105';
                        } else if (isHeld) {
                          seatStyles = 'bg-amber-950/60 border border-amber-600/40 text-amber-500/60 cursor-not-allowed animate-pulse';
                        } else if (isBooked) {
                          seatStyles = 'bg-zinc-900/80 border border-zinc-800 text-zinc-700 cursor-not-allowed opacity-40';
                        } else if (seat.seatType === 'VIP') {
                          seatStyles = 'bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:border-purple-400 cursor-pointer';
                        } else if (seat.seatType === 'RECLINER') {
                          seatStyles = 'bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 hover:border-indigo-400 cursor-pointer';
                        } else if (seat.seatType === 'ACCESSIBLE') {
                          seatStyles = 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 cursor-pointer';
                        }

                        return (
                          <button
                            key={seat.seatId}
                            onClick={() => toggleSeat(seat)}
                            disabled={!isAvailable && !isSelected}
                            title={`Row ${seat.row}, Seat ${seat.seatNumber} (${seat.seatType}) - $${(seat.priceInCents / 100).toFixed(2)} [${seat.status}]`}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all duration-150 relative ${seatStyles}`}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
                    </div>

                    <span className="w-6 text-center text-xs font-bold text-zinc-500">
                      {rowName}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Seat Map Legend */}
            <div className="w-full pt-4 border-t border-white/5 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700" />
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded bg-amber-500 border border-amber-400" />
                <span className="text-amber-300 font-semibold">Selected</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded bg-purple-950/50 border border-purple-500/40" />
                <span>VIP ($21)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded bg-indigo-950/50 border border-indigo-500/40" />
                <span>Recliner ($26)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded bg-amber-950/60 border border-amber-600/40 animate-pulse" />
                <span>Held (in checkout)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 opacity-40" />
                <span>Occupied</span>
              </div>
            </div>
          </div>

          {/* Order Summary & Customer Info Column */}
          <div className="cinema-glass rounded-2xl p-6 border border-white/10 space-y-6 sticky top-24">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Armchair className="w-5 h-5 text-amber-400" />
                <span>Booking Summary</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Seat availability is held for 10 minutes upon proceeding.
              </p>
            </div>

            {/* Customer Details Form */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Ticket Holder Info
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Selected Seats Chips */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Selected Seats:</span>
                <span className="font-semibold text-white">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
                </span>
              </div>

              {selectedSeats.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-zinc-500">
                  Select seats from the auditorium map above
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.seatId}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1"
                    >
                      <span>
                        {s.row}{s.seatNumber}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        (${ (s.priceInCents / 100).toFixed(2) })
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            {selectedSeats.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Seats Subtotal</span>
                  <span className="text-white font-medium">
                    ${(subtotalInCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Convenience Fee ($1.50 × {selectedSeats.length})</span>
                  <span className="text-white font-medium">
                    ${(bookingFeeInCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Estimated Tax (8.875%)</span>
                  <span className="text-white font-medium">
                    ${(taxInCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-base font-bold text-white">
                  <span>Total Amount</span>
                  <span className="text-amber-400">${(totalInCents / 100).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Action CTA */}
            <button
              onClick={handleProceedToHold}
              disabled={selectedSeatIds.length === 0 || reserving}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                selectedSeatIds.length > 0 && !reserving
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/25 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {reserving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Securing Seat Lock...</span>
                </>
              ) : (
                <>
                  <span>Lock Seats & Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACID Row Lock Guaranteed • 10-Min Hold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
