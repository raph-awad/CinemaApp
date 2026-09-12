'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  MapPin,
  Play,
  Film,
  Sparkles,
  ChevronLeft,
  Tv,
  ArrowRight,
  X,
} from 'lucide-react';
import { MOCK_MOVIES, generateMockShowtimes } from '@/lib/client-mock';

interface Showtime {
  id: string;
  startTime: string;
  endTime: string;
  format: string;
  basePriceInCents: number;
  auditorium: {
    id: string;
    name: string;
    screenType: string;
    cinema: {
      id: string;
      name: string;
      city: string;
      address: string;
    };
  };
}

interface MovieDetails {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string | null;
  durationMinutes: number;
  releaseDate: string;
  language: string;
  rating: string;
  genres: Array<{ id: string; name: string }>;
  showtimes: Showtime[];
}

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [trailerModal, setTrailerModal] = useState(false);

  // Generate 5 dates starting today
  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].iso);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    
    // Set instant fallback from mock data
    const fallbackMovie = MOCK_MOVIES.find((m) => m.slug === slug) || MOCK_MOVIES[0];
    const fallbackShowtimes = generateMockShowtimes(fallbackMovie.slug);
    setMovie({ ...fallbackMovie, showtimes: fallbackShowtimes as any });
    setLoading(false);

    fetch(`/api/movies`)
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data) => {
        const found = data.movies?.find((m: MovieDetails) => m.slug === slug);
        if (found) {
          // Fetch full showtimes for this movie
          fetch(`/api/cinemas`)
            .then((res) => res.json())
            .then((cData) => {
              const allShowtimes: Showtime[] = [];
              cData.cinemas?.forEach((c: any) => {
                c.auditoriums?.forEach((aud: any) => {
                  aud.showtimes?.forEach((st: any) => {
                    if (st.movie?.slug === slug || st.movieId === found.id) {
                      allShowtimes.push({
                        id: st.id,
                        startTime: st.startTime,
                        endTime: st.endTime,
                        format: st.format,
                        basePriceInCents: st.basePriceInCents,
                        auditorium: {
                          id: aud.id,
                          name: aud.name,
                          screenType: aud.screenType,
                          cinema: {
                            id: c.id,
                            name: c.name,
                            city: c.city,
                            address: c.address,
                          },
                        },
                      });
                    }
                  });
                });
              });
              if (allShowtimes.length > 0) {
                setMovie({ ...found, showtimes: allShowtimes });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm text-zinc-400">Loading screening schedule...</span>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <Film className="w-16 h-16 text-zinc-600" />
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <p className="text-zinc-400 text-sm max-w-md">
          The requested movie could not be found or has concluded its theatrical run.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400"
        >
          Return to Showtimes
        </Link>
      </div>
    );
  }

  // Filter showtimes by selected date
  const filteredShowtimes = movie.showtimes?.filter((st) => {
    if (!selectedDate) return true;
    const stDate = new Date(st.startTime).toISOString().split('T')[0];
    return stDate === selectedDate;
  }) || [];

  // Group showtimes by Cinema
  const groupedByCinema = filteredShowtimes.reduce((acc, st) => {
    const cinemaId = st.auditorium.cinema.id;
    if (!acc[cinemaId]) {
      acc[cinemaId] = {
        cinema: st.auditorium.cinema,
        showtimes: [],
      };
    }
    acc[cinemaId].showtimes.push(st);
    return acc;
  }, {} as Record<string, { cinema: any; showtimes: Showtime[] }>);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Backdrop Header */}
      <div className="relative w-full h-[50vh] min-h-[380px] overflow-hidden bg-zinc-950">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${movie.backdropUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-transparent to-[#08090d]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8">
          <Link
            href="/"
            className="absolute top-6 left-4 sm:left-8 flex items-center space-x-1 text-xs text-zinc-400 hover:text-white cinema-glass px-3 py-1.5 rounded-lg border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Movies</span>
          </Link>
        </div>
      </div>

      {/* Movie Info & Details Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-28 relative z-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Poster Column */}
          <div className="md:col-span-1">
            <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-zinc-900 aspect-[2/3] relative group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              {movie.trailerUrl && (
                <button
                  onClick={() => setTrailerModal(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center space-y-2 transition-opacity backdrop-blur-xs text-white"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
                    <Play className="w-6 h-6 text-black fill-black ml-1" />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase">
                    Watch Trailer
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-3 space-y-6 pt-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  {movie.rating}
                </span>
                <span className="flex items-center space-x-1 text-xs text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{movie.durationMinutes} Minutes</span>
                </span>
                <span className="text-xs text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded">
                  Language: {movie.language}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {movie.genres?.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs bg-white/10 text-zinc-300 px-3 py-1 rounded-full font-medium"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                Synopsis
              </h3>
              <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">
                {movie.synopsis}
              </p>
            </div>
          </div>
        </div>

        {/* Showtimes & Booking Section */}
        <section className="space-y-6 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-amber-400" />
                <span>Select Showtime & Experience</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Choose a date and location to select your reserved seats.
              </p>
            </div>

            {/* Date Picker Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
              {dates.map((d) => (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={`px-4 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap flex flex-col items-center ${
                    selectedDate === d.iso
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'cinema-glass text-zinc-300 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-semibold">{d.dayName}</span>
                  <span className="text-[11px] opacity-80">{d.formatted}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Showtimes grouped by Cinema */}
          {Object.keys(groupedByCinema).length === 0 ? (
            <div className="cinema-glass rounded-2xl p-10 text-center border border-white/10 space-y-3">
              <Clock className="w-10 h-10 text-zinc-500 mx-auto" />
              <h3 className="text-lg font-semibold text-white">No Screenings on this Date</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                There are no scheduled showtimes for {selectedDate}. Please select another date above.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedByCinema).map(({ cinema, showtimes }) => (
                <div
                  key={cinema.id}
                  className="cinema-glass rounded-2xl p-6 border border-white/10 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>{cinema.name}</span>
                      </h3>
                      <p className="text-xs text-zinc-400">{cinema.address}, {cinema.city}</p>
                    </div>
                  </div>

                  {/* Showtimes Pill Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {showtimes.map((st) => {
                      const startTimeStr = new Date(st.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const priceStr = `$${(st.basePriceInCents / 100).toFixed(2)}`;

                      return (
                        <Link
                          key={st.id}
                          href={`/showtimes/${st.id}/seats`}
                          className="group p-3 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/50 transition-all flex flex-col items-center justify-center space-y-1 text-center"
                        >
                          <span className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                            {startTimeStr}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                            {st.format} • {st.auditorium.screenType}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            From {priceStr}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Trailer Modal */}
      {trailerModal && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <span className="text-sm font-semibold text-white">Trailer: {movie.title}</span>
              <button
                onClick={() => setTrailerModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={movie.trailerUrl.replace('watch?v=', 'embed/')}
                title="Trailer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
