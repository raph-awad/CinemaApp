import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { showtimes, showtimeSeats, seats, auditoriums, cinemas, movies } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;

    const showtime = await db.query.showtimes.findFirst({
      where: eq(showtimes.id, showtimeId),
      with: {
        movie: true,
        auditorium: {
          with: {
            cinema: true,
          },
        },
      },
    });

    if (!showtime) {
      return NextResponse.json({ error: 'Showtime not found' }, { status: 404 });
    }

    // Fetch all showtime seats joined with seats layout
    const allSeats = await db
      .select({
        showtimeSeatId: showtimeSeats.id,
        seatId: seats.id,
        row: seats.row,
        seatNumber: seats.seatNumber,
        seatType: seats.seatType,
        status: showtimeSeats.status,
        holdExpiresAt: showtimeSeats.holdExpiresAt,
        priceInCents: showtimeSeats.priceInCents,
      })
      .from(showtimeSeats)
      .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
      .where(eq(showtimeSeats.showtimeId, showtimeId))
      .orderBy(asc(seats.row), asc(seats.seatNumber));

    const now = new Date();

    // Map seats with real-time hold expiration check
    const seatMap = allSeats.map((s: any) => {
      let currentStatus = s.status;

      // If held, but expiration passed, it is effectively available
      if (currentStatus === 'HELD' && s.holdExpiresAt && new Date(s.holdExpiresAt) < now) {
        currentStatus = 'AVAILABLE';
      }

      return {
        ...s,
        status: currentStatus,
      };
    });

    return NextResponse.json({
      showtime: {
        id: showtime.id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        format: showtime.format,
        basePriceInCents: showtime.basePriceInCents,
        movie: {
          id: showtime.movie.id,
          title: showtime.movie.title,
          posterUrl: showtime.movie.posterUrl,
          backdropUrl: showtime.movie.backdropUrl,
          rating: showtime.movie.rating,
          durationMinutes: showtime.movie.durationMinutes,
        },
        auditorium: {
          id: showtime.auditorium.id,
          name: showtime.auditorium.name,
          screenType: showtime.auditorium.screenType,
        },
        cinema: {
          id: showtime.auditorium.cinema.id,
          name: showtime.auditorium.cinema.name,
          address: showtime.auditorium.cinema.address,
          city: showtime.auditorium.cinema.city,
        },
      },
      seats: seatMap,
    });
  } catch (error: unknown) {
    console.error('Showtime seats error:', error);
    return NextResponse.json({ error: 'Failed to fetch seats' }, { status: 500 });
  }
}
