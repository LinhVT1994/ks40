import Image from 'next/image';
import React, { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Bell, FileText, MessageSquare, Heart, Zap, Star,
  Trash2, Search, X, Pin, Send, List,
} from 'lucide-react';
import type { Notification } from '@prisma/client';
import { deleteNotificationAction, deleteReadNotificationsAction } from '@/features/admin/actions/notifications';
import type { SiteAnnouncement } from '@/features/admin/actions/config';
import AnnouncementEditor from '@/features/admin/components/AnnouncementEditor';
import NotificationSendForm from '@/features/admin/components/NotificationSendForm';
import AdminPagination from '@/features/admin/components/AdminPagination';

type NotifWithUser = Notification & {
  user: { id: string; name: string; email: string; image: string | null };
};
type Stats = {
  total: number; unread: number;
  byType: { type: string; _count: { _all: number } }[];
};
type UserOption = { id: string; name: string; email: string };

const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  SYSTEM:        { icon: Zap,           color: 'text-rose-500',   bg: 'bg-rose-500/10',   label: 'Hệ thống'  },
  NEW_ARTICLE:   { icon: FileText,      color: 'text-blue-500',   bg: 'bg-blue-500/10',   label: 'Bài viết'  },
  COMMENT_REPLY: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Bình luận' },
  LIKE:          { icon: Heart,         color: 'text-pink-500',   bg: 'bg-pink-500/10',   label: 'Yêu thích' },
  RATING:        { icon: Star,          color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Đánh giá'  },
};
const NOTIF_TYPES = Object.entries(TYPE_CFG).map(([key, cfg]) => ({ key, label: cfg.label }));
const READ_FILTERS = [
  { key: 'all',   label: 'Tất cả'   },
  { key: 'false', label: 'Chưa đọc' },
  { key: 'true',  label: 'Đã đọc'   },
];

type Tab = 'list' | 'send' | 'banner';
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'list',   label: 'Danh sách',      icon: List  },
  { key: 'send',   label: 'Gửi thông báo',  icon: Send  },
  { key: 'banner', label: 'Banner ghim',     icon: Pin   },
];

export default function NotificationsAdminClient({
  notifications: initialNotifications, stats, users, announcement,
  total, pages, currentPage, currentType, currentRead, currentQ,
}: {
  notifications: NotifWithUser[];
  stats: Stats;
  users: UserOption[];
  announcement: SiteAnnouncement | null;
  total: number; pages: number; currentPage: number;
  currentType: string; currentRead: string; currentQ: string;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(currentQ);

  const tab = (searchParams.get('tab') as Tab | null) ?? 'list';
  const setTab = (t: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (t === 'list') params.delete('tab'); else params.set('tab', t);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  React.useEffect(() => { setQ(currentQ); }, [currentQ]);
  React.useEffect(() => { setDeletedIds(new Set()); }, [currentType, currentRead, currentQ, currentPage]);

  const notifications = initialNotifications.filter(n => !deletedIds.has(n.id));

  const navigate = (params: Record<string, string>) => {
    const merged = { type: currentType, read: currentRead, q: currentQ, page: '1', ...params };
    const sp = new URLSearchParams();
    if (merged.type && merged.type !== 'all') sp.set('type', merged.type);
    if (merged.read && merged.read !== 'all') sp.set('read', merged.read);
    if (merged.q) sp.set('q', merged.q);
    if (merged.page && merged.page !== '1') sp.set('page', merged.page);
    startTransition(() => router.push(`${pathname}?${sp.toString()}`, { scroll: false }));
  };

  const handleDelete = (id: string) => {
    setDeletedIds(prev => new Set([...prev, id]));
    startTransition(() => deleteNotificationAction(id));
  };

  const handleDeleteRead = () => {
    startTransition(async () => { await deleteReadNotificationsAction(); router.refresh(); });
  };

  return (
    <div className="space-y-5">

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold relative transition-colors ${
                tab === key ? 'text-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key === 'list' && stats.unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {stats.unread}
                </span>
              )}
              {tab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'banner' && <AnnouncementEditor initial={announcement} />}

      {tab === 'send' && (
        <NotificationSendForm users={users} onSent={() => { router.refresh(); setTab('list'); }} alwaysOpen />
      )}

      {tab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
            {/* Search — bên trái */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={q} onChange={e => { setQ(e.target.value); navigate({ q: e.target.value, page: '1' }); }} placeholder="Tìm tên, tiêu đề..."
                className="w-full pl-9 pr-7 py-2.5 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-zinc-500" />
              {q && <button type="button" onClick={() => { setQ(''); navigate({ q: '', page: '1' }); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-600"><X className="w-3.5 h-3.5" /></button>}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => navigate({ type: 'all' })}
                className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all ${currentType === 'all' ? 'bg-zinc-800 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-zinc-300'}`}>
                Tất cả
              </button>
              {NOTIF_TYPES.map(t => {
                const cfg = TYPE_CFG[t.key];
                const Icon = cfg.icon;
                const isActive = currentType === t.key;
                return (
                  <button key={t.key} onClick={() => navigate({ type: t.key })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${isActive ? `${cfg.bg} ${cfg.color} border-current` : 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-zinc-300'}`}>
                    <Icon className="w-3 h-3" />{t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-0.5 rounded-2xl sm:ml-auto">
              {READ_FILTERS.map(f => (
                <button key={f.key} onClick={() => navigate({ read: f.key })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${currentRead === f.key ? 'bg-white dark:bg-white/10 text-zinc-800 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {stats.total - stats.unread > 0 && (
              <button onClick={handleDeleteRead} disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Xóa đã đọc
              </button>
            )}
          </div>

          {/* Table */}
          <div className={`transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {notifications.length === 0 ? (
              <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl py-16 flex flex-col items-center gap-3 text-zinc-500">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-sm">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_180px_100px_90px_44px] gap-4 px-5 py-3 border-b border-zinc-200 dark:border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Thông báo</span><span>Người nhận</span><span>Loại</span><span>Thời gian</span><span />
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-white/5">
                  {notifications.map(n => {
                    const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
                    const Icon = cfg.icon;
                    const avatarUrl = n.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.user.name)}&background=e2e8f0&color=0f172a&size=64`;
                    return (
                      <div key={n.id} className={`grid grid-cols-[1fr_180px_100px_90px_44px] gap-4 px-5 py-3.5 items-center hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors ${!n.read ? 'bg-primary/[0.02]' : ''}`}>
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${cfg.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm truncate ${!n.read ? 'font-semibold text-zinc-800 dark:text-white' : 'text-zinc-700 dark:text-slate-300'}`}>
                              {n.title}
                              {!n.read && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-primary align-middle" />}
                            </p>
                            {n.message && <p className="text-xs text-zinc-500 truncate mt-0.5">{n.message}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                           <div className="relative w-6 h-6 shrink-0">
                            <Image
                              src={avatarUrl}
                              alt=""
                              fill
                              sizes="24px"
                              className="rounded-full object-cover"
                            />
                           </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-zinc-700 dark:text-slate-300 truncate">{n.user.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{n.user.email}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} w-fit`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                        <p className="text-xs text-zinc-500">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                        <button onClick={() => handleDelete(n.id)}
                          className="p-1.5 rounded-lg text-zinc-300 dark:text-white/20 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={pages}
            total={total}
            label="thông báo"
            onPageChange={p => navigate({ page: String(p) })}
          />
        </div>
      )}
    </div>
  );
}
