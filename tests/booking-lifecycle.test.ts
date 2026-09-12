import { db } from '../src/db';
import { showtimeSeats, bookings, payments, tickets, users } from '../src/db/schema';
import { BookingService } from '../src/services/booking.service';
import { eq } from 'drizzle-orm';

async function testBookingLifecycle() {
  console.log('🧪 [QA Agent] Starting Full Booking Lifecycle & Payment Idempotency Test...');

  // 1. Find 2 available seats
  const availableSeats = await db.query.showtimeSeats.findMany({
    where: eq(showtimeSeats.status, 'AVAILABLE'),
    with: { seat: true },
    limit: 2,
  });

  if (availableSeats.length < 2) {
    throw new Error('Need at least 2 available seats for lifecycle test.');
  }

  const showtimeId = availableSeats[0].showtimeId;
  const seatIds = availableSeats.map((s: (typeof availableSeats)[0]) => s.seatId);
  const user = (await db.query.users.findFirst())!;

  console.log(`🎟️ Reserving 2 seats: ${availableSeats.map((s: (typeof availableSeats)[0]) => `${s.seat.row}${s.seat.seatNumber}`).join(', ')}`);

  // Step A: Create Seat Hold
  const holdResult = await BookingService.holdSeats({
    showtimeId,
    seatIds,
    userId: user.id,
    customerName: 'Test Lifecycle User',
    customerEmail: 'lifecycle@test.com',
    idempotencyKey: `lifecycle_hold_${Date.now()}`,
  });

  const booking = holdResult.booking;
  console.log(`✅ Hold Created: Ref ${booking.bookingReference}, Status: ${booking.status}`);

  // Verify server-side pricing calculation
  const expectedSubtotal = availableSeats.reduce((sum: number, s: (typeof availableSeats)[0]) => sum + s.priceInCents, 0);
  const expectedFee = availableSeats.length * 150;
  const expectedTax = Math.round(expectedSubtotal * 0.08875);
  const expectedTotal = expectedSubtotal + expectedFee + expectedTax;

  if (
    booking.subtotalInCents !== expectedSubtotal ||
    booking.bookingFeeInCents !== expectedFee ||
    booking.taxInCents !== expectedTax ||
    booking.totalInCents !== expectedTotal
  ) {
    throw new Error(
      `❌ Pricing calculation mismatch! Expected Total: ${expectedTotal}, got ${booking.totalInCents}`
    );
  }
  console.log(`💰 Pricing Verified: Subtotal $${(booking.subtotalInCents / 100).toFixed(2)}, Fee $${(booking.bookingFeeInCents / 100).toFixed(2)}, Tax $${(booking.taxInCents / 100).toFixed(2)}, Total $${(booking.totalInCents / 100).toFixed(2)}`);

  // Step B: Confirm Payment
  const payIdempotencyKey = `pay_lifecycle_${booking.id}_unique_test`;
  const paymentResult = await BookingService.confirmPayment({
    bookingId: booking.id,
    provider: 'MOCK_SANDBOX',
    idempotencyKey: payIdempotencyKey,
    amountInCents: booking.totalInCents,
    metadata: { test: true },
  });

  console.log(`💳 Payment Confirmed: Payment ID ${paymentResult.payment?.id}, Status: ${paymentResult.booking?.status}`);
  console.log(`🎫 Digital Tickets Issued: ${paymentResult.tickets?.length} passes`);

  if (paymentResult.booking.status !== 'CONFIRMED' || paymentResult.tickets?.length !== 2) {
    throw new Error('❌ Booking confirmation or ticket generation failed.');
  }

  // Verify seat status transitioned to BOOKED
  for (const s of availableSeats) {
    const updatedSeat = await db.query.showtimeSeats.findFirst({
      where: eq(showtimeSeats.id, s.id),
    });
    if (updatedSeat?.status !== 'BOOKED') {
      throw new Error(`❌ Seat status is ${updatedSeat?.status}, expected BOOKED`);
    }
  }
  console.log('🪑 Seat Status Verified: All reserved seats are now marked BOOKED in database.');

  // Step C: Test Payment Idempotency (replay exact same confirmation)
  console.log('🔄 Replaying identical payment confirmation with same idempotency key...');
  const duplicateResult = await BookingService.confirmPayment({
    bookingId: booking.id,
    provider: 'MOCK_SANDBOX',
    idempotencyKey: payIdempotencyKey,
    amountInCents: booking.totalInCents,
  });

  if (duplicateResult.isDuplicate) {
    console.log('🛡️ Idempotency PASS: Duplicate payment was safely recognized and deduplicated.');
  } else {
    throw new Error('❌ Idempotency failed: Duplicate payment was not recognized!');
  }

  // Step D: Test Booking Cancellation & Refund
  console.log('🚫 Testing Booking Cancellation & Inventory Release...');
  const cancelResult = await BookingService.cancelBooking(booking.id, user.id, true);

  if (!cancelResult.success || cancelResult.status !== 'CANCELLED') {
    throw new Error('❌ Cancellation failed.');
  }

  // Verify seats reverted back to AVAILABLE
  for (const s of availableSeats) {
    const revertedSeat = await db.query.showtimeSeats.findFirst({
      where: eq(showtimeSeats.id, s.id),
    });
    if (revertedSeat?.status !== 'AVAILABLE') {
      throw new Error(`❌ Seat status is ${revertedSeat?.status}, expected AVAILABLE after cancel`);
    }
  }
  console.log('🔄 Seat Release PASS: Cancelled booking seats reverted back to AVAILABLE inventory.');

  console.log('🎉 FULL BOOKING LIFECYCLE & IDEMPOTENCY TEST PASSED!');
}

testBookingLifecycle()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
