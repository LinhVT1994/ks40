'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Search, X } from 'lucide-react';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import type { SiteAnnouncement } from '@/features/admin/actions/config';
import UserMenu from './UserMenu';
import HeaderSearch from './HeaderSearch';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import BrandLogo from '@/components/shared/BrandLogo';
import EyeTracker from '@/components/shared/EyeTracker';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function MemberHeader({ announcement }: { announcement?: SiteAnnouncement | null }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const pathname = usePathname();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isMobile = window.innerWidth < 768;
      
      // Background change threshold
      setIsScrolled(currentScrollY > 20);

      // Hide/Show logic (Mobile only)
      if (isMobile) {
        if (currentScrollY > lastScrollYRef.current && currentScrollY > 50) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollYRef.current) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
      
      lastScrollYRef.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <div 
      style={{ zIndex: 50000 }}
      className={`fixed top-0 left-0 right-0 w-full transition-transform duration-300 bg-white md:bg-transparent dark:bg-background-dark md:dark:bg-transparent ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {announcement && <AnnouncementBanner announcement={announcement} />}
      <header className={`w-full transition-[background-color,border-color] duration-500 ${
        isScrolled
          ? 'bg-white md:bg-white/80 dark:bg-background-dark md:dark:bg-background-dark/60 md:backdrop-blur-md border-b border-zinc-200 dark:border-white/5 shadow-lg md:shadow-sm'
          : 'bg-white md:bg-transparent dark:bg-background-dark md:dark:bg-transparent border-b border-transparent'
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
            <nav className="hidden lg:flex items-center gap-2 ml-6">
              <NavLink href={isLoggedIn ? "/" : "/explore"} label="Khám phá" active={pathname === (isLoggedIn ? "/" : "/explore")} />
              <NavLink href="/topics" label="Chủ đề" active={pathname === "/topics"} />
              <NavLink href="/glossary" label="Thuật ngữ" active={pathname === "/glossary"} />
            </nav>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Desktop Search */}
            <div className="hidden md:block">
              <HeaderSearch />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2">
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
        </div>

        {/* Mobile search bar — dropdown dưới header */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-zinc-200 dark:border-white/5 pt-3">
            <MobileSearchBar onClose={() => setMobileSearchOpen(false)} />
          </div>
        )}
      </header>
    </div>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 group/nav",
        active 
          ? "bg-primary/10 text-primary" 
          : "text-zinc-600 dark:text-slate-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5"
      )}
    >
      <div className={cn(
        "w-1 h-1 rounded-full bg-primary transition-all duration-300",
        active ? "scale-100" : "scale-0 group-hover/nav:scale-100"
      )} />
      {label}
    </Link>
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
      <input
        autoFocus
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm bài viết..."
        className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-zinc-800 dark:text-white placeholder:text-zinc-500"
      />
    </div>
  );
}
