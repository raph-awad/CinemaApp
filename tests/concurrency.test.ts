import { db } from '../src/db';
import { showtimeSeats, showtimes, seats, bookings, users } from '../src/db/schema';
import { BookingService, BookingConflictError } from '../src/services/booking.service';
import { eq, and } from 'drizzle-orm';

async function testConcurrentSeatBooking() {
  console.log('🧪 [QA Agent] Starting Concurrent Seat Hold & Double-Booking Prevention Test...');

  // 1. Find an available showtime seat
  const availableSeat = await db.query.showtimeSeats.findFirst({
    where: eq(showtimeSeats.status, 'AVAILABLE'),
    with: {
      seat: true,
    },
  });

  if (!availableSeat) {
    throw new Error('No available seats found in seed data to test concurrency.');
  }

  // 2. Fetch or prepare two test users
  const allUsers = await db.query.users.findMany({ limit: 2 });
  const userA = allUsers[0];
  const userB = allUsers[1] || allUsers[0];

  console.log(
    `🎯 Target Seat: Row ${availableSeat.seat.row}, Seat ${availableSeat.seat.seatNumber} (ID: ${availableSeat.seatId}) on Showtime ${availableSeat.showtimeId}`
  );

  // 3. Issue simultaneous concurrent hold requests
  console.log('⚡ Launching 2 concurrent racing hold requests for the same seat...');

  const requestA = BookingService.holdSeats({
    showtimeId: availableSeat.showtimeId,
    seatIds: [availableSeat.seatId],
    userId: userA.id,
    customerName: 'Customer A',
    customerEmail: 'customerA@test.com',
    idempotencyKey: `test_race_a_${Date.now()}`,
  });

  const requestB = BookingService.holdSeats({
    showtimeId: availableSeat.showtimeId,
    seatIds: [availableSeat.seatId],
    userId: userB.id,
    customerName: 'Customer B',
    customerEmail: 'customerB@test.com',
    idempotencyKey: `test_race_b_${Date.now()}`,
  });

  const results = await Promise.allSettled([requestA, requestB]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  console.log(`📊 Results: Fulfilled = ${fulfilled.length}, Rejected = ${rejected.length}`);

  if (fulfilled.length === 1 && rejected.length === 1) {
    const successResult = (fulfilled[0] as PromiseFulfilledResult<any>).value;
    const failureReason = (rejected[0] as PromiseRejectedResult).reason;

    console.log(`✅ Success Winner: Booking Ref ${successResult.booking.bookingReference}`);
    console.log(`🛡️ Blocked Conflict: ${failureReason.message}`);

    // Verify rejection reason is BookingConflictError
    if (failureReason instanceof BookingConflictError || failureReason.name === 'BookingConflictError') {
      console.log('🔒 Concurrency Guard PASS: Conflict was properly caught and rejected.');
    } else {
      console.warn('⚠️ Rejected with unexpected error type:', failureReason);
    }

    // Verify seat is now HELD in database
    const seatInDb = await db.query.showtimeSeats.findFirst({
      where: eq(showtimeSeats.id, availableSeat.id),
    });

    if (seatInDb?.status === 'HELD' && seatInDb.heldByBookingId === successResult.booking.id) {
      console.log('✅ Database State PASS: Showtime seat status is HELD by the winner booking.');
    } else {
      throw new Error(`Unexpected seat status in DB: ${seatInDb?.status}`);
    }

    console.log('🎉 CONCURRENCY TEST PASSED: Zero duplicate holds created!');
  } else {
    throw new Error(
      `❌ Concurrency Test FAILED! Expected 1 winner and 1 rejection, but got: Fulfilled: ${fulfilled.length}, Rejected: ${rejected.length}`
    );
  }
}

testConcurrentSeatBooking()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
