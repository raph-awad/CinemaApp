import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BookingService } from '@/services/booking.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, idempotencyKey } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const payKey = idempotencyKey || `sandbox_pay_${booking.id}_${Date.now()}`;

    const result = await BookingService.confirmPayment({
      bookingId: booking.id,
      paymentIntentId: `mock_pi_${Date.now()}`,
      provider: 'MOCK_SANDBOX',
      idempotencyKey: payKey,
      amountInCents: booking.totalInCents,
      metadata: { sandbox: true },
      clientIp,
    });

    return NextResponse.json({
      message: 'Test payment processed successfully!',
      bookingReference: result.booking.bookingReference,
      status: result.booking.status,
      tickets: result.tickets,
    });
  } catch (error: unknown) {
    console.error('Sandbox payment error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
