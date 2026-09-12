import { db } from '../src/db';
import { showtimeSeats, bookings, users } from '../src/db/schema';
import { BookingService } from '../src/services/booking.service';
import { eq } from 'drizzle-orm';

async function testExpiredHoldsRelease() {
  console.log('🧪 [QA Agent] Starting Expired Seat Holds & Idempotent Release Test...');

  // 1. Find an available seat
  const seat = await db.query.showtimeSeats.findFirst({
    where: eq(showtimeSeats.status, 'AVAILABLE'),
  });

  if (!seat) {
    throw new Error('No available seats found.');
  }

  const user = (await db.query.users.findFirst())!;
  const pastExpiration = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

  // 2. Insert a simulated expired pending booking
  const [expiredBooking] = await db
    .insert(bookings)
    .values({
      bookingReference: `CB-EXP-${Date.now().toString(36).toUpperCase()}`,
      userId: user.id,
      showtimeId: seat.showtimeId,
      status: 'PENDING',
      subtotalInCents: seat.priceInCents,
      taxInCents: 100,
      bookingFeeInCents: 150,
      totalInCents: seat.priceInCents + 250,
      holdExpiresAt: pastExpiration,
      idempotencyKey: `expired_test_${Date.now()}`,
      customerEmail: 'expired@test.com',
      customerName: 'Expired Hold Tester',
    })
    .returning();

  // Mark showtime seat as HELD by this expired booking
  await db
    .update(showtimeSeats)
    .set({
      status: 'HELD',
      holdExpiresAt: pastExpiration,
      heldByBookingId: expiredBooking.id,
    })
    .where(eq(showtimeSeats.id, seat.id));

  console.log(`⏱️ Simulated expired hold on seat ID: ${seat.id} (expired at ${pastExpiration.toISOString()})`);

  // 3. Run releaseExpiredHolds
  console.log('🧹 Executing BookingService.releaseExpiredHolds()...');
  const releaseResult = await BookingService.releaseExpiredHolds();

  console.log(`📊 Cleaned up ${releaseResult.releasedBookingsCount} expired bookings.`);

  if (!releaseResult.releasedBookingIds.includes(expiredBooking.id)) {
    throw new Error('❌ The expired booking was not included in releasedBookingIds.');
  }

  // 4. Verify in database
  const updatedBooking = await db.query.bookings.findFirst({
    where: eq(bookings.id, expiredBooking.id),
  });

  if (updatedBooking?.status !== 'EXPIRED') {
    throw new Error(`❌ Booking status is ${updatedBooking?.status}, expected EXPIRED.`);
  }

  const updatedSeat = await db.query.showtimeSeats.findFirst({
    where: eq(showtimeSeats.id, seat.id),
  });

  if (updatedSeat?.status !== 'AVAILABLE' || updatedSeat.heldByBookingId !== null) {
    throw new Error(`❌ Seat status is ${updatedSeat?.status}, expected AVAILABLE.`);
  }

  console.log('✅ Status Verification PASS: Booking is EXPIRED, Seat is AVAILABLE with cleared hold.');

  // 5. Test idempotency: re-run cleanup immediately
  console.log('🔄 Re-running releaseExpiredHolds() immediately to verify idempotency...');
  const secondRunResult = await BookingService.releaseExpiredHolds();

  if (secondRunResult.releasedBookingsCount === 0) {
    console.log('🛡️ Idempotency PASS: Second execution safely found 0 remaining expired holds.');
  } else {
    throw new Error(`❌ Expected 0 expired holds on second run, got ${secondRunResult.releasedBookingsCount}`);
  }

  console.log('🎉 EXPIRED SEAT HOLDS & CRON RELEASE TEST PASSED!');
}

testExpiredHoldsRelease()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
