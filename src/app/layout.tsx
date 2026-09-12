import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'CineBook | Premium Cinema Ticket Booking & Real-Time Seat Selection',
  description:
    'Experience cinema at its finest. Book IMAX, Dolby Cinema, and VIP recliner seats in real-time with instant digital tickets, QR passes, and zero booking conflicts.',
  keywords: [
    'cinema booking',
    'movie tickets',
    'IMAX',
    'Dolby Cinema',
    'seat reservation',
    'CineBook',
  ],
  authors: [{ name: 'CineBook' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#08090d] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
