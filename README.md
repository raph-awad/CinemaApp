# 🎬 CineBook — Premium Cinema Ticketing Platform

> A production-grade, full-stack cinema ticket booking web application built with **Next.js 16 (App Router)**, **TypeScript**, **Drizzle ORM**, and **PostgreSQL (Neon)**. Designed for high-concurrency seat reservation with atomic locking and payment idempotency.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-green?style=for-the-badge)](https://orm.drizzle.team/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

---

## ✨ Features

- 🎟️ **Real-Time Interactive Seat Selection**: Dynamic SVG seat map with visual distinction for Standard, VIP, and Recliner tiers.
- ⚡ **Atomic Concurrency Control**: PostgreSQL row-level locks (`SELECT ... FOR UPDATE SKIP LOCKED`) prevent race conditions and double-booking.
- ⏱️ **Temporary Seat Holds & Auto-Expiry**: Seats are held for 10 minutes during checkout and released automatically via Vercel Cron.
- 💳 **Idempotent Checkout**: Dual payment support (Stripe test mode + Mock Sandbox) with idempotency keys preventing duplicate charges.
- 📱 **Digital Passes with QR Verification**: Instant booking pass generation with QR code check-in and dynamic pass download.
- 🛡️ **Role-Based Authentication**: JWT session management with bcrypt hashing for Cinephile and Admin users.
- 📊 **Executive Admin Dashboard**: Real-time revenue metrics, occupancy rates, ticket scanner, and audit logging.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions, Route Handlers)
- **Database**: PostgreSQL via Neon Serverless / PGlite (local)
- **ORM**: Drizzle ORM with schema migrations
- **Styling**: Tailwind CSS & Glassmorphic dark cinema theme
- **Deployment**: Vercel Serverless Functions + Vercel Cron

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run migrations and seed sample cinema data
npm run db:migrate
npm run db:seed

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Demo Credentials
- **Admin**: `admin@cinebook.com` / `AdminPass123!`
- **User**: `alex@cinebook.com` / `Password123!`

---

## ☁️ Deployment on Vercel

This full-stack application requires a Node.js serverless runtime and PostgreSQL database. Deploy to **Vercel** with one click:

1. Import your repository into [Vercel](https://vercel.com/new).
2. Configure environment variables (`DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`).
3. Deploy!
