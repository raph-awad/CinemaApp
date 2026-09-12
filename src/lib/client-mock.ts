'use client';

/**
 * Client-side mock API interceptor for GitHub Pages static hosting
 * Allows CineBook to run 100% in the browser without requiring a Node.js server.
 */

export interface MockMovie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string | null;
  durationMinutes: number;
  releaseDate: string;
  language: string;
  rating: string;
  featured: boolean;
  genres: Array<{ id: string; name: string; slug: string }>;
  showtimeCount: number;
}

export interface MockCinema {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  facilities: string[];
  imageUrl: string;
}

export const MOCK_CINEMAS: MockCinema[] = [
  {
    id: 'cinema-1',
    name: 'CineGrand IMAX & Dolby Atmos',
    slug: 'cinegrand-imax-downtown',
    city: 'Downtown',
    address: '450 Grand Avenue, Metropolis',
    phone: '+1 (555) 019-2831',
    facilities: ['IMAX with Laser', 'Dolby Atmos', 'VIP Lounge', 'Gourmet Dine-in', 'Wheelchair Accessible'],
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
  },
  {
    id: 'cinema-2',
    name: 'Starlight Luxury Suites',
    slug: 'starlight-luxury-suites',
    city: 'Uptown',
    address: '880 North Boulevard, Suite 400',
    phone: '+1 (555) 018-9942',
    facilities: ['Heated Recliners', 'Dolby Cinema', 'At-Seat Cocktail Bar', 'Laser Projection'],
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&q=80',
  },
  {
    id: 'cinema-3',
    name: 'Horizon VIP Cinema & Lounge',
    slug: 'horizon-vip-cinema',
    city: 'Midtown',
    address: '120 Skyline Drive, Sky Tower Level 3',
    phone: '+1 (555) 014-4411',
    facilities: ['Private Pods', 'Dolby Atmos', 'Chef Tasting Menu', 'Valet Parking'],
    imageUrl: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=1200&q=80',
  },
];

export const MOCK_MOVIES: MockMovie[] = [
  {
    id: 'movie-1',
    title: 'Dune: Part Two',
    slug: 'dune-part-two',
    synopsis:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    durationMinutes: 166,
    releaseDate: '2024-03-01',
    language: 'English',
    rating: 'PG-13',
    featured: true,
    genres: [
      { id: 'g-1', name: 'Sci-Fi', slug: 'sci-fi' },
      { id: 'g-2', name: 'Adventure', slug: 'adventure' },
      { id: 'g-3', name: 'Action', slug: 'action' },
    ],
    showtimeCount: 8,
  },
  {
    id: 'movie-2',
    title: 'Oppenheimer',
    slug: 'oppenheimer',
    synopsis:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, exploring the moral and geopolitical aftermath of the Manhattan Project.',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    durationMinutes: 180,
    releaseDate: '2023-07-21',
    language: 'English',
    rating: 'R',
    featured: true,
    genres: [
      { id: 'g-4', name: 'Drama', slug: 'drama' },
      { id: 'g-5', name: 'History', slug: 'history' },
      { id: 'g-6', name: 'Thriller', slug: 'thriller' },
    ],
    showtimeCount: 6,
  },
  {
    id: 'movie-3',
    title: 'Interstellar',
    slug: 'interstellar',
    synopsis:
      'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    durationMinutes: 169,
    releaseDate: '2014-11-07',
    language: 'English',
    rating: 'PG-13',
    featured: false,
    genres: [
      { id: 'g-1', name: 'Sci-Fi', slug: 'sci-fi' },
      { id: 'g-4', name: 'Drama', slug: 'drama' },
      { id: 'g-2', name: 'Adventure', slug: 'adventure' },
    ],
    showtimeCount: 5,
  },
  {
    id: 'movie-4',
    title: 'Spider-Man: Across the Spider-Verse',
    slug: 'spider-man-across-the-spider-verse',
    synopsis:
      'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    durationMinutes: 140,
    releaseDate: '2023-06-02',
    language: 'English',
    rating: 'PG',
    featured: false,
    genres: [
      { id: 'g-7', name: 'Animation', slug: 'animation' },
      { id: 'g-3', name: 'Action', slug: 'action' },
      { id: 'g-1', name: 'Sci-Fi', slug: 'sci-fi' },
    ],
    showtimeCount: 7,
  },
  {
    id: 'movie-5',
    title: 'Past Lives',
    slug: 'past-lives',
    synopsis:
      'Nora and Hae Sung, two deeply connected childhood friends, are wrest apart after Noras family emigrates from South Korea. Decades later, they are reunited for one fateful week as they confront notions of destiny and love.',
    posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=kA244xewjcI',
    durationMinutes: 105,
    releaseDate: '2023-06-23',
    language: 'Korean',
    rating: 'PG-13',
    featured: false,
    genres: [
      { id: 'g-4', name: 'Drama', slug: 'drama' },
      { id: 'g-8', name: 'Romance', slug: 'romance' },
    ],
    showtimeCount: 4,
  },
  {
    id: 'movie-6',
    title: 'Poor Things',
    slug: 'poor-things',
    synopsis:
      'The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.',
    posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=RlbR5N6veqw',
    durationMinutes: 141,
    releaseDate: '2023-12-08',
    language: 'English',
    rating: 'R',
    featured: false,
    genres: [
      { id: 'g-9', name: 'Comedy', slug: 'comedy' },
      { id: 'g-4', name: 'Drama', slug: 'drama' },
      { id: 'g-1', name: 'Sci-Fi', slug: 'sci-fi' },
    ],
    showtimeCount: 4,
  },
];

export function generateMockShowtimes(movieSlug: string) {
  const movie = MOCK_MOVIES.find((m) => m.slug === movieSlug) || MOCK_MOVIES[0];
  const cinema = MOCK_CINEMAS[0];
  const now = new Date();

  return [
    {
      id: `showtime-${movie.id}-1`,
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 15).toISOString(),
      format: '2D Digital',
      basePriceInCents: 1450,
      auditorium: {
        id: 'aud-1',
        name: 'Grand Screen 1',
        screenType: 'Standard Digital',
        cinema: {
          id: cinema.id,
          name: cinema.name,
          city: cinema.city,
          address: cinema.address,
        },
      },
    },
    {
      id: `showtime-${movie.id}-2`,
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 45).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 30).toISOString(),
      format: '3D Dolby',
      basePriceInCents: 1750,
      auditorium: {
        id: 'aud-2',
        name: 'Dolby Cinema Hall',
        screenType: 'Dolby Atmos 3D',
        cinema: {
          id: cinema.id,
          name: cinema.name,
          city: cinema.city,
          address: cinema.address,
        },
      },
    },
    {
      id: `showtime-${movie.id}-3`,
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 30).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 15).toISOString(),
      format: 'IMAX with Laser',
      basePriceInCents: 2050,
      auditorium: {
        id: 'aud-3',
        name: 'IMAX Grand Auditorium',
        screenType: 'IMAX Laser 70mm',
        cinema: {
          id: cinema.id,
          name: cinema.name,
          city: cinema.city,
          address: cinema.address,
        },
      },
    },
    {
      id: `showtime-${movie.id}-4`,
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 15).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 1, 0).toISOString(),
      format: 'VIP Recliner',
      basePriceInCents: 2450,
      auditorium: {
        id: 'aud-4',
        name: 'VIP Private Suite',
        screenType: 'VIP Luxe Recliner',
        cinema: {
          id: MOCK_CINEMAS[1].id,
          name: MOCK_CINEMAS[1].name,
          city: MOCK_CINEMAS[1].city,
          address: MOCK_CINEMAS[1].address,
        },
      },
    },
  ];
}

export function generateMockSeats(showtimeId: string) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsPerRow = 8;
  const seats: Array<{
    showtimeSeatId: string;
    seatId: string;
    row: string;
    seatNumber: number;
    seatType: 'STANDARD' | 'VIP' | 'RECLINER' | 'ACCESSIBLE';
    status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
    priceInCents: number;
  }> = [];

  // Consistent pseudo-random occupied seats based on showtimeId
  const occupiedSet = new Set(['B3', 'B4', 'D4', 'D5', 'E2']);

  rows.forEach((row, rIdx) => {
    let seatType: 'STANDARD' | 'VIP' | 'RECLINER' | 'ACCESSIBLE' = 'STANDARD';
    let basePrice = 1450;

    if (row === 'A') {
      seatType = 'ACCESSIBLE';
      basePrice = 1450;
    } else if (row === 'C' || row === 'D') {
      seatType = 'VIP';
      basePrice = 1950;
    } else if (row === 'E' || row === 'F') {
      seatType = 'RECLINER';
      basePrice = 2450;
    }

    for (let num = 1; num <= seatsPerRow; num++) {
      const code = `${row}${num}`;
      const isOccupied = occupiedSet.has(code);
      seats.push({
        showtimeSeatId: `ss-${showtimeId}-${code}`,
        seatId: `seat-${code}`,
        row,
        seatNumber: num,
        seatType,
        status: isOccupied ? 'BOOKED' : 'AVAILABLE',
        priceInCents: basePrice,
      });
    }
  });

  return seats;
}

// Client-side LocalStorage DB for bookings
function getLocalBookings(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('cinebook_bookings') || '[]');
  } catch {
    return [];
  }
}

function saveLocalBooking(booking: any) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalBookings().filter((b) => b.id !== booking.id);
    list.unshift(booking);
    localStorage.setItem('cinebook_bookings', JSON.stringify(list));
  } catch {}
}

/**
 * Global fetch interceptor for running in pure static browser environments
 */
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Only intercept /api/ routes
    if (urlString.includes('/api/')) {
      const parsedUrl = new URL(urlString, window.location.origin);
      const path = parsedUrl.pathname.replace(/^\/CinemaApp/, ''); // Strip GitHub Pages basePath
      const method = (init?.method || 'GET').toUpperCase();

      // 1. GET /api/movies
      if (path === '/api/movies' && method === 'GET') {
        const search = parsedUrl.searchParams.get('search')?.toLowerCase() || '';
        const genre = parsedUrl.searchParams.get('genre')?.toLowerCase() || 'all';
        const cinemaId = parsedUrl.searchParams.get('cinemaId') || 'all';

        let filtered = [...MOCK_MOVIES];
        if (search) {
          filtered = filtered.filter(
            (m) => m.title.toLowerCase().includes(search) || m.synopsis.toLowerCase().includes(search)
          );
        }
        if (genre !== 'all') {
          filtered = filtered.filter((m) => m.genres.some((g) => g.slug === genre));
        }

        return new Response(JSON.stringify({ movies: filtered }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 2. GET /api/cinemas
      if (path === '/api/cinemas' && method === 'GET') {
        return new Response(JSON.stringify({ cinemas: MOCK_CINEMAS }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 3. GET /api/movies/:slug (showtime & movie details)
      const movieSlugMatch = path.match(/^\/api\/movies\/([^\/]+)$/);
      if (movieSlugMatch && method === 'GET') {
        const slug = movieSlugMatch[1];
        const movie = MOCK_MOVIES.find((m) => m.slug === slug) || MOCK_MOVIES[0];
        const showtimes = generateMockShowtimes(movie.slug);
        return new Response(JSON.stringify({ movie: { ...movie, showtimes } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 4. GET /api/showtimes/:id/seats
      const showtimeSeatsMatch = path.match(/^\/api\/showtimes\/([^\/]+)\/seats$/);
      if (showtimeSeatsMatch && method === 'GET') {
        const showtimeId = showtimeSeatsMatch[1];
        const showtimes = generateMockShowtimes('dune-part-two');
        const showtime = showtimes[0];
        const seats = generateMockSeats(showtimeId);
        return new Response(
          JSON.stringify({
            showtime: {
              ...showtime,
              id: showtimeId,
              movie: MOCK_MOVIES[0],
            },
            seats,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 5. POST /api/bookings/hold
      if (path === '/api/bookings/hold' && method === 'POST') {
        const body = init?.body ? JSON.parse(init.body.toString()) : {};
        const { showtimeId, seatIds, customerName, customerEmail } = body;

        const allSeats = generateMockSeats(showtimeId || 'showtime-1');
        const selectedSeatObjects = allSeats.filter((s) => (seatIds || []).includes(s.seatId));
        const subtotal = selectedSeatObjects.reduce((acc, s) => acc + s.priceInCents, 0) || 3400;
        const fee = (seatIds?.length || 2) * 150;
        const tax = Math.round(subtotal * 0.08875);
        const total = subtotal + fee + tax;

        const bookingId = `bk_${Date.now()}`;
        const bookingRef = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const mockBooking = {
          id: bookingId,
          bookingReference: bookingRef,
          status: 'PENDING',
          subtotalInCents: subtotal,
          taxInCents: tax,
          bookingFeeInCents: fee,
          totalInCents: total,
          holdExpiresAt: expiresAt,
          customerName: customerName || 'Valued Cinephile',
          customerEmail: customerEmail || 'guest@cinebook.com',
          showtime: {
            startTime: new Date(Date.now() + 3600000).toISOString(),
            format: 'IMAX Laser 70mm',
            movie: MOCK_MOVIES[0],
            auditorium: {
              name: 'IMAX Grand Auditorium',
              screenType: 'IMAX 70mm',
              cinema: MOCK_CINEMAS[0],
            },
          },
          items: selectedSeatObjects.map((s, idx) => ({
            id: `item-${idx}`,
            priceInCents: s.priceInCents,
            seat: {
              row: s.row,
              seatNumber: s.seatNumber,
              seatType: s.seatType,
            },
          })),
        };

        saveLocalBooking(mockBooking);

        return new Response(JSON.stringify({ booking: mockBooking, isExisting: false }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 6. GET /api/bookings/:id
      const bookingGetMatch = path.match(/^\/api\/bookings\/([^\/]+)$/);
      if (bookingGetMatch && method === 'GET') {
        const id = bookingGetMatch[1];
        const list = getLocalBookings();
        const found = list.find((b) => b.id === id || b.bookingReference === id);
        if (found) {
          return new Response(JSON.stringify({ booking: found }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 7. POST /api/checkout/sandbox-pay
      if (path === '/api/checkout/sandbox-pay' && method === 'POST') {
        const body = init?.body ? JSON.parse(init.body.toString()) : {};
        const { bookingId } = body;
        const list = getLocalBookings();
        const booking = list.find((b) => b.id === bookingId) || list[0];

        if (booking) {
          booking.status = 'CONFIRMED';
          saveLocalBooking(booking);
        }

        return new Response(
          JSON.stringify({
            success: true,
            booking: booking || { id: bookingId, status: 'CONFIRMED', bookingReference: 'CB-8941' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 8. GET /api/tickets/:reference
      const ticketMatch = path.match(/^\/api\/tickets\/([^\/]+)$/);
      if (ticketMatch && method === 'GET') {
        const ref = ticketMatch[1];
        const list = getLocalBookings();
        const booking = list.find((b) => b.bookingReference === ref || b.id === ref) || list[0];

        return new Response(
          JSON.stringify({
            booking: booking || {
              bookingReference: ref,
              status: 'CONFIRMED',
              totalInCents: 4200,
              showtime: {
                startTime: new Date().toISOString(),
                format: 'IMAX Laser 70mm',
                movie: MOCK_MOVIES[0],
                auditorium: {
                  name: 'Grand Auditorium',
                  cinema: MOCK_CINEMAS[0],
                },
              },
              items: [
                { id: '1', priceInCents: 1950, seat: { row: 'D', seatNumber: 4, seatType: 'VIP' } },
                { id: '2', priceInCents: 1950, seat: { row: 'D', seatNumber: 5, seatType: 'VIP' } },
              ],
            },
            tickets: [
              {
                id: 't-1',
                ticketCode: `${ref}-D4`,
                qrData: `CINEBOOK:${ref}:D4:VERIFIED`,
                isCheckedIn: false,
                checkedInAt: null,
              },
              {
                id: 't-2',
                ticketCode: `${ref}-D5`,
                qrData: `CINEBOOK:${ref}:D5:VERIFIED`,
                isCheckedIn: false,
                checkedInAt: null,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 9. GET /api/auth/me
      if (path === '/api/auth/me' && method === 'GET') {
        return new Response(
          JSON.stringify({
            user: {
              id: 'user-demo-1',
              email: 'guest@cinebook.com',
              name: 'Valued Cinephile',
              role: 'USER',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 10. GET /api/admin/metrics
      if (path === '/api/admin/metrics' && method === 'GET') {
        return new Response(
          JSON.stringify({
            metrics: {
              totalRevenueCents: 842500,
              totalBookings: 248,
              totalTicketsSold: 582,
              averageOccupancyRate: 84.6,
              activeHolds: 12,
            },
            recentBookings: getLocalBookings().slice(0, 5),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 11. GET /api/bookings/my-bookings
      if (path === '/api/bookings/my-bookings' && method === 'GET') {
        return new Response(JSON.stringify({ bookings: getLocalBookings() }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Pass through all other requests to original fetch
    try {
      return await originalFetch(input, init);
    } catch (err) {
      // If network fails (like on static hosts), return a fallback JSON
      return new Response(JSON.stringify({ error: 'Endpoint handled client-side' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
