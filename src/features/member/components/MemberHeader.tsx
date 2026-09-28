'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import {
  ArrowUpRight, Bell, BookOpen, Bookmark, Compass, FolderOpen, History,
  Menu, PanelLeftClose, PanelLeftOpen, PenLine, Search, Settings, ShieldCheck, X,
  type LucideIcon,
} from 'lucide-react';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import type { SiteAnnouncement } from '@/features/admin/actions/config';
import { ThemeToggle } from '@/components/ThemeToggle';
import BrandLogo from '@/components/shared/BrandLogo';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import HeaderSearch from './HeaderSearch';
import UserMenu from './UserMenu';

type NavItem = { href: string; label: string; icon: LucideIcon };

export default function MemberHeader({
  announcement,
  session,
}: {
  announcement?: SiteAnnouncement | null;
  session?: Session | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = session?.user as (NonNullable<Session['user']> & { canWrite?: boolean; role?: string }) | undefined;
  const isLoggedIn = !!user;
  const isWriting = pathname.startsWith('/write');
  const isReader = pathname.startsWith('/article/') || /^\/books\/[^/]+\/[^/]+/.test(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
      if (event.key !== 'Tab') return;
      const focusable = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]',
      ) ?? []).filter(element => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!sidebarRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => { if (desktop.matches && !isReader) setMobileMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onResize);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onResize);
      previousFocus?.focus();
    };
  }, [mobileMenuOpen, isReader]);

  if (isWriting) return null;

  const mainNav: NavItem[] = [
    { href: isLoggedIn ? '/' : '/explore', label: 'Khám phá', icon: Compass },
    { href: '/topics', label: 'Chủ đề', icon: FolderOpen },
    { href: '/glossary', label: 'Thuật ngữ', icon: BookOpen },
  ];
  const personalNav: NavItem[] = [
    { href: '/bookmarks', label: 'Bài viết đã lưu', icon: Bookmark },
    { href: '/history', label: 'Lịch sử đọc', icon: History },
    { href: '/notifications', label: 'Thông báo', icon: Bell },
  ];
  const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
  const pageLabel = [...mainNav, ...personalNav].find(item => active(item.href))?.label
    ?? (pathname === '/' ? 'Không gian tri thức' : isReader ? 'Không gian đọc' : 'Lenote');

  const renderNav = (item: NavItem) => (
    <Link key={item.href} href={item.href} title={item.label}
      aria-current={active(item.href) ? 'page' : undefined}
      onClick={() => setMobileMenuOpen(false)}
      className={`ui-sidebar-link ${active(item.href) ? 'is-active' : ''}`}>
      <item.icon size={17} strokeWidth={1.7} />
      <span className="ui-sidebar-label">{item.label}</span>
    </Link>
  );

  return (
    <>
      {mobileMenuOpen && <button type="button" className="ui-sidebar-backdrop" aria-label="Đóng menu điều hướng" onClick={() => setMobileMenuOpen(false)} />}
      <aside id="member-sidebar" ref={sidebarRef} data-focus-hide
        data-collapsed={collapsed && !isReader} data-open={mobileMenuOpen} data-reader={isReader}
        onTransitionEnd={event => {
          if (event.target === event.currentTarget && event.propertyName === 'transform' && mobileMenuOpen) closeButtonRef.current?.focus();
        }}
        className="ui-sidebar" aria-label="Điều hướng Lenote" role={mobileMenuOpen ? 'dialog' : undefined} aria-modal={mobileMenuOpen ? true : undefined}>
        <div className="ui-sidebar-brand">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex min-w-0 items-center gap-2.5" aria-label="Lenote — Trang chủ">
            <BrandLogo size={30} /><span className="ui-sidebar-label ui-wordmark">lenote<span>.dev</span></span>
          </Link>
          <button ref={closeButtonRef} type="button" onClick={() => setMobileMenuOpen(false)}
            className={`ui-icon-button ${isReader ? '' : 'lg:hidden'}`} aria-label="Đóng thanh điều hướng"><X size={18} /></button>
        </div>

        <div className="px-3 pb-5">
          <Link href={user?.canWrite ? '/write' : '/explore'} onClick={() => setMobileMenuOpen(false)}
            title={user?.canWrite ? 'Viết bài mới' : 'Khám phá bài viết'} className="ui-sidebar-create">
            {user?.canWrite ? <PenLine size={17} /> : <Compass size={17} />}
            <span className="ui-sidebar-label">{user?.canWrite ? 'Viết bài mới' : 'Khám phá bài viết'}</span>
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <nav aria-label="Thư viện" className="space-y-1">
            <p className="ui-sidebar-label ui-sidebar-heading">Thư viện</p>
            {mainNav.map(renderNav)}
            <button type="button" disabled className="ui-sidebar-link w-full text-left opacity-60" title="Sách & lộ trình — Sắp có">
              <BookOpen size={17} strokeWidth={1.7} />
              <span className="ui-sidebar-label flex flex-1 items-center justify-between gap-2">Sách & lộ trình <span className="text-[10px] text-muted">Sắp có</span></span>
            </button>
          </nav>
          {isLoggedIn && <nav aria-label="Không gian cá nhân" className="mt-7 space-y-1">
            <p className="ui-sidebar-label ui-sidebar-heading">Không gian của bạn</p>
            {personalNav.map(renderNav)}
          </nav>}
          {!isLoggedIn && <div className="ui-sidebar-label mt-9 px-3 text-xs leading-6 text-muted">
            <p className="mb-2 font-medium text-ink">Một chút mỗi ngày.</p>
            <p>Đọc, ghi chú và lưu giữ những điều có ý nghĩa với bạn.</p>
          </div>}
        </div>

        <div className="border-t border-line p-3">
          {user?.role === 'ADMIN' && renderNav({href:'/admin/overview',label:'Quản trị nội dung',icon:ShieldCheck})}
          {isLoggedIn && renderNav({href:'/settings',label:'Cài đặt',icon:Settings})}
          <Link href={isLoggedIn ? '/me' : '/login'} onClick={() => setMobileMenuOpen(false)}
            className="ui-sidebar-link mt-1" title={isLoggedIn ? 'Hồ sơ của bạn' : 'Đăng nhập'}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{user?.name?.charAt(0).toUpperCase() || 'L'}</span>
            <span className="ui-sidebar-label min-w-0 flex-1 truncate text-xs">{user?.name || 'Đăng nhập để lưu tri thức'}</span>
            <ArrowUpRight className="ui-sidebar-label h-3.5 w-3.5 text-muted" />
          </Link>
        </div>
      </aside>

      <header className="ui-member-topbar" data-focus-hide>
        {announcement && <AnnouncementBanner announcement={announcement} />}
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className={`ui-icon-button ${isReader ? '' : 'lg:hidden'}`}
              aria-label="Mở menu điều hướng" aria-controls="member-sidebar" aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}><Menu size={19} /></button>
            {!isReader && <button type="button" className="ui-icon-button hidden lg:inline-flex"
              aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} aria-controls="member-sidebar" aria-expanded={!collapsed}
              onClick={() => setCollapsed(value => !value)}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>}
            <span className="truncate text-sm text-muted hidden sm:block">{pageLabel}</span>
            <Link href="/" className="ui-wordmark sm:hidden">lenote<span>.dev</span></Link>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <div className="hidden md:block"><HeaderSearch /></div>
            <button type="button" className="ui-icon-button md:hidden" aria-label={mobileSearchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
              aria-expanded={mobileSearchOpen} onClick={() => setMobileSearchOpen(value => !value)}>
              {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
        {mobileSearchOpen && <form role="search" className="border-t border-line px-4 py-3 md:hidden"
          onSubmit={event => { event.preventDefault(); if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query.trim())}`); setMobileSearchOpen(false); } }}>
          <label htmlFor="mobile-search" className="sr-only">Tìm kiếm bài viết</label>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-panel p-2">
            <Search size={16} className="ml-2 text-muted" />
            <input id="mobile-search" autoFocus value={query} onChange={event => setQuery(event.target.value)}
              onKeyDown={event => { if (event.key === 'Escape') setMobileSearchOpen(false); }}
              className="min-w-0 flex-1 bg-transparent p-1 text-base text-ink outline-none" placeholder="Bạn muốn tìm điều gì?" />
            <button type="submit" className="rounded-lg bg-brand p-2 text-white" aria-label="Tìm kiếm"><ArrowUpRight size={16} /></button>
          </div>
        </form>}
      </header>
    </>
  );
}
