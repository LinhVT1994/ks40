'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, X, Timer } from 'lucide-react';
import UserMenu from './UserMenu';
import HeaderSearch from './HeaderSearch';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import BrandLogo from '@/components/shared/BrandLogo';

export default function MemberHeader() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/50 dark:bg-slate-950/40 backdrop-blur-md border-b border-slate-100 dark:border-white/5 shadow-sm' 
          : 'bg-transparent border-transparent'
      }`}>
        <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between py-3 px-4 md:px-8 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="transition-transform group-hover:scale-110">
              <BrandLogo size={32} />
            </div>
              <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white">
                Lenote<span className="text-primary font-normal group-hover:text-primary transition-colors">.dev</span>
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            {/* <nav className="hidden lg:flex items-center gap-8 ml-6">
              <Link
                href="/books"
                className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group/nav"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary scale-0 group-hover/nav:scale-100 transition-transform" />
                Khóa học
              </Link>
            </nav> */}
          </div>

          {/* Search — ẩn trên mobile, hiện từ md */}
          <div className="hidden md:flex flex-1 justify-center">
            <HeaderSearch />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Search icon — chỉ hiện trên mobile */}
            <button
              className="md:hidden p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
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
          <div className="md:hidden px-4 pb-3 border-t border-slate-100 dark:border-white/5 pt-3">
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        autoFocus
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm bài viết... (Enter)"
        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white placeholder:text-slate-400"
      />
    </div>
  );
}
