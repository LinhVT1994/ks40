'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, FileText, MessageSquare, Heart, Zap, CheckCheck, X, CheckCircle2, AlertCircle, Lightbulb, BookOpen } from 'lucide-react';
import { createPortal } from 'react-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Notification } from '@prisma/client';
import { useNotifications } from '../hooks/useNotifications';

// ── Type config ───────────────────────────────────────────────────
const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  SYSTEM:        { icon: Zap,           color: 'text-rose-500',    bg: 'bg-rose-500/10'    },
  NEW_ARTICLE:   { icon: FileText,      color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
  COMMENT_REPLY: { icon: MessageSquare, color: 'text-violet-500',  bg: 'bg-violet-500/10'  },
  LIKE:          { icon: Heart,         color: 'text-pink-500',    bg: 'bg-pink-500/10'    },
  ARTICLE_APPROVED: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ARTICLE_REJECTED: { icon: AlertCircle, color: 'text-rose-500',    bg: 'bg-rose-500/10'    },
  GLOSSARY_SUBMITTED: { icon: Lightbulb,  color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
  GLOSSARY_APPROVED:  { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

function NotifItem({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: string) => void;
}) {
  const cfg = TYPE_CFG[notif.type] ?? TYPE_CFG.SYSTEM;
  const Icon = cfg.icon;

  const inner = (
    <div
      onClick={() => onRead(notif.id)}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] ${
        !notif.read ? 'bg-primary/[0.03] dark:bg-primary/[0.05]' : ''
      }`}
    >
      {/* Icon */}
      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-zinc-800 dark:text-white' : 'font-medium text-zinc-700 dark:text-slate-300'}`}>
          {notif.title}
        </p>
        {notif.message && (
          <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">{notif.message}</p>
        )}
        <p className="text-[11px] text-zinc-500">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </div>
  );

  if (notif.link) {
    return (
      <a href={notif.link} className="block">
        {inner}
      </a>
    );
  }
  return inner;
}

// ── Bell with pulsing animation when new notif arrives ───────────
function BellIcon({ count }: { count: number }) {
  const [shake, setShake] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <div className="relative">
      <Bell
        className={`w-5 h-5 transition-transform ${shake ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`}
      />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-primary text-white text-[10px] font-bold leading-none shadow-sm shadow-primary/40 animate-in zoom-in duration-200">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}

import { useSession } from 'next-auth/react';

// ── Main component ────────────────────────────────────────────────
export default function NotificationBell() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Check if click is outside both the button container AND the portal dropdown
      const isOutsideButton = panelRef.current && !panelRef.current.contains(e.target as Node);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(e.target as Node);
      
      if (isOutsideButton && isOutsideDropdown) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!mounted || !userId) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-full transition-colors ${
          open
            ? 'bg-primary/10 text-primary'
            : 'text-zinc-500 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/10'
        }`}
        aria-label="Thông báo"
      >
        <BellIcon count={unreadCount} />
      </button>

      {/* Dropdown panel */}
      {open && mounted && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 top-[calc(100%+8px)] w-[calc(100vw-32px)] sm:w-96 origin-top-right border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl z-[99999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 bg-white dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200 dark:border-white/5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc hết
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-200 dark:divide-white/5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-sm text-zinc-500">
                <span className="w-4 h-4 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
                Đang tải...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-sm">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={(id) => { markRead(id); }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
              <a
                href="/notifications"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Xem tất cả thông báo →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
