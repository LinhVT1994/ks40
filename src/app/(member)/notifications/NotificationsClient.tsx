'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Bell, FileText, MessageSquare, Heart, Zap, CheckCheck, Star,
  Send as SendIcon, CheckCircle2, AlertCircle, Loader2, ChevronDown
} from 'lucide-react';
import type { Notification } from '@prisma/client';
import { 
  markAsReadAction, 
  markAllAsReadAction, 
  getNotificationsAction 
} from '@/features/notifications/actions/notification';

const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  SYSTEM:             { icon: Zap,           color: 'text-rose-500',   bg: 'bg-rose-500/10',   label: 'Hệ thống'  },
  NEW_ARTICLE:        { icon: FileText,      color: 'text-blue-500',   bg: 'bg-blue-500/10',   label: 'Bài viết'  },
  COMMENT_REPLY:      { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Bình luận' },
  LIKE:               { icon: Heart,         color: 'text-pink-500',   bg: 'bg-pink-500/10',   label: 'Yêu thích' },
  ARTICLE_SUBMITTED:  { icon: SendIcon,      color: 'text-amber-500',  bg: 'bg-amber-500/10',  label: 'Xét duyệt' },
  ARTICLE_APPROVED:   { icon: CheckCircle2,  color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Thành công' },
  ARTICLE_REJECTED:   { icon: AlertCircle,   color: 'text-rose-500',   bg: 'bg-rose-500/10',   label: 'Yêu cầu'   },
  RATING:             { icon: Star,          color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Đánh giá'  },
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
  initialUnreadCount,
  initialHasNextPage,
  initialTotalCount,
}: {
  initialNotifications: Notification[];
  initialUnreadCount: number;
  initialHasNextPage: boolean;
  initialTotalCount: number;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasNextPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [, startTransition] = useTransition();

  // SSE: Only handle new notifications if we are on 'all' or 'unread' filter
  useEffect(() => {
    const es = new EventSource('/api/notifications/stream');
    es.addEventListener('notification', (e) => {
      const notif = JSON.parse(e.data) as Notification;
      if (filter === 'read') return;

      setNotifications((prev) => {
        if (prev.some(n => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });
    return () => es.close();
  }, [filter]);

  // Handle Filter Change (Server-Side)
  const handleFilterChange = async (newFilter: Filter) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    setFiltering(true);
    setPage(1);
    
    try {
      const res = await getNotificationsAction({ page: 1, filter: newFilter });
      setNotifications(res.notifications as any);
      setHasMore(res.hasNextPage);
      // unreadCount is global, only refresh it if needed, but getNotificationsAction returns it anyway
      setUnreadCount(res.unreadCount);
    } finally {
      setFiltering(false);
    }
  };

  // Handle Load More
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const res = await getNotificationsAction({ page: nextPage, filter });
      setNotifications(prev => [...prev, ...res.notifications as any]);
      setHasMore(res.hasNextPage);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    startTransition(() => markAsReadAction(id));
  };

  const markAllRead = async () => {
    setIsMarkingAll(true);
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      await markAllAsReadAction();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const groups = groupByDate(notifications);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',    label: 'Tất cả' },
    { key: 'unread', label: `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'read',   label: 'Đã đọc' },
  ];

  return (
    <div className="space-y-6">
      {/* Filter + actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              disabled={filtering}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filter === f.key
                  ? 'bg-white dark:bg-white/10 text-zinc-800 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-300'
              } disabled:opacity-50`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={isMarkingAll || filtering}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {isMarkingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Content */}
      {filtering ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-500">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
           <p className="text-sm font-medium">Đang tải thông báo...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-500 animate-in fade-in zoom-in-95 duration-500">
          <Bell className="w-12 h-12 opacity-20" />
          <p className="text-sm font-medium">
            {filter === 'unread' ? 'Tuyệt vời! Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-black text-zinc-500 dark:text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                  {label}
                </span>
                <div className="flex-1 h-px bg-zinc-100 dark:bg-white/5" />
              </div>

              <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-white/5 shadow-sm">
                {items.map((n, idx) => {
                  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
                  const Icon = cfg.icon;

                  const inner = (
                    <div
                      onClick={() => !n.read && markRead(n.id)}
                      className={`flex items-start gap-4 px-5 py-4 transition-all duration-300 ${
                        !n.read
                          ? 'bg-primary/[0.02] dark:bg-primary/[0.04] hover:bg-primary/[0.06] cursor-pointer'
                          : 'hover:bg-zinc-50 dark:hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className={`p-2.5 rounded-[1.25rem] shrink-0 mt-0.5 ${cfg.bg} transition-transform group-hover:scale-110 shadow-sm`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className={`text-sm leading-snug tracking-tight ${!n.read ? 'font-bold text-zinc-800 dark:text-white' : 'font-medium text-zinc-500 dark:text-slate-400'}`}>
                            {n.title}
                          </p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0 uppercase tracking-widest ${cfg.bg} ${cfg.color} border border-white/20`}>
                            {cfg.label}
                          </span>
                        </div>
                        {n.message && (
                          <p className={`text-sm leading-relaxed ${!n.read ? 'text-zinc-600 dark:text-slate-300 font-medium' : 'text-zinc-500 dark:text-slate-500'}`}>
                            {n.message}
                          </p>
                        )}
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-slate-500 flex items-center gap-2">
                           <Clock size={10} className="inline opacity-60" />
                           {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>

                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2 shadow-[0_0_8px_rgba(39,39,42,0.3)] dark:shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
                      )}
                    </div>
                  );

                  if (n.link) {
                    return (
                      <a key={n.id} href={n.link} className="block group ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => !n.read && markRead(n.id)}>
                        {inner}
                      </a>
                    );
                  }
                  return <div key={n.id}>{inner}</div>;
                })}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 flex justify-center pb-8 border-t border-zinc-200 dark:border-white/5">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="group flex items-center gap-2 px-8 py-3 rounded-2xl bg-zinc-800 dark:bg-white text-white dark:text-slate-900 text-sm font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-zinc-800/10 dark:shadow-white/5"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tải...</span>
                  </>
                ) : (
                  <>
                    <span>Tải thêm thông báo</span>
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Re-using the icon from Profile to be consistent
const Clock = ({ size, className }: { size?: number; className?: string }) => (
  <svg 
    width={size || 14} 
    height={size || 14} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
