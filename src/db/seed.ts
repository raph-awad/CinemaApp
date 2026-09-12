import { db } from './index';
import {
  users,
  genres,
  movies,
  movieGenres,
  cinemas,
  auditoriums,
  seats,
  showtimes,
  showtimeSeats,
} from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Starting database seed for CineBook...');

  // 1. Seed Users
  console.log('👤 Seeding default users...');
  const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
  const userPassword = await bcrypt.hash('UserPassword123!', 10);

  const [adminUser] = await db
    .insert(users)
    .values({
      email: 'admin@cinebook.com',
      passwordHash: adminPassword,
      name: 'Cinema Operations Director',
      role: 'ADMIN',
    })
    .onConflictDoNothing()
    .returning();

  const [customerUser] = await db
    .insert(users)
    .values({
      email: 'user@cinebook.com',
      passwordHash: userPassword,
      name: 'Alex Vance',
      role: 'USER',
    })
    .onConflictDoNothing()
    .returning();

  // 2. Seed Genres
  console.log('🎭 Seeding genres...');
  const genreList = [
    { name: 'Action', slug: 'action' },
    { name: 'Sci-Fi', slug: 'sci-fi' },
    { name: 'Drama', slug: 'drama' },
    { name: 'Thriller', slug: 'thriller' },
    { name: 'Animation', slug: 'animation' },
    { name: 'Adventure', slug: 'adventure' },
    { name: 'Horror', slug: 'horror' },
  ];

  const insertedGenres = await db
    .insert(genres)
    .values(genreList)
    .onConflictDoNothing()
    .returning();

  // Query all genres to ensure we have IDs even if onConflictDoNothing skipped
  const allGenres = await db.select().from(genres);
  const genreMap = new Map(allGenres.map((g: typeof genres.$inferSelect) => [g.slug, g.id]));

  // 3. Seed Movies
  console.log('🎬 Seeding movies...');
  const movieList = [
    {
      title: 'Cosmic Horizons: Odyssey',
      slug: 'cosmic-horizons-odyssey',
      synopsis:
        'When deep space researchers uncover a tachyon anomaly at the edge of the solar system, a crew of astronauts embarks on a mission beyond the event horizon to prevent temporal collapse.',
      posterUrl:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      backdropUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      durationMinutes: 168,
      releaseDate: new Date('2026-06-15T00:00:00Z'),
      language: 'English',
      rating: 'PG-13',
      featured: true,
      genreSlugs: ['sci-fi', 'adventure'],
    },
    {
      title: 'Neon Requiem',
      slug: 'neon-requiem',
      synopsis:
        'In a rain-slicked cyberpunk metropolis, a rogue cybernetic detective must solve a high-level corporate assassination before the city-wide network triggers martial law.',
      posterUrl:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      backdropUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
      durationMinutes: 142,
      releaseDate: new Date('2026-07-02T00:00:00Z'),
      language: 'English',
      rating: 'R',
      featured: true,
      genreSlugs: ['action', 'thriller', 'sci-fi'],
    },
    {
      title: 'The Golden Citadel',
      slug: 'the-golden-citadel',
      synopsis:
        'An ancient dynasty battles betrayal within its sacred fortress walls as four heirs confront prophecies that will either restore their empire or consume it in flame.',
      posterUrl:
        'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80',
      backdropUrl:
        'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1920&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      durationMinutes: 155,
      releaseDate: new Date('2026-05-20T00:00:00Z'),
      language: 'English',
      rating: 'PG-13',
      featured: false,
      genreSlugs: ['drama', 'action'],
    },
    {
      title: 'Aero: Wings of Lumina',
      slug: 'aero-wings-of-lumina',
      synopsis:
        'A young mechanical inventor and her loyal clockwork falcon take to floating sky islands in an enchanting quest to rekindle the starlight that protects their world.',
      posterUrl:
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      backdropUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=1g3_CFmnU7k',
      durationMinutes: 104,
      releaseDate: new Date('2026-08-10T00:00:00Z'),
      language: 'English',
      rating: 'PG',
      featured: false,
      genreSlugs: ['animation', 'adventure'],
    },
    {
      title: 'Midnight in Kyoto',
      slug: 'midnight-in-kyoto',
      synopsis:
        'A retired jazz pianist and an enigmatic photojournalist cross paths during a snowy winter week in Kyoto, discovering secrets from their shared past.',
      posterUrl:
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      backdropUrl:
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=kYJfa_O3h3g',
      durationMinutes: 118,
      releaseDate: new Date('2026-04-18T00:00:00Z'),
      language: 'Japanese',
      rating: 'PG-13',
      featured: false,
      genreSlugs: ['drama'],
    },
  ];

  for (const m of movieList) {
    const { genreSlugs, ...movieData } = m;
    const [inserted] = await db
      .insert(movies)
      .values(movieData)
      .onConflictDoNothing()
      .returning();

    const targetMovie =
      inserted ||
      (await db.query.movies.findFirst({ where: eq(movies.slug, m.slug) }));

    if (targetMovie) {
      for (const gSlug of genreSlugs) {
        const gId = genreMap.get(gSlug);
        if (gId) {
          await db
            .insert(movieGenres)
            .values({ movieId: targetMovie.id, genreId: gId })
            .onConflictDoNothing();
        }
      }
    }
  }

  // 4. Seed Cinemas
  console.log('🏛️ Seeding cinemas...');
  const cinemaList = [
    {
      name: 'CineBook Grand Luxe & IMAX',
      slug: 'cinebook-grand-luxe-imax',
      address: '742 Broadway Avenue',
      city: 'New York',
      phone: '+1 (212) 555-0199',
      facilities: ['IMAX 70mm', 'Dolby Atmos', 'VIP Recliners', 'Gourmet Bar', 'Valet Parking'],
      imageUrl:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'CineBook Sunset Dolby Cinema',
      slug: 'cinebook-sunset-dolby',
      address: '6801 Hollywood Blvd',
      city: 'Los Angeles',
      phone: '+1 (323) 555-0144',
      facilities: ['Dolby Vision Laser', 'Dolby Atmos', 'Heated Recliners', 'Cocktail Lounge'],
      imageUrl:
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'CineBook Marina Bay Cinema',
      slug: 'cinebook-marina-bay',
      address: '100 North Point Pier',
      city: 'San Francisco',
      phone: '+1 (415) 555-0182',
      facilities: ['Laser 4K', 'Dine-in Theater', 'Full Bar', 'Boutique Auditoriums'],
      imageUrl:
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  for (const c of cinemaList) {
    const [insertedCinema] = await db
      .insert(cinemas)
      .values(c)
      .onConflictDoNothing()
      .returning();

    const cinemaRecord =
      insertedCinema ||
      (await db.query.cinemas.findFirst({ where: eq(cinemas.slug, c.slug) }));

    if (!cinemaRecord) continue;

    // 5. Seed Auditoriums for this cinema
    const screens = [
      { name: 'Auditorium 1 - IMAX Grand', screenType: 'IMAX', totalSeats: 48 },
      { name: 'Auditorium 2 - Dolby Atmos', screenType: 'DOLBY_CINEMA', totalSeats: 36 },
      { name: 'Auditorium 3 - VIP Royale', screenType: 'VIP', totalSeats: 24 },
    ];

    for (const screen of screens) {
      const [insertedAud] = await db
        .insert(auditoriums)
        .values({
          cinemaId: cinemaRecord.id,
          name: screen.name,
          screenType: screen.screenType,
          totalSeats: screen.totalSeats,
        })
        .onConflictDoNothing()
        .returning();

      const audRecord =
        insertedAud ||
        (await db.query.auditoriums.findFirst({
          where: eq(auditoriums.name, screen.name),
        }));

      if (!audRecord) continue;

      // 6. Seed Seats for this Auditorium
      const rows = screen.screenType === 'VIP' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
      const seatsPerRow = screen.totalSeats / rows.length;

      const seatInserts = [];
      for (const row of rows) {
        for (let num = 1; num <= seatsPerRow; num++) {
          let seatType: 'STANDARD' | 'VIP' | 'RECLINER' | 'ACCESSIBLE' = 'STANDARD';
          let price = 1600; // $16.00

          if (row === 'A' && (num === 1 || num === seatsPerRow)) {
            seatType = 'ACCESSIBLE';
            price = 1400;
          } else if (screen.screenType === 'VIP' || row === 'D') {
            seatType = 'RECLINER';
            price = 2600;
          } else if (row === 'C') {
            seatType = 'VIP';
            price = 2100;
          }

          seatInserts.push({
            auditoriumId: audRecord.id,
            row,
            seatNumber: num,
            seatType,
            basePriceInCents: price,
          });
        }
      }

      await db.insert(seats).values(seatInserts).onConflictDoNothing();
    }
  }

  // 7. Seed Showtimes & Showtime Seats
  console.log('🎟️ Scheduling showtimes and generating seat inventory...');
  const allMovies = await db.select().from(movies);
  const allAuditoriums = await db.select().from(auditoriums);

  // Generate showtimes for today and the next 4 days
  const now = new Date();
  const timeslots = [
    { hour: 13, minute: 30, format: '2D', priceDelta: 0 },
    { hour: 16, minute: 45, format: '3D', priceDelta: 300 },
    { hour: 19, minute: 30, format: 'IMAX', priceDelta: 600 },
    { hour: 22, minute: 15, format: '2D', priceDelta: 0 },
  ];

  for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
    for (let mIdx = 0; mIdx < Math.min(allMovies.length, 3); mIdx++) {
      const movie = allMovies[mIdx];
      const aud = allAuditoriums[mIdx % allAuditoriums.length];
      const slot = timeslots[mIdx % timeslots.length];

      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() + dayOffset);
      startTime.setHours(slot.hour, slot.minute, 0, 0);

      const endTime = new Date(startTime.getTime() + movie.durationMinutes * 60000);

      const [showtime] = await db
        .insert(showtimes)
        .values({
          movieId: movie.id,
          auditoriumId: aud.id,
          startTime,
          endTime,
          basePriceInCents: 1600 + slot.priceDelta,
          format: slot.format,
        })
        .returning();

      if (showtime) {
        // Fetch all seats in this auditorium and create showtime_seats
        const audSeats = await db
          .select()
          .from(seats)
          .where(eq(seats.auditoriumId, aud.id));

        const showtimeSeatInserts = audSeats.map((s: typeof seats.$inferSelect) => ({
          showtimeId: showtime.id,
          seatId: s.id,
          status: 'AVAILABLE' as const,
          priceInCents: s.basePriceInCents + slot.priceDelta,
        }));

        if (showtimeSeatInserts.length > 0) {
          await db
            .insert(showtimeSeats)
            .values(showtimeSeatInserts)
            .onConflictDoNothing();
        }
      }
    }
  }

  console.log('✅ Seeding completed successfully!');
}

// Allow direct execution via CLI
if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => {
      console.log('✨ Seed script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed script error:', err);
      process.exit(1);
    });
}
