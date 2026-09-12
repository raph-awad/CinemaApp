import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, showtimeSeats, tickets } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    // Revenue and confirmed bookings
    const confirmedStats = await db
      .select({
        totalRevenueInCents: sql<number>`coalesce(sum(${bookings.totalInCents}), 0)`,
        confirmedCount: sql<number>`count(${bookings.id})`,
      })
      .from(bookings)
      .where(eq(bookings.status, 'CONFIRMED'));

    // Total seat inventory breakdown
    const seatStats = await db
      .select({
        totalSeats: sql<number>`count(*)`,
        bookedSeats: sql<number>`count(*) filter (where ${showtimeSeats.status} = 'BOOKED')`,
        heldSeats: sql<number>`count(*) filter (where ${showtimeSeats.status} = 'HELD')`,
        availableSeats: sql<number>`count(*) filter (where ${showtimeSeats.status} = 'AVAILABLE')`,
      })
      .from(showtimeSeats);

    // Total tickets checked in
    const checkinStats = await db
      .select({
        totalTickets: sql<number>`count(*)`,
        checkedIn: sql<number>`count(*) filter (where ${tickets.isCheckedIn} = true)`,
      })
      .from(tickets);

    const revenueCents = Number(confirmedStats[0]?.totalRevenueInCents || 0);
    const confirmedBookings = Number(confirmedStats[0]?.confirmedCount || 0);
    const totalSeats = Number(seatStats[0]?.totalSeats || 0);
    const bookedSeats = Number(seatStats[0]?.bookedSeats || 0);
    const heldSeats = Number(seatStats[0]?.heldSeats || 0);
    const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    return NextResponse.json({
      revenueCents,
      revenueFormatted: `$${(revenueCents / 100).toFixed(2)}`,
      confirmedBookings,
      totalSeats,
      bookedSeats,
      heldSeats,
      occupancyRate,
      ticketsCheckedIn: Number(checkinStats[0]?.checkedIn || 0),
      totalTicketsIssued: Number(checkinStats[0]?.totalTickets || 0),
    });
  } catch (error: unknown) {
    console.error('Admin metrics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
