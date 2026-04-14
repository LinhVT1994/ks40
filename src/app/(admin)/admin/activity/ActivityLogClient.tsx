'use client';

import Image from 'next/image';
import React, { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  UserPlus, FileText, MessageSquare, Star, Bell,
  Search, X,
} from 'lucide-react';
import type { Activity, User } from '@prisma/client';
import AdminPagination from '@/features/admin/components/AdminPagination';

type ActivityWithActor = Activity & {
  actor?: Pick<User, 'name' | 'image' | 'email'> | null;
};

const TYPE_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
  ring: string;
  label: string;
}> = {
  USER_REGISTERED:   { icon: UserPlus,      color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', label: 'Đăng ký'     },
  ARTICLE_PUBLISHED: { icon: FileText,      color: 'text-blue-500',    bg: 'bg-blue-500/10',    ring: 'ring-blue-500/20',    label: 'Bài viết'    },
  COMMENT_POSTED:    { icon: MessageSquare, color: 'text-violet-500',  bg: 'bg-violet-500/10',  ring: 'ring-violet-500/20',  label: 'Bình luận'   },
  USER_UPGRADED:     { icon: Star,          color: 'text-amber-500',   bg: 'bg-amber-500/10',   ring: 'ring-amber-500/20',   label: 'Nâng cấp'    },
  SYSTEM_ALERT:      { icon: Bell,          color: 'text-rose-500',    bg: 'bg-rose-500/10',    ring: 'ring-rose-500/20',    label: 'Hệ thống'    },
};

const FILTER_TYPES = [
  { key: 'all',               label: 'Tất cả' },
  { key: 'USER_REGISTERED',   label: 'Đăng ký' },
  { key: 'ARTICLE_PUBLISHED', label: 'Bài viết' },
  { key: 'COMMENT_POSTED',    label: 'Bình luận' },
  { key: 'USER_UPGRADED',     label: 'Nâng cấp' },
  { key: 'SYSTEM_ALERT',      label: 'Hệ thống' },
];

function renderMessage(msg: string) {
  const parts = msg.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="font-bold text-zinc-800 dark:text-white">{part}</span>
      : <span key={i}>{part}</span>
  );
}

function groupByDate(activities: ActivityWithActor[]) {
  const groups: { date: string; items: ActivityWithActor[] }[] = [];
  const map = new Map<string, ActivityWithActor[]>();

  for (const a of activities) {
    const key = format(new Date(a.createdAt), 'dd/MM/yyyy');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }

  for (const [date, items] of map) {
    groups.push({ date, items });
  }
  return groups;
}

export default function ActivityLogClient({
  activities,
  total,
  pages,
  currentPage,
  currentType,
  currentQ,
}: {
  activities: ActivityWithActor[];
  total: number;
  pages: number;
  currentPage: number;
  currentType: string;
  currentQ: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = React.useState(currentQ);

  const navigate = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    const merged = { type: currentType, page: '1', q: currentQ, ...params };
    if (merged.type && merged.type !== 'all') sp.set('type', merged.type);
    if (merged.q) sp.set('q', merged.q);
    if (merged.page && merged.page !== '1') sp.set('page', merged.page);
    startTransition(() => router.push(`${pathname}?${sp.toString()}`, { scroll: false }));
  };

  const groups = groupByDate(activities);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search — bên trái */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); navigate({ q: e.target.value, page: '1' }); }}
            placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-zinc-500"
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); navigate({ q: '', page: '1' }); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_TYPES.map(ft => {
            const cfg = TYPE_CONFIG[ft.key];
            const isActive = currentType === ft.key;
            return (
              <button
                key={ft.key}
                onClick={() => navigate({ type: ft.key, page: '1' })}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all border ${
                  isActive
                    ? ft.key === 'all'
                      ? 'bg-zinc-800 dark:bg-white text-white dark:text-slate-900 border-transparent'
                      : `${cfg.bg} ${cfg.color} border-current ring-1 ${cfg.ring}`
                    : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                {cfg && React.createElement(cfg.icon, { className: 'w-3 h-3' })}
                {ft.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
      </div>

      {/* List */}
      <div className={`transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {activities.length === 0 ? (
          <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl py-16 flex flex-col items-center gap-3 text-zinc-500">
            <Bell className="w-8 h-8 opacity-30" />
            <p className="text-sm">Không có hoạt động nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(({ date, items }) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-zinc-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{date}</span>
                  <div className="flex-1 h-px bg-zinc-100 dark:bg-white/5" />
                </div>

                {/* Items */}
                <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-white/5">
                  {items.map((activity) => {
                    const cfg = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.SYSTEM_ALERT;
                    const Icon = cfg.icon;
                    const avatarUrl = activity.actor?.image
                      || (activity.actor?.name
                        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.actor.name)}&background=e2e8f0&color=0f172a&size=64`
                        : null);

                    const row = (
                      <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                        {/* Type icon */}
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${cfg.bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
                            {renderMessage(activity.message)}
                          </div>
                          {activity.actor && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {avatarUrl && (
                                <div className="relative w-4 h-4 shrink-0">
                                  <Image
                                    src={avatarUrl}
                                    alt=""
                                    fill
                                    sizes="16px"
                                    className="rounded-full object-cover"
                                  />
                                </div>
                              )}
                              <span className="text-[11px] text-zinc-500">{activity.actor.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: time + type badge */}
                        <div className="shrink-0 text-right space-y-1">
                          <p className="text-[11px] text-zinc-500 font-medium whitespace-nowrap">
                            {format(new Date(activity.createdAt), 'HH:mm')}
                          </p>
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    );

                    if (activity.link) {
                      return (
                        <a key={activity.id} href={activity.link} className="block">
                          {row}
                        </a>
                      );
                    }
                    return <div key={activity.id}>{row}</div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={pages}
        total={total}
        label="sự kiện"
        onPageChange={p => navigate({ page: String(p) })}
      />
    </div>
  );
}
