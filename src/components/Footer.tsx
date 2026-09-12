import Link from 'next/link';
import { Film, Shield, Sparkles, Database, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#06070a] text-zinc-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Film className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-bold text-white tracking-wider">
                CINE<span className="text-amber-400">BOOK</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Production-ready cinema ticketing system built for lightning-fast seat selection,
              seamless digital tickets, and zero-concurrency booking conflicts.
            </p>
            <div className="flex items-center space-x-2 text-xs text-amber-400/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimized for Vercel & Neon Serverless</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-amber-400 transition-colors">
                  Cinema Locations
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-amber-400 transition-colors">
                  My Bookings & Tickets
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition-colors">
                  Admin Portal & Scanner
                </Link>
              </li>
            </ul>
          </div>

          {/* Formats & Experiences */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">
              Theater Experiences
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-zinc-300 font-medium">IMAX 70mm Laser</li>
              <li className="text-zinc-300 font-medium">Dolby Cinema & Atmos</li>
              <li className="text-zinc-300 font-medium">VIP Luxury Recliner Lounges</li>
              <li className="text-zinc-300 font-medium">Full Dine-In Service</li>
            </ul>
          </div>

          {/* Technology & Stack */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">
              Architecture
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-zinc-300">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Neon PostgreSQL (Drizzle ORM)</span>
              </div>
              <div className="flex items-center space-x-2 text-zinc-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Next.js 15 App Router & Vercel Functions</span>
              </div>
              <div className="flex items-center space-x-2 text-zinc-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Row-Locked ACID Seat Transactions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} CineBook Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Serverless Transaction Engine</span>
            <span>Test Mode Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
