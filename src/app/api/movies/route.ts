import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { movies, genres, movieGenres, showtimes, auditoriums, cinemas } from '@/db/schema';
import { eq, ilike, and, gte, lte, or, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const language = searchParams.get('language');
    const cinemaId = searchParams.get('cinemaId');
    const date = searchParams.get('date');

    const allMovies: any[] = await (db.query.movies as any).findMany({
      with: {
        movieGenres: {
          with: {
            genre: true,
          },
        },
        showtimes: {
          with: {
            auditorium: {
              with: {
                cinema: true,
              },
            },
          },
        },
      },
    });

    let filtered: any[] = allMovies;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m: any) =>
          m.title.toLowerCase().includes(q) ||
          m.synopsis.toLowerCase().includes(q)
      );
    }

    if (genre && genre !== 'all') {
      filtered = filtered.filter((m: any) =>
        m.movieGenres.some(
          (mg: any) =>
            mg.genre.slug.toLowerCase() === genre.toLowerCase() ||
            mg.genre.name.toLowerCase() === genre.toLowerCase()
        )
      );
    }

    if (language && language !== 'all') {
      filtered = filtered.filter(
        (m: any) => m.language.toLowerCase() === language.toLowerCase()
      );
    }

    if (cinemaId && cinemaId !== 'all') {
      filtered = filtered.filter((m: any) =>
        m.showtimes.some((s: any) => s.auditorium.cinemaId === cinemaId)
      );
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      filtered = filtered.filter((m: any) =>
        m.showtimes.some((s: any) => {
          const st = new Date(s.startTime);
          return st >= startOfDay && st <= endOfDay;
        })
      );
    }

    // Format response
    const formatted = filtered.map((m: any) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      synopsis: m.synopsis,
      posterUrl: m.posterUrl,
      backdropUrl: m.backdropUrl,
      trailerUrl: m.trailerUrl,
      durationMinutes: m.durationMinutes,
      releaseDate: m.releaseDate,
      language: m.language,
      rating: m.rating,
      featured: m.featured,
      genres: m.movieGenres.map((mg: any) => ({
        id: mg.genre.id,
        name: mg.genre.name,
        slug: mg.genre.slug,
      })),
      showtimeCount: m.showtimes.length,
    }));

    return NextResponse.json({ movies: formatted });
  } catch (error: unknown) {
    console.error('Movies query error:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}
