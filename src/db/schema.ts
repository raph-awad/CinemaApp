import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const seatTypeEnum = pgEnum('seat_type', ['STANDARD', 'VIP', 'RECLINER', 'ACCESSIBLE']);
export const seatStatusEnum = pgEnum('seat_status', ['AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
]);
export const paymentProviderEnum = pgEnum('payment_provider', ['STRIPE', 'MOCK_SANDBOX']);

// 1. Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('USER').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
  ]
);

// 2. Genres table
export const genres = pgTable(
  'genres',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('genres_slug_idx').on(table.slug),
  ]
);

// 3. Movies table
export const movies = pgTable(
  'movies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    synopsis: text('synopsis').notNull(),
    posterUrl: text('poster_url').notNull(),
    backdropUrl: text('backdrop_url').notNull(),
    trailerUrl: text('trailer_url'),
    durationMinutes: integer('duration_minutes').notNull(),
    releaseDate: timestamp('release_date', { withTimezone: true, mode: 'date' }).notNull(),
    language: varchar('language', { length: 50 }).notNull().default('English'),
    rating: varchar('rating', { length: 20 }).notNull().default('PG-13'), // G, PG, PG-13, R, NC-17
    featured: boolean('featured').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('movies_slug_idx').on(table.slug),
    index('movies_release_date_idx').on(table.releaseDate),
    index('movies_language_idx').on(table.language),
  ]
);

// 4. Movie Genres junction table
export const movieGenres = pgTable(
  'movie_genres',
  {
    movieId: uuid('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    genreId: uuid('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('movie_genre_unique_idx').on(table.movieId, table.genreId),
    index('movie_genre_movie_id_idx').on(table.movieId),
    index('movie_genre_genre_id_idx').on(table.genreId),
  ]
);

// 5. Cinemas table
export const cinemas = pgTable(
  'cinemas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    address: text('address').notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    facilities: jsonb('facilities').$type<string[]>().default([]).notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('cinemas_city_idx').on(table.city),
    index('cinemas_slug_idx').on(table.slug),
  ]
);

// 6. Auditoriums table (with unique constraint for screen name within cinema)
export const auditoriums = pgTable(
  'auditoriums',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cinemaId: uuid('cinema_id')
      .notNull()
      .references(() => cinemas.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(), // e.g., "Screen 1 - IMAX", "Lounge A"
    screenType: varchar('screen_type', { length: 50 }).notNull().default('STANDARD'), // STANDARD, IMAX, DOLBY, VIP
    totalSeats: integer('total_seats').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('cinema_auditorium_name_idx').on(table.cinemaId, table.name),
    index('auditoriums_cinema_id_idx').on(table.cinemaId),
  ]
);

// 7. Seats table (with unique constraint for auditorium seat positions)
export const seats = pgTable(
  'seats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    auditoriumId: uuid('auditorium_id')
      .notNull()
      .references(() => auditoriums.id, { onDelete: 'cascade' }),
    row: varchar('row', { length: 5 }).notNull(), // A, B, C...
    seatNumber: integer('seat_number').notNull(), // 1, 2, 3...
    seatType: seatTypeEnum('seat_type').default('STANDARD').notNull(),
    basePriceInCents: integer('base_price_in_cents').notNull().default(1500), // $15.00 in minor units
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('auditorium_seat_pos_idx').on(table.auditoriumId, table.row, table.seatNumber),
    index('seats_auditorium_id_idx').on(table.auditoriumId),
  ]
);

// 8. Showtimes table
export const showtimes = pgTable(
  'showtimes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    movieId: uuid('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    auditoriumId: uuid('auditorium_id')
      .notNull()
      .references(() => auditoriums.id, { onDelete: 'cascade' }),
    startTime: timestamp('start_time', { withTimezone: true, mode: 'date' }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true, mode: 'date' }).notNull(),
    basePriceInCents: integer('base_price_in_cents').notNull().default(1500),
    format: varchar('format', { length: 20 }).notNull().default('2D'), // 2D, 3D, IMAX, 4DX
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('showtimes_movie_id_idx').on(table.movieId),
    index('showtimes_auditorium_id_idx').on(table.auditoriumId),
    index('showtimes_start_time_idx').on(table.startTime),
  ]
);

// 9. Showtime Seats table (unique constraint prevents duplicate seat records for a showtime)
export const showtimeSeats = pgTable(
  'showtime_seats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    showtimeId: uuid('showtime_id')
      .notNull()
      .references(() => showtimes.id, { onDelete: 'cascade' }),
    seatId: uuid('seat_id')
      .notNull()
      .references(() => seats.id, { onDelete: 'cascade' }),
    status: seatStatusEnum('status').default('AVAILABLE').notNull(),
    holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true, mode: 'date' }),
    heldByBookingId: uuid('held_by_booking_id'),
    priceInCents: integer('price_in_cents').notNull(),
    version: integer('version').default(0).notNull(), // optimistic concurrency helper
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('showtime_seat_unique_idx').on(table.showtimeId, table.seatId),
    index('showtime_seats_showtime_id_idx').on(table.showtimeId),
    index('showtime_seats_status_idx').on(table.status),
    index('showtime_seats_hold_expires_at_idx').on(table.holdExpiresAt),
  ]
);

// 10. Bookings table
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingReference: varchar('booking_reference', { length: 32 }).notNull().unique(), // e.g. CB-9A24-F8B1
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    showtimeId: uuid('showtime_id')
      .notNull()
      .references(() => showtimes.id, { onDelete: 'restrict' }),
    status: bookingStatusEnum('status').default('PENDING').notNull(),
    subtotalInCents: integer('subtotal_in_cents').notNull(),
    taxInCents: integer('tax_in_cents').notNull(),
    bookingFeeInCents: integer('booking_fee_in_cents').notNull(),
    totalInCents: integer('total_in_cents').notNull(),
    holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull().unique(),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('bookings_user_id_idx').on(table.userId),
    index('bookings_showtime_id_idx').on(table.showtimeId),
    index('bookings_status_idx').on(table.status),
    index('bookings_hold_expires_at_idx').on(table.holdExpiresAt),
    index('bookings_reference_idx').on(table.bookingReference),
  ]
);

// 11. Booking Items table
export const bookingItems = pgTable(
  'booking_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    showtimeSeatId: uuid('showtime_seat_id')
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: 'restrict' }),
    seatId: uuid('seat_id')
      .notNull()
      .references(() => seats.id, { onDelete: 'restrict' }),
    priceInCents: integer('price_in_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('booking_items_booking_id_idx').on(table.bookingId),
    index('booking_items_seat_id_idx').on(table.seatId),
  ]
);

// 12. Payments table (separate from booking status)
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    provider: paymentProviderEnum('provider').default('MOCK_SANDBOX').notNull(),
    paymentIntentId: varchar('payment_intent_id', { length: 255 }),
    status: paymentStatusEnum('status').default('PENDING').notNull(),
    amountInCents: integer('amount_in_cents').notNull(),
    currency: varchar('currency', { length: 10 }).default('USD').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull().unique(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('payments_booking_id_idx').on(table.bookingId),
    index('payments_status_idx').on(table.status),
    index('payments_intent_id_idx').on(table.paymentIntentId),
  ]
);

// 13. Tickets table
export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    ticketCode: varchar('ticket_code', { length: 64 }).notNull().unique(),
    qrData: text('qr_data').notNull(),
    isCheckedIn: boolean('is_checked_in').default(false).notNull(),
    checkedInAt: timestamp('checked_in_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('tickets_booking_id_idx').on(table.bookingId),
    index('tickets_ticket_code_idx').on(table.ticketCode),
  ]
);

// 14. Audit Logs table
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(), // 'HOLD_CREATED', 'HOLD_RELEASED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED'
    entityType: varchar('entity_type', { length: 100 }).notNull(), // 'BOOKING', 'SHOWTIME_SEAT', 'PAYMENT'
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    details: jsonb('details').default({}).notNull(),
    ipAddress: varchar('ip_address', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('audit_logs_user_id_idx').on(table.userId),
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ]
);

// Schema Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  auditLogs: many(auditLogs),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one, many }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
  bookingItems: many(bookingItems),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  items: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
  seat: one(seats, {
    fields: [bookingItems.seatId],
    references: [seats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
}));
