"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Sun, Moon, User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import Avatar from "@/components/shared/Avatar";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end gap-1">
        <div className="h-3 w-20 rounded-full bg-zinc-200 dark:bg-white/10 animate-pulse" />
        <div className="h-2.5 w-12 rounded-full bg-zinc-100 dark:bg-white/5 animate-pulse" />
      </div>
      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-white/10 animate-pulse" />
    </div>
  );

  const user = session?.user;

  // Guest — show login/register buttons
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-zinc-600 dark:text-slate-300 hover:text-primary transition-colors"
        >
          Đăng nhập
        </Link>
        <Link
          href="/login"
          className="px-3 py-1.5 text-xs sm:text-sm font-semibold bg-primary text-white rounded-lg sm:rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }
  const role = (user as { role?: string })?.role;
  const roleLabel = role === 'ADMIN' ? 'Quản trị viên' : role === 'PREMIUM' ? 'Premium' : 'Member';

  const handleSignOut = () => {
    startTransition(() => signOut({ callbackUrl: '/login' }));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 transition-opacity hover:opacity-80 group outline-none"
      >
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-primary transition-colors group-hover:text-primary/80">{user?.name ?? '...'}</p>
          <p className="text-[10px] text-zinc-500">{roleLabel}</p>
        </div>
        <Avatar src={user?.image} name={user?.name} size={40} className="border-2 border-primary/30 shadow-sm transition-transform group-hover:scale-105" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 origin-top-right bg-white dark:bg-slate-900 border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl z-[60] py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
            <p className="text-sm font-bold text-primary truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>

          <div className="p-2 space-y-1">
            {role === 'ADMIN' && (
              <a
                href="/admin/overview"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-xl transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <ShieldCheck className="w-4 h-4" /> Trang quản trị
              </a>
            )}
            {user?.id && (
              <a
                href={`/profile/${(user as { username?: string | null }).username ?? user.id}`}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" /> Trang cá nhân
              </a>
            )}
            <a
              href="/settings"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" /> Cài đặt
            </a>
          </div>

          <div className="px-4 py-2 bg-zinc-50/50 dark:bg-white/5 my-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Chế độ tối</span>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-primary' : 'bg-zinc-200'}`}
              >
                <div className={`transform transition-transform duration-200 ease-in-out bg-white rounded-full w-4 h-4 shadow-sm flex items-center justify-center ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}>
                  {theme === 'dark' ? <Moon className="w-2.5 h-2.5 text-primary" /> : <Sun className="w-2.5 h-2.5 text-orange-400" />}
                </div>
              </button>
            </div>
          </div>

          <div className="p-2">
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
  );
}
