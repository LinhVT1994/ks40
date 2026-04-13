'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, X } from 'lucide-react';
import UserMenu from './UserMenu';
import HeaderSearch from './HeaderSearch';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import BrandLogo from '@/components/shared/BrandLogo';
import EyeTracker from '@/components/shared/EyeTracker';

import { usePathname } from 'next/navigation';

export default function MemberHeader() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const pathname = usePathname();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide header on write pages to allow the immersive editor to take full height
  // Moved after hooks to prevent "Rendered fewer hooks than expected" error
  if (pathname.startsWith('/write')) {
    return null;
  }

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/50 dark:bg-slate-950/40 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 shadow-sm' 
          : 'bg-transparent border-transparent'
      }`}>
        <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between py-3 px-4 md:px-8 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="transition-transform group-hover:scale-110">
              <BrandLogo size={32} />
            </div>
              <span className="text-lg md:text-xl tracking-[0.08em] flex items-center uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                <span className="font-medium text-zinc-500 dark:text-slate-400">Le</span>
                <span className="font-black bg-gradient-to-r from-primary via-accent-purple to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-text-shimmer">
                  note
                </span>
                <div className="ml-1 scale-75 origin-left">
                  <EyeTracker />
                </div>
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav data-focus-hide className="hidden lg:flex items-center gap-8 ml-10">
              <Link
                href={isLoggedIn ? "/" : "/explore"}
                className="text-sm font-bold text-zinc-600 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group/nav"
              >
                <div className="w-1 h-1 rounded-full bg-primary scale-0 group-hover/nav:scale-100 transition-transform" />
                Khám phá
              </Link>
              <Link
                href="/topics"
                className="text-sm font-bold text-zinc-600 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group/nav"
              >
                <div className="w-1 h-1 rounded-full bg-primary scale-0 group-hover/nav:scale-100 transition-transform" />
                Chủ đề
              </Link>
            </nav>
          </div>

          {/* Search — ẩn trên mobile, hiện từ md */}
          <div data-focus-hide className="hidden md:flex flex-1 justify-center">
            <HeaderSearch />
          </div>

          {/* Right actions */}
          <div data-focus-hide className="flex items-center gap-1 shrink-0">
            {/* Search icon — chỉ hiện trên mobile */}
            <button
              className="md:hidden p-2 rounded-full text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              onClick={() => setMobileSearchOpen(v => !v)}
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <UserMenu />
          </div>
        </div>

        {/* Mobile search bar — dropdown dưới header */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-zinc-200 dark:border-white/5 pt-3">
            <MobileSearchBar onClose={() => setMobileSearchOpen(false)} />
          </div>
        )}
      </header>
    </>
  );
}

function MobileSearchBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      onClose();
    }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
      <input
        autoFocus
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm bài viết... (Enter)"
        className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-zinc-800 dark:text-white placeholder:text-zinc-500"
      />
    </div>
  );
}
