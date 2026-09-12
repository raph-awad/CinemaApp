'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Play,
  Film,
  X,
  ChevronRight,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { MOCK_MOVIES, MOCK_CINEMAS } from '@/lib/client-mock';

interface Movie {
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
  featured: boolean;
  genres: Array<{ id: string; name: string; slug: string }>;
  showtimeCount: number;
}

interface Cinema {
  id: string;
  name: string;
  city: string;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [cinemas, setCinemas] = useState<Cinema[]>(MOCK_CINEMAS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedCinema, setSelectedCinema] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [trailerModalUrl, setTrailerModalUrl] = useState<string | null>(null);

  // Generate next 5 dates for date selector
  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const fetchMovies = () => {
    // Client-side instant filter fallback
    let filtered = [...MOCK_MOVIES];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) => m.title.toLowerCase().includes(q) || m.synopsis.toLowerCase().includes(q)
      );
    }
    if (selectedGenre !== 'all') {
      filtered = filtered.filter((m) =>
        m.genres.some((g) => g.slug === selectedGenre || g.name.toLowerCase() === selectedGenre)
      );
    }
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter((m) => m.language.toLowerCase() === selectedLanguage.toLowerCase());
    }

    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedGenre !== 'all') params.append('genre', selectedGenre);
    if (selectedCinema !== 'all') params.append('cinemaId', selectedCinema);
    if (selectedLanguage !== 'all') params.append('language', selectedLanguage);
    if (selectedDate) params.append('date', selectedDate);

    fetch(`/api/movies?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('API not available');
        return res.json();
      })
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setMovies(data.movies);
        } else {
          setMovies(filtered);
        }
      })
      .catch(() => {
        setMovies(filtered);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMovies();
  }, [searchQuery, selectedGenre, selectedCinema, selectedLanguage, selectedDate]);

  useEffect(() => {
    fetch('/api/cinemas')
      .then((res) => res.json())
      .then((data) => {
        if (data.cinemas) {
          setCinemas(data.cinemas.map((c: Cinema) => ({ id: c.id, name: c.name, city: c.city })));
        }
      })
      .catch(() => {});
  }, []);

  const featuredMovie = movies.find((m) => m.featured) || movies[0];

  const genres = ['all', 'action', 'sci-fi', 'drama', 'thriller', 'animation', 'adventure'];

  return (
    <div className="min-h-screen">
      {/* Hero Showcase Section */}
      {featuredMovie && (
        <section className="relative w-full h-[68vh] min-h-[500px] flex items-end pb-16 overflow-hidden">
          {/* Background image with cinematic vignette */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105"
            style={{ backgroundImage: `url(${featuredMovie.backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/80 to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Featured Premiere</span>
                </span>
                <span className="bg-white/10 text-white px-2.5 py-0.5 rounded text-xs font-semibold">
                  {featuredMovie.rating}
                </span>
                <span className="text-zinc-400 text-xs flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{featuredMovie.durationMinutes} min</span>
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                {featuredMovie.title}
              </h1>

              <p className="text-zinc-300 text-sm sm:text-base line-clamp-3 leading-relaxed drop-shadow">
                {featuredMovie.synopsis}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {featuredMovie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs bg-white/5 border border-white/10 text-zinc-300 px-2.5 py-1 rounded-md"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <Link
                  href={`/movies/${featuredMovie.slug}`}
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200"
                >
                  <Film className="w-4 h-4" />
                  <span>Book Tickets Now</span>
                </Link>

                {featuredMovie.trailerUrl && (
                  <button
                    onClick={() => setTrailerModalUrl(featuredMovie.trailerUrl)}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 px-5 py-3 rounded-xl font-semibold text-sm backdrop-blur-md transition-colors"
                  >
                    <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Filter & Discovery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Date Selector Row */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedDate('')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedDate === ''
                ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                : 'cinema-glass text-zinc-400 hover:text-white'
            }`}
          >
            All Dates
          </button>
          {dates.map((d) => (
            <button
              key={d.iso}
              onClick={() => setSelectedDate(d.iso)}
              className={`px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap flex flex-col items-center ${
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

        {/* Filter Controls Bar */}
        <div className="cinema-glass p-4 rounded-2xl border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search movies by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400/80 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cinema Filter */}
          <div>
            <select
              value={selectedCinema}
              onChange={(e) => setSelectedCinema(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/80"
            >
              <option value="all">All Cinema Locations</option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/80"
            >
              <option value="all">All Languages</option>
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>
        </div>

        {/* Genre Tags Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedGenre === g
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Movies Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Film className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Now Showing & Upcoming</h2>
            </div>
            <span className="text-xs text-zinc-400">
              Showing {movies.length} title{movies.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl bg-white/5 aspect-[2/3] border border-white/10"
                />
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="cinema-glass rounded-2xl p-12 text-center border border-white/10 space-y-3">
              <Film className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-lg font-semibold text-white">No Movies Found</h3>
              <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                No screenings match your current filters. Try changing your search query, genre, or date.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('all');
                  setSelectedCinema('all');
                  setSelectedLanguage('all');
                  setSelectedDate('');
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="group relative rounded-2xl cinema-glass border border-white/10 overflow-hidden hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10121a] via-transparent to-black/40" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded border border-white/10">
                        {movie.rating}
                      </span>
                      <span className="bg-black/60 backdrop-blur-md text-amber-400 text-[11px] font-semibold px-2 py-0.5 rounded border border-white/10 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{movie.durationMinutes}m</span>
                      </span>
                    </div>

                    {/* Language Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                        {movie.language}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {movie.title}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {movie.genres.slice(0, 2).map((g) => (
                          <span
                            key={g.id}
                            className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        {movie.showtimeCount > 0 ? `${movie.showtimeCount} Showtimes` : 'Coming Soon'}
                      </span>
                      <Link
                        href={`/movies/${movie.slug}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-amber-400 hover:text-amber-300 group-hover:translate-x-1 transition-transform"
                      >
                        <span>Select Seats</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trailer Modal */}
      {trailerModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <span className="text-sm font-semibold text-white">Movie Trailer Preview</span>
              <button
                onClick={() => setTrailerModalUrl(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={trailerModalUrl.replace('watch?v=', 'embed/')}
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
