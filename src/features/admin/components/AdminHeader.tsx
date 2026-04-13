"use client";

import React, { useState, useRef, useEffect, useTransition, Suspense } from 'react';
import { Search, LogOut, User, ChevronDown, ExternalLink, Menu } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

function MobileMenuButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openMobileMenu = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('menu', 'open');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <button
      onClick={openMobileMenu}
      className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

interface AdminHeaderProps {
  breadcrumb?: { label: string; href?: string }[];
  draftingTitle?: string;
}

export default function AdminHeader({ breadcrumb, draftingTitle }: AdminHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = session?.user;

  const handleSignOut = () => {
    startTransition(() => signOut({ callbackUrl: '/login' }));
  };

  return (
    <header className="flex items-center justify-between w-full px-6 md:px-8 py-3 md:py-4 border-b border-zinc-300 dark:border-white/5 bg-white dark:bg-black/5 backdrop-blur-md sticky top-0 z-30 shrink-0 relative">
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Mobile Hamburger */}
        <Suspense fallback={<div className="lg:hidden w-9 h-9" />}>
          <MobileMenuButton />
        </Suspense>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
        {breadcrumb ? (
          breadcrumb.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-zinc-500">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-bold text-zinc-800 dark:text-white">{crumb.label}</span>
              )}
            </React.Fragment>
          ))
        ) : (
          <span className="text-zinc-500 text-sm">Admin Panel</span>
        )}
        </div>
      </div>

      {draftingTitle && (
        <div className="hidden lg:flex items-center justify-center px-4 overflow-hidden absolute left-1/2 -translate-x-1/2 w-1/3">
          <span className="text-[13px] text-zinc-500 font-medium truncate">
            Đang soạn: <strong className="text-zinc-700 dark:text-slate-200">{draftingTitle}</strong>
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 z-10">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-9 pr-4 py-2 text-sm bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 w-48 transition-all focus:w-64 dark:text-white placeholder:text-zinc-500"
          />
        </div>

        <NotificationBell />

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 group outline-none"
          >
            <Avatar src={user?.image} name={user?.name} size={36} className="border-2 border-primary/30 hover:scale-105 transition-transform" />
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-3 w-52 origin-top-right bg-white dark:bg-slate-900 border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
                <p className="text-sm font-bold text-zinc-800 dark:text-white truncate">{user?.name ?? 'Admin'}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
              <div className="p-2 space-y-1">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Xem trang
                </a>
                <Link
                  href="/admin/settings"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4" /> Tài khoản
                </Link>
              </div>
              <div className="p-2 border-t border-zinc-200 dark:border-white/5">
                <button
                  onClick={handleSignOut}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
