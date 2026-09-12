'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Sparkles, Film, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

interface Showtime {
  id: string;
  startTime: string;
  format: string;
  basePriceInCents: number;
  movie: {
    id: string;
    title: string;
    slug: string;
    rating: string;
    durationMinutes: number;
  };
}

interface Auditorium {
  id: string;
  name: string;
  screenType: string;
  showtimes: Showtime[];
}

interface Cinema {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  facilities: string[];
  imageUrl: string | null;
  auditoriums: Auditorium[];
}

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    setLoading(true);
    const query = selectedCity !== 'all' ? `?city=${encodeURIComponent(selectedCity)}` : '';
    fetch(`/api/cinemas${query}`)
      .then((res) => res.json())
      .then((data) => {
        setCinemas(data.cinemas || []);
      })
      .catch((err) => console.error('Failed to load cinemas:', err))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  const cities = ['all', 'New York', 'Los Angeles', 'San Francisco'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center space-x-3">
            <MapPin className="w-8 h-8 text-amber-400" />
            <span>Cinema Destinations</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Explore our state-of-the-art IMAX 70mm, Dolby Cinema, and boutique luxury lounges.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center space-x-2">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedCity === city
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'cinema-glass text-zinc-400 hover:text-white'
              }`}
            >
              {city === 'all' ? 'All Cities' : city}
            </button>
          ))}
        </div>
      </div>

      {/* Cinema Cards List */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl cinema-glass h-64 border border-white/10"
            />
          ))}
        </div>
      ) : cinemas.length === 0 ? (
        <div className="cinema-glass rounded-2xl p-12 text-center border border-white/10 space-y-3">
          <MapPin className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Cinemas Found</h3>
          <p className="text-zinc-400 text-sm">
            We currently do not have any theaters listed in this city.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="cinema-glass rounded-2xl border border-white/10 overflow-hidden shadow-xl"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Cinema Image */}
                <div className="relative h-64 lg:h-auto bg-zinc-900 overflow-hidden">
                  <img
                    src={
                      cinema.imageUrl ||
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={cinema.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden" />
                  <div className="absolute bottom-4 left-4 lg:hidden">
                    <h2 className="text-xl font-bold text-white">{cinema.name}</h2>
                    <p className="text-xs text-zinc-300">{cinema.city}</p>
                  </div>
                </div>

                {/* Cinema Info & Today's Showtimes */}
                <div className="lg:col-span-2 p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="hidden lg:block">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">{cinema.name}</h2>
                        <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold">
                          {cinema.city}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{cinema.address}</span>
                        {cinema.phone && <span>• Phone: {cinema.phone}</span>}
                      </p>
                    </div>

                    {/* Facilities Pills */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                        Premium Amenities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {cinema.facilities?.map((f, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1 text-xs bg-white/5 border border-white/10 text-zinc-300 px-2.5 py-1 rounded-md"
                          >
                            <CheckCircle2 className="w-3 h-3 text-amber-400" />
                            <span>{f}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Today's Schedule in this Cinema */}
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3 flex items-center space-x-1.5">
                        <Film className="w-3.5 h-3.5" />
                        <span>Available Screenings Today</span>
                      </h4>

                      <div className="space-y-3">
                        {cinema.auditoriums?.map((aud) => (
                          <div
                            key={aud.id}
                            className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-200">
                                {aud.name} ({aud.screenType})
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {aud.showtimes?.length === 0 ? (
                                <span className="text-xs text-zinc-500 italic">
                                  No screenings today
                                </span>
                              ) : (
                                aud.showtimes?.map((st) => {
                                  const timeStr = new Date(st.startTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });
                                  return (
                                    <Link
                                      key={st.id}
                                      href={`/showtimes/${st.id}/seats`}
                                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/50 text-xs font-medium text-white transition-all flex items-center space-x-2"
                                    >
                                      <span>{st.movie?.title || 'Screening'}</span>
                                      <span className="text-amber-400 font-bold">{timeStr}</span>
                                    </Link>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
