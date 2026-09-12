'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Film, Calendar, MapPin, ChevronRight, Clock, AlertCircle } from 'lucide-react';

interface BookingRecord {
  id: string;
  bookingReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
  totalInCents: number;
  createdAt: string;
  showtime: {
    startTime: string;
    format: string;
    movie: {
      title: string;
      posterUrl: string;
      rating: string;
    };
    auditorium: {
      name: string;
      cinema: {
        name: string;
        city: string;
      };
    };
  };
  items: Array<{
    id: string;
    seat: {
      row: string;
      seatNumber: number;
    };
  }>;
}

export default function BookingsHistoryPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);

  useEffect(() => {
    fetch('/api/bookings/my-bookings')
      .then((res) => {
        if (res.status === 401) {
          setAuthenticated(false);
          return { bookings: [] };
        }
        return res.json();
      })
      .then((data) => {
        setBookings(data.bookings || []);
      })
      .catch((err) => console.error('Failed to load bookings:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">Loading your reservations...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Ticket className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">Sign In to View Bookings</h2>
        <p className="text-sm text-zinc-400">
          Please sign in to access your digital tickets, booking history, and cancellation controls.
        </p>
        <div className="flex justify-center space-x-3 pt-2">
          <Link
            href="/auth/login"
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-2.5 rounded-xl cinema-glass text-white font-semibold text-sm hover:bg-white/10"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
          <Ticket className="w-8 h-8 text-amber-400" />
          <span>My Cinema Bookings</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Review your upcoming admissions, digital tickets, and past reservation history.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="cinema-glass rounded-2xl p-12 text-center border border-white/10 space-y-4">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto">
            You have not booked any movie screenings yet. Browse our now showing catalog to get your first ticket!
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const startTime = new Date(booking.showtime.startTime);
            const formattedDate = startTime.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = startTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={booking.id}
                className="cinema-glass rounded-2xl p-5 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={booking.showtime.movie.posterUrl}
                    alt={booking.showtime.movie.title}
                    className="w-16 h-24 object-cover rounded-xl border border-white/10 flex-shrink-0"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">
                        {booking.showtime.movie.title}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : booking.status === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <p className="text-zinc-400 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {booking.showtime.auditorium.cinema.name} • {booking.showtime.auditorium.name} ({booking.showtime.format})
                      </span>
                    </p>

                    <p className="text-zinc-400 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formattedDate} at <strong className="text-white">{formattedTime}</strong></span>
                    </p>

                    <div className="pt-1 flex flex-wrap gap-1">
                      {booking.items.map((i) => (
                        <span
                          key={i.id}
                          className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-amber-300 font-semibold"
                        >
                          Seat {i.seat.row}{i.seat.seatNumber}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 font-mono">
                      {booking.bookingReference}
                    </div>
                    <div className="text-base font-bold text-white">
                      ${(booking.totalInCents / 100).toFixed(2)}
                    </div>
                  </div>

                  <Link
                    href={`/tickets/${booking.bookingReference}`}
                    className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors"
                  >
                    <span>View Pass</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
