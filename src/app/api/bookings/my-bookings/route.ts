import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userBookings = await db.query.bookings.findMany({
      where: eq(bookings.userId, user.userId),
      orderBy: [desc(bookings.createdAt)],
      with: {
        showtime: {
          with: {
            movie: true,
            auditorium: {
              with: {
                cinema: true,
              },
            },
          },
        },
        items: {
          with: {
            seat: true,
          },
        },
        tickets: true,
        payments: true,
      },
    });

    return NextResponse.json({ bookings: userBookings });
  } catch (error: unknown) {
    console.error('My bookings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
