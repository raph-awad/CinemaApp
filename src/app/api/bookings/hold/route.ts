import { NextRequest, NextResponse } from 'next/server';
import { BookingService, BookingConflictError, BookingValidationError } from '@/services/booking.service';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { showtimeId, seatIds, customerName, customerEmail, idempotencyKey } = body;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: 'showtimeId and non-empty seatIds array are required.' },
        { status: 400 }
      );
    }

    // Authenticate user or fallback to guest / customer
    let currentUser = await getUserFromRequest(req);
    let userId = currentUser?.userId;

    if (!userId) {
      // Find or create guest user if email is provided
      const email = (customerEmail || 'guest@cinebook.com').toLowerCase().trim();
      let dbUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!dbUser) {
        const [created] = await db
          .insert(users)
          .values({
            email,
            passwordHash: 'guest_no_direct_login',
            name: customerName || 'Guest Cinephile',
            role: 'USER',
          })
          .returning();
        dbUser = created;
      }

      if (dbUser) {
        userId = dbUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User identifier required.' },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const result = await BookingService.holdSeats({
      showtimeId,
      seatIds,
      userId,
      customerName: customerName || currentUser?.name || 'Guest User',
      customerEmail: customerEmail || currentUser?.email || 'guest@cinebook.com',
      idempotencyKey,
      clientIp,
    });

    return NextResponse.json(
      {
        message: 'Seats reserved temporarily for 10 minutes.',
        booking: result.booking,
        isExisting: result.isExisting,
      },
      { status: result.isExisting ? 200 : 201 }
    );
  } catch (error: unknown) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof BookingValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Hold seats error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
