import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cinemas, auditoriums, showtimes, movies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');

    const allCinemas = await db.query.cinemas.findMany({
      with: {
        auditoriums: {
          with: {
            showtimes: {
              with: {
                movie: true,
              },
            },
          },
        },
      },
    });

    let results = allCinemas;
    if (city && city !== 'all') {
      results = results.filter(
        (c: any) => c.city.toLowerCase() === city.toLowerCase()
      );
    }

    return NextResponse.json({ cinemas: results });
  } catch (error: unknown) {
    console.error('Cinemas fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
