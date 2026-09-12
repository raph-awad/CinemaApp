import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/services/booking.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleRelease(req);
}

export async function POST(req: NextRequest) {
  return handleRelease(req);
}

async function handleRelease(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const vercelCronHeader = req.headers.get('x-vercel-cron');
    const cronSecret = process.env.CRON_SECRET;

    // Verify CRON_SECRET if configured
    if (cronSecret) {
      const isBearerValid = authHeader === `Bearer ${cronSecret}`;
      const isVercelCronValid = !!vercelCronHeader;

      if (!isBearerValid && !isVercelCronValid) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing CRON_SECRET' },
          { status: 401 }
        );
      }
    }

    const result = await BookingService.releaseExpiredHolds();

    return NextResponse.json({
      message: 'Expired seat holds released successfully.',
      ...result,
    });
  } catch (error: unknown) {
    console.error('[CRON release-holds] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
