import { db } from '@/db';
import {
  bookings,
  bookingItems,
  showtimeSeats,
  seats,
  payments,
  tickets,
  auditLogs,
  showtimes,
  movies,
  auditoriums,
  cinemas,
} from '@/db/schema';
import { eq, and, sql, inArray, lt, or, type SQL } from 'drizzle-orm';
import crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbTx = typeof db; // Drizzle tx has same API as db; union adapter type prevents Parameters<> extraction

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export class BookingNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingNotFoundError';
  }
}

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingValidationError';
  }
}

export interface HoldSeatsParams {
  showtimeId: string;
  seatIds: string[];
  userId: string;
  customerName: string;
  customerEmail: string;
  idempotencyKey?: string;
  clientIp?: string;
}

export interface ConfirmPaymentParams {
  bookingId: string;
  paymentIntentId?: string;
  provider: 'STRIPE' | 'MOCK_SANDBOX';
  idempotencyKey: string;
  amountInCents: number;
  metadata?: Record<string, unknown>;
  clientIp?: string;
}

export class BookingService {
  /**
   * 1-7: Transactional Seat Hold & Reservation
   * Implements strict database transaction with row-level locks
   */
  static async holdSeats(params: HoldSeatsParams) {
    const {
      showtimeId,
      seatIds,
      userId,
      customerName,
      customerEmail,
      clientIp,
    } = params;

    if (!seatIds || seatIds.length === 0) {
      throw new BookingValidationError('At least one seat must be selected.');
    }

    const idempotencyKey =
      params.idempotencyKey ||
      `hold_${userId}_${showtimeId}_${seatIds.sort().join('_')}_${Math.floor(Date.now() / 60000)}`;

    return await db.transaction(async (tx: DbTx) => {
      // Check for existing booking with the same idempotency key
      const existing = await tx.query.bookings.findFirst({
        where: eq(bookings.idempotencyKey, idempotencyKey),
        with: {
          items: {
            with: {
              seat: true,
            },
          },
        },
      });

      if (existing) {
        if (existing.status === 'PENDING' && new Date(existing.holdExpiresAt) > new Date()) {
          return { booking: existing, isExisting: true };
        }
      }

      // Step 2: Lock requested showtime-seat records using FOR UPDATE
      const lockedSeatsResult = await tx.execute(
        sql`
          SELECT 
            ss.id AS showtime_seat_id,
            ss.showtime_id,
            ss.seat_id,
            ss.status,
            ss.hold_expires_at,
            ss.price_in_cents,
            s.row,
            s.seat_number,
            s.seat_type,
            s.base_price_in_cents
          FROM showtime_seats ss
          JOIN seats s ON ss.seat_id = s.id
          WHERE ss.showtime_id = ${showtimeId}
            AND ss.seat_id IN ${sql`(${sql.join(
              seatIds.map((id) => sql`${id}`),
              sql`, `
            )})`}
          FOR UPDATE OF ss
        `
      );

      const lockedSeats = (lockedSeatsResult.rows || lockedSeatsResult) as Array<{
        showtime_seat_id: string;
        showtime_id: string;
        seat_id: string;
        status: string;
        hold_expires_at: Date | string | null;
        price_in_cents: number;
        row: string;
        seat_number: number;
        seat_type: string;
        base_price_in_cents: number;
      }>;

      if (lockedSeats.length !== seatIds.length) {
        throw new BookingConflictError(
          'One or more requested seats could not be found for this showtime.'
        );
      }

      const now = new Date();

      // Step 3: Confirm every requested seat is available (or has expired hold)
      for (const seat of lockedSeats) {
        const isAvailable = seat.status === 'AVAILABLE';
        const isExpiredHold =
          seat.status === 'HELD' &&
          seat.hold_expires_at &&
          new Date(seat.hold_expires_at) < now;

        if (!isAvailable && !isExpiredHold) {
          throw new BookingConflictError(
            `Seat ${seat.row}${seat.seat_number} is no longer available. Please select another seat.`
          );
        }
      }

      // Step 4: Calculate price on the server
      const subtotalInCents = lockedSeats.reduce(
        (sum, seat) => sum + Number(seat.price_in_cents || seat.base_price_in_cents),
        0
      );
      const bookingFeeInCents = 150 * lockedSeats.length; // $1.50 service fee per ticket
      const taxInCents = Math.round(subtotalInCents * 0.08875); // 8.875% tax rate
      const totalInCents = subtotalInCents + bookingFeeInCents + taxInCents;

      // Step 5: Create temporary seat hold with 10-minute expiration
      const holdDurationMs = 10 * 60 * 1000;
      const holdExpiresAt = new Date(Date.now() + holdDurationMs);
      const bookingReference = `CB-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Step 6: Create the pending booking
      const [newBooking] = await tx
        .insert(bookings)
        .values({
          bookingReference,
          userId,
          showtimeId,
          status: 'PENDING',
          subtotalInCents,
          taxInCents,
          bookingFeeInCents,
          totalInCents,
          holdExpiresAt,
          idempotencyKey,
          customerEmail,
          customerName,
        })
        .returning();

      // Update showtime seats to HELD
      for (const seat of lockedSeats) {
        await tx
          .update(showtimeSeats)
          .set({
            status: 'HELD',
            holdExpiresAt,
            heldByBookingId: newBooking.id,
            updatedAt: now,
          })
          .where(eq(showtimeSeats.id, seat.showtime_seat_id));

        // Insert booking items
        await tx.insert(bookingItems).values({
          bookingId: newBooking.id,
          showtimeSeatId: seat.showtime_seat_id,
          seatId: seat.seat_id,
          priceInCents: Number(seat.price_in_cents || seat.base_price_in_cents),
        });
      }

      // Audit log entry
      await tx.insert(auditLogs).values({
        userId,
        action: 'HOLD_CREATED',
        entityType: 'BOOKING',
        entityId: newBooking.id,
        details: {
          bookingReference,
          seats: lockedSeats.map((s) => `${s.row}${s.seat_number}`),
          totalInCents,
          holdExpiresAt,
        },
        ipAddress: clientIp,
      });

      return { booking: newBooking, isExisting: false };
    });
  }

  /**
   * 8-9: Confirm seats only after verified payment with idempotency protection
   */
  static async confirmPayment(params: ConfirmPaymentParams) {
    const {
      bookingId,
      paymentIntentId,
      provider,
      idempotencyKey,
      amountInCents,
      metadata = {},
      clientIp,
    } = params;

    return await db.transaction(async (tx: DbTx) => {
      // Enforce payment idempotency key
      const existingPayment = await tx.query.payments.findFirst({
        where: eq(payments.idempotencyKey, idempotencyKey),
      });

      if (existingPayment && existingPayment.status === 'SUCCEEDED') {
        const booking = await tx.query.bookings.findFirst({
          where: eq(bookings.id, bookingId),
          with: { tickets: true, items: true },
        });
        return { booking, payment: existingPayment, isDuplicate: true };
      }

      // Lock booking row
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for('update');

      if (!booking) {
        throw new BookingNotFoundError(`Booking ${bookingId} not found.`);
      }

      if (booking.status === 'CONFIRMED') {
        const existingTickets = await tx.query.tickets.findMany({
          where: eq(tickets.bookingId, booking.id),
        });
        return { booking, tickets: existingTickets, isDuplicate: true };
      }

      if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
        throw new BookingConflictError(
          `Cannot confirm payment: booking has already been ${booking.status.toLowerCase()}.`
        );
      }

      const now = new Date();

      // Record payment
      const [paymentRecord] = await tx
        .insert(payments)
        .values({
          bookingId: booking.id,
          provider,
          paymentIntentId: paymentIntentId || `mock_pi_${Date.now()}`,
          status: 'SUCCEEDED',
          amountInCents,
          currency: 'USD',
          idempotencyKey,
          metadata,
        })
        .returning();

      // Update booking to CONFIRMED
      await tx
        .update(bookings)
        .set({
          status: 'CONFIRMED',
          updatedAt: now,
        })
        .where(eq(bookings.id, booking.id));

      // Update showtime_seats to BOOKED and clear holds
      const items = await tx.query.bookingItems.findMany({
        where: eq(bookingItems.bookingId, booking.id),
        with: {
          seat: true,
        },
      });

      for (const item of items) {
        await tx
          .update(showtimeSeats)
          .set({
            status: 'BOOKED',
            holdExpiresAt: null,
            heldByBookingId: null,
            updatedAt: now,
          })
          .where(eq(showtimeSeats.id, item.showtimeSeatId));
      }

      // Generate digital tickets with QR payload
      const generatedTickets = [];
      for (const item of items) {
        const ticketCode = `TKT-${booking.bookingReference.replace('CB-', '')}-${item.seat.row}${item.seat.seatNumber}`;
        const qrData = JSON.stringify({
          ticketCode,
          ref: booking.bookingReference,
          seat: `${item.seat.row}${item.seat.seatNumber}`,
          showtimeId: booking.showtimeId,
          issuedAt: now.toISOString(),
        });

        const [tkt] = await tx
          .insert(tickets)
          .values({
            bookingId: booking.id,
            ticketCode,
            qrData,
            isCheckedIn: false,
          })
          .returning();

        generatedTickets.push(tkt);
      }

      // Audit log entry
      await tx.insert(auditLogs).values({
        userId: booking.userId,
        action: 'BOOKING_CONFIRMED',
        entityType: 'BOOKING',
        entityId: booking.id,
        details: {
          bookingReference: booking.bookingReference,
          amountPaid: amountInCents,
          ticketCodes: generatedTickets.map((t) => t.ticketCode),
          paymentId: paymentRecord.id,
        },
        ipAddress: clientIp,
      });

      return {
        booking: { ...booking, status: 'CONFIRMED' as const },
        payment: paymentRecord,
        tickets: generatedTickets,
        isDuplicate: false,
      };
    });
  }

  /**
   * Releasing expired seat holds - Idempotent operation safe for Vercel Cron
   */
  static async releaseExpiredHolds() {
    const now = new Date();

    return await db.transaction(async (tx: DbTx) => {
      // Find all pending bookings with past hold expiration
      const expiredBookings = await tx
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.status, 'PENDING'),
            lt(bookings.holdExpiresAt, now)
          )
        )
        .for('update');

      let releasedSeatsCount = 0;
      const releasedBookingIds: string[] = [];

      for (const b of expiredBookings) {
        // Mark booking as EXPIRED
        await tx
          .update(bookings)
          .set({ status: 'EXPIRED', updatedAt: now })
          .where(eq(bookings.id, b.id));

        // Revert associated showtime seats to AVAILABLE
        const updated = await tx
          .update(showtimeSeats)
          .set({
            status: 'AVAILABLE',
            holdExpiresAt: null,
            heldByBookingId: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(showtimeSeats.heldByBookingId, b.id),
              eq(showtimeSeats.status, 'HELD')
            )
          );

        releasedBookingIds.push(b.id);

        await tx.insert(auditLogs).values({
          action: 'HOLD_EXPIRED',
          entityType: 'BOOKING',
          entityId: b.id,
          details: {
            bookingReference: b.bookingReference,
            expiredAt: now.toISOString(),
          },
        });
      }

      // Also clean up any orphaned HELD showtime seats whose hold expired
      const orphanedSeats = await tx
        .update(showtimeSeats)
        .set({
          status: 'AVAILABLE',
          holdExpiresAt: null,
          heldByBookingId: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(showtimeSeats.status, 'HELD'),
            lt(showtimeSeats.holdExpiresAt, now)
          )
        );

      return {
        success: true,
        releasedBookingsCount: expiredBookings.length,
        releasedBookingIds,
        timestamp: now.toISOString(),
      };
    });
  }

  /**
   * Cancel an eligible booking (with seats release and refund log)
   */
  static async cancelBooking(bookingId: string, userId: string, isAdmin = false) {
    return await db.transaction(async (tx: DbTx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for('update');

      if (!booking) {
        throw new BookingNotFoundError('Booking not found.');
      }

      if (!isAdmin && booking.userId !== userId) {
        throw new BookingValidationError('You do not have permission to cancel this booking.');
      }

      if (booking.status !== 'CONFIRMED') {
        throw new BookingValidationError(
          `Cannot cancel booking with status: ${booking.status}`
        );
      }

      // Check showtime start time: must be at least 2 hours before showtime (unless admin)
      if (!isAdmin) {
        const showtime = await tx.query.showtimes.findFirst({
          where: eq(showtimes.id, booking.showtimeId),
        });

        if (showtime) {
          const hoursUntilShow =
            (new Date(showtime.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
          if (hoursUntilShow < 2) {
            throw new BookingValidationError(
              'Bookings cannot be cancelled less than 2 hours before showtime.'
            );
          }
        }
      }

      const now = new Date();

      // Update booking to CANCELLED
      await tx
        .update(bookings)
        .set({
          status: 'CANCELLED',
          updatedAt: now,
        })
        .where(eq(bookings.id, booking.id));

      // Revert showtime_seats back to AVAILABLE
      const items = await tx.query.bookingItems.findMany({
        where: eq(bookingItems.bookingId, booking.id),
      });

      for (const item of items) {
        await tx
          .update(showtimeSeats)
          .set({
            status: 'AVAILABLE',
            holdExpiresAt: null,
            heldByBookingId: null,
            updatedAt: now,
          })
          .where(eq(showtimeSeats.id, item.showtimeSeatId));
      }

      // Update payment status to REFUNDED
      await tx
        .update(payments)
        .set({
          status: 'REFUNDED',
          updatedAt: now,
        })
        .where(eq(payments.bookingId, booking.id));

      // Insert audit log
      await tx.insert(auditLogs).values({
        userId,
        action: 'BOOKING_CANCELLED',
        entityType: 'BOOKING',
        entityId: booking.id,
        details: {
          bookingReference: booking.bookingReference,
          cancelledBy: isAdmin ? 'ADMIN' : 'USER',
          refundAmountInCents: booking.totalInCents,
        },
      });

      return {
        success: true,
        bookingReference: booking.bookingReference,
        status: 'CANCELLED',
      };
    });
  }

  /**
   * Fetch complete booking details including seats, showtime, movie, auditorium, cinema, and tickets
   */
  static async getBookingDetails(bookingIdOrReference: string) {
    const booking = await db.query.bookings.findFirst({
      where: or(
        eq(bookings.id, bookingIdOrReference),
        eq(bookings.bookingReference, bookingIdOrReference)
      ),
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

    return booking;
  }
}
