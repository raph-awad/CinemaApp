import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/booking.service';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await BookingService.getBookingDetails(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const currentUser = await getUserFromRequest(req);

    // If user is authenticated, enforce user isolation unless admin or matching booking reference
    if (currentUser && currentUser.role !== 'ADMIN' && booking.userId !== currentUser.userId) {
      // Allow access only if querying directly by public bookingReference (e.g. ticket viewing)
      const isRefQuery = booking.bookingReference.toLowerCase() === id.toLowerCase();
      if (!isRefQuery) {
        return NextResponse.json({ error: 'Unauthorized: Access denied.' }, { status: 403 });
      }
    }

    return NextResponse.json({ booking });
  } catch (error: unknown) {
    console.error('Fetch booking error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
