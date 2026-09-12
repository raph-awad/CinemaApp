import { NextRequest, NextResponse } from 'next/server';
import { BookingService, BookingValidationError, BookingNotFoundError } from '@/services/booking.service';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const currentUser = await getUserFromRequest(req);

    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const isAdmin = currentUser.role === 'ADMIN';

    const result = await BookingService.cancelBooking(
      bookingId,
      currentUser.userId,
      isAdmin
    );

    return NextResponse.json({
      message: 'Booking cancelled successfully. Seats have been returned to available inventory.',
      ...result,
    });
  } catch (error: unknown) {
    if (error instanceof BookingNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BookingValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Cancel booking error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
