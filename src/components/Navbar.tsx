'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Film, Ticket, MapPin, User, LogOut, ShieldCheck, Menu, X, Sparkles } from 'lucide-react';

interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { label: 'Movies', href: '/', icon: Film },
    { label: 'Cinemas', href: '/cinemas', icon: MapPin },
    { label: 'My Bookings', href: '/bookings', icon: Ticket },
  ];

  return (
    <header className="sticky top-0 z-50 cinema-glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            <Film className="w-5 h-5 text-black" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wider text-white">
              CINE<span className="text-amber-400">BOOK</span>
            </span>
            <span className="hidden sm:block text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
              Premium Theater Experience
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname.startsWith('/admin')
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Desktop User Status */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-white flex items-center justify-end space-x-1">
                  <span>{user.name}</span>
                  {user.role === 'ADMIN' && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 truncate max-w-[140px]">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/20 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>Join CineBook</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden cinema-glass border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-zinc-200 hover:bg-white/5"
                >
                  <Icon className="w-5 h-5 text-amber-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-500/10"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>

          <div className="pt-4 border-t border-white/10">
            {user ? (
              <div className="flex items-center justify-between px-2">
                <div>
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-xs text-zinc-400">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm text-rose-400 hover:text-rose-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-white/10 text-sm font-medium text-zinc-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-amber-500 text-black text-sm font-semibold"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
