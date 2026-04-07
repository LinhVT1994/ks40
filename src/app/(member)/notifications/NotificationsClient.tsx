'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell, FileText, MessageSquare, Heart, Zap, CheckCheck } from 'lucide-react';
import type { Notification } from '@prisma/client';
import { markAsReadAction, markAllAsReadAction } from '@/features/notifications/actions/notification';

const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  SYSTEM:        { icon: Zap,           color: 'text-rose-500',   bg: 'bg-rose-500/10',   label: 'Hệ thống'  },
  NEW_ARTICLE:   { icon: FileText,      color: 'text-blue-500',   bg: 'bg-blue-500/10',   label: 'Bài viết'  },
  COMMENT_REPLY: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Bình luận' },
  LIKE:          { icon: Heart,         color: 'text-pink-500',   bg: 'bg-pink-500/10',   label: 'Yêu thích' },
};

function dateLabel(date: Date | string) {
  const d = new Date(date);
  if (isToday(d)) return 'Hôm nay';
  if (isYesterday(d)) return 'Hôm qua';
  return format(d, 'EEEE, dd/MM/yyyy', { locale: vi });
}

function groupByDate(items: Notification[]) {
  const map = new Map<string, Notification[]>();
  for (const n of items) {
    const key = format(new Date(n.createdAt), 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return [...map.entries()].map(([, items]) => ({ label: dateLabel(items[0].createdAt), items }));
}

type Filter = 'all' | 'unread' | 'read';

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<Filter>('all');
  const [, startTransition] = useTransition();

  // Listen to SSE for new notifications (shared stream from the bell)
  useEffect(() => {
    const es = new EventSource('/api/notifications/stream');

    es.addEventListener('notification', (e) => {
      const notif = JSON.parse(e.data) as Notification;
      setNotifications((prev) =>
        prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev],
      );
    });

    return () => es.close();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayed = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const groups = groupByDate(displayed);

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    startTransition(() => markAsReadAction(id));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => markAllAsReadAction());
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',    label: 'Tất cả' },
    { key: 'unread', label: `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'read',   label: 'Đã đọc' },
  ];

  return (
    <div className="space-y-6">
      {/* Filter + actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filter === f.key
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Content */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <Bell className="w-12 h-12 opacity-20" />
          <p className="text-sm">
            {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {label}
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
              </div>

              <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-slate-50 dark:divide-white/5">
                {items.map((n) => {
                  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
                  const Icon = cfg.icon;

                  const inner = (
                    <div
                      onClick={() => !n.read && markRead(n.id)}
                      className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                        !n.read
                          ? 'bg-primary/[0.025] dark:bg-primary/[0.05] hover:bg-primary/5 cursor-pointer'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {n.title}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {n.message && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">{n.message}</p>
                        )}
                        <p className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>

                      {!n.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  );

                  if (n.link) {
                    return (
                      <a key={n.id} href={n.link} className="block" onClick={() => !n.read && markRead(n.id)}>
                        {inner}
                      </a>
                    );
                  }
                  return <div key={n.id}>{inner}</div>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
