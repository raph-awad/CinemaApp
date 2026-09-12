import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, tickets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const allBookings = await db.query.bookings.findMany({
      orderBy: [desc(bookings.createdAt)],
      limit: 50,
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

    return NextResponse.json({ bookings: allBookings });
  } catch (error: unknown) {
    console.error('Admin bookings fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Check-in ticket scanner endpoint
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const { ticketCode } = await req.json();

    if (!ticketCode) {
      return NextResponse.json({ error: 'ticketCode is required' }, { status: 400 });
    }

    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.ticketCode, ticketCode),
      with: {
        booking: {
          with: {
            showtime: {
              with: {
                movie: true,
                auditorium: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Invalid ticket code: Not found' }, { status: 404 });
    }

    if (ticket.isCheckedIn) {
      return NextResponse.json({
        error: 'Ticket already checked in!',
        checkedInAt: ticket.checkedInAt,
      }, { status: 409 });
    }

    const now = new Date();
    await db
      .update(tickets)
      .set({ isCheckedIn: true, checkedInAt: now })
      .where(eq(tickets.id, ticket.id));

    return NextResponse.json({
      message: 'Ticket successfully verified and checked in!',
      ticket: { ...ticket, isCheckedIn: true, checkedInAt: now },
    });
  } catch (error: unknown) {
    console.error('Admin ticket checkin error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
