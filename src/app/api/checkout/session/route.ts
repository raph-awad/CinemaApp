import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createCheckoutSession } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot checkout booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    if (new Date(booking.holdExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Seat hold has expired. Please reselect your seats.' },
        { status: 410 }
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await createCheckoutSession({
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      amountInCents: booking.totalInCents,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      successUrl: `${origin}/tickets/${booking.bookingReference}`,
      cancelUrl: `${origin}/checkout/${booking.id}?cancelled=true`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      isMock: session.isMock,
    });
  } catch (error: unknown) {
    console.error('Checkout session creation error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
