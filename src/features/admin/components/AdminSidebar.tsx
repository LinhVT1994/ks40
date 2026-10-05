"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, Users, MessageSquare,
  Settings, ChevronLeft, ChevronRight,
  GraduationCap, Activity, Bell, Share2, LayoutGrid, BarChart3, BookMarked, Wallet,
} from 'lucide-react';

const navItems: { href: string; icon: React.ElementType; label: string; badge?: number }[] = [
  { href: '/admin/overview',       icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/admin/analytics',      icon: BarChart3,       label: 'Phân tích'    },
  { href: '/admin/documents',      icon: FileText,        label: 'Bài viết'     },
  { href: '/admin/glossary',       icon: BookMarked,      label: 'Thuật ngữ'    },
  { href: '/admin/users',          icon: Users,           label: 'Người dùng'  },
  { href: '/admin/comments',       icon: MessageSquare,   label: 'Bình luận'   },
  { href: '/admin/payments',       icon: Wallet,          label: 'Thanh toán'  },
  { href: '/admin/shares',         icon: Share2,          label: 'Chia sẻ file' },
  { href: '/admin/notifications',  icon: Bell,            label: 'Thông báo'   },
  { href: '/admin/activity',       icon: Activity,        label: 'Hoạt động'   },
  { href: '/admin/settings',       icon: Settings,        label: 'Cài đặt'     },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const mobileOpen = searchParams.get('menu') === 'open';

  const closeMenu = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('menu');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 dark:bg-slate-950/80 z-40 backdrop-blur-sm transition-opacity"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar Wrapper */}
      <aside className={`
        ui-admin-sidebar fixed lg:sticky top-0 left-0 z-50 h-[100dvh] flex flex-col transition-transform duration-300 ease-in-out shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'lg:w-20 w-64' : 'w-64'}
      `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-300 dark:border-white/5 shrink-0">
        <div className="inline-flex items-center justify-center bg-brand rounded-lg p-2 shrink-0">
          <GraduationCap className="text-white w-5 h-5" />
        </div>
        {!collapsed && (
          <span className="ui-wordmark whitespace-nowrap">
            lenote<span>.dev</span> <span className="text-[10px] font-medium tracking-widest uppercase">Studio</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {!collapsed && <p className="px-3 pb-3 text-[10px] font-semibold tracking-widest uppercase text-muted">Quản trị nội dung</p>}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              onClick={() => mobileOpen && closeMenu()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && (
                <span className="text-sm font-semibold truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-4 border-t border-zinc-300 dark:border-white/5 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          aria-expanded={!collapsed}
          className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all text-sm font-medium"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
