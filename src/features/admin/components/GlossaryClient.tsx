'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Edit2, Trash2, Search, BookOpen, X, Loader2, CheckCircle2, Clock, AlertCircle, EyeOff } from 'lucide-react';
import { deleteGlossaryTermAction } from '@/features/admin/actions/glossary';
import type { getGlossaryTermsAction } from '@/features/admin/actions/glossary';
import type { TopicItem } from '@/features/admin/actions/topic';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArticleStatus } from '@prisma/client';

type Terms = Awaited<ReturnType<typeof getGlossaryTermsAction>>['terms'];
type Term = Terms[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

function StatusBadge({ status }: { status: ArticleStatus }) {
  const configs = {
    [ArticleStatus.PUBLISHED]: { label: 'Công khai', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    [ArticleStatus.PENDING]: { label: 'Chờ duyệt', icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    [ArticleStatus.DRAFT]: { label: 'Bản nháp', icon: Edit2, color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' },
    [ArticleStatus.REJECTED]: { label: 'Từ chối', icon: AlertCircle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    [ArticleStatus.SCHEDULED]: { label: 'Lên lịch', icon: Clock, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  };

  const config = configs[status] || configs[ArticleStatus.DRAFT];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

interface GlossaryClientProps {
  terms: Terms;
  total: number;
  totalPages: number;
  currentPage: number;
  topics: TopicItem[];
  statusCounts: Record<string, number>;
}

export default function GlossaryClient({ terms, total, totalPages, currentPage, topics, statusCounts }: GlossaryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Debounced search state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '');
  const [isSearching, setIsSearching] = useState(false);

  React.useEffect(() => {
    const currentSearch = searchParams.get('search') ?? '';
    if (searchTerm === currentSearch) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
        setIsSearching(false);
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router, searchParams]);

  const handleDelete = (term: Term) => {
    if (!confirm(`Xóa thuật ngữ "${term.term}"?`)) return;
    startTransition(async () => {
      const result = await deleteGlossaryTermAction(term.id);
      if (result.success) {
        toast.success('Đã xóa thuật ngữ');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const TABS = [
    { id: 'ALL', label: 'Tất cả', count: Object.values(statusCounts).reduce((a, b) => a + b, 0) },
    { id: 'PUBLISHED', label: 'Công khai', count: statusCounts[ArticleStatus.PUBLISHED] || 0 },
    { id: 'PENDING', label: 'Chờ duyệt', count: statusCounts[ArticleStatus.PENDING] || 0 },
    { id: 'DRAFT', label: 'Bản nháp', count: statusCounts[ArticleStatus.DRAFT] || 0 },
    { id: 'REJECTED', label: 'Từ chối', count: statusCounts[ArticleStatus.REJECTED] || 0 },
  ];

  const currentStatus = searchParams.get('status') || 'ALL';

  const handleTabChange = (statusId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusId === 'ALL') params.delete('status');
    else params.set('status', statusId);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters & Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-white/10 flex-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-all duration-300 whitespace-nowrap relative ${
                  currentStatus === tab.id
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white font-medium'
                }`}
              >
                <span className="text-[13px] tracking-tight">{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  currentStatus === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {isSearching || isPending ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm thuật ngữ theo tên hoặc định nghĩa..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl md:ml-auto w-fit">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('sort', 'term');
                params.delete('page');
                router.push(`${pathname}?${params.toString()}`);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                (searchParams.get('sort') || 'term') === 'term'
                  ? 'bg-white dark:bg-white/10 text-primary shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              Tên A-Z
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('sort', 'date');
                params.delete('page');
                router.push(`${pathname}?${params.toString()}`);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                searchParams.get('sort') === 'date'
                  ? 'bg-white dark:bg-white/10 text-primary shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
              }`}
            >
              Mới nhất
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {terms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="w-10 h-10 text-zinc-300 dark:text-slate-600 mb-3" />
          <p className="text-zinc-500 dark:text-slate-400 font-medium">Chưa có thuật ngữ nào</p>
        </div>
      ) : (
        <div className={`rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 transition-all duration-300 ${isSearching || isPending ? 'opacity-50 grayscale-[0.5] pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-white/[0.03] border-b border-zinc-200 dark:border-white/10">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500">Thuật ngữ</th>
                <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500 hidden md:table-cell">Định nghĩa ngắn</th>
                <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500 hidden lg:table-cell">Chủ đề</th>
                <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500">Trạng thái</th>
                <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500 hidden xl:table-cell">Người đóng góp</th>
                <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500 hidden lg:table-cell">Ngày tạo</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {terms.map(t => (
                <tr key={t.id} className="group hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-zinc-800 dark:text-white">{t.term}</div>
                    <div className="text-xs text-zinc-400 dark:text-slate-500 font-mono mt-0.5">{t.slug}</div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-zinc-600 dark:text-slate-400 line-clamp-2 max-w-xs">{t.shortDef}</p>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {t.topic ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: `${t.topic.color ?? '#64748b'}20`, color: t.topic.color ?? '#64748b' }}>
                        {t.topic.label}
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-slate-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={t.status as ArticleStatus} />
                  </td>
                  <td className="px-5 py-4 hidden xl:table-cell">
                    {t.author ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={t.author.image || '/default-avatar.png'} 
                          alt={t.author.name} 
                          className="w-6 h-6 rounded-full border border-zinc-200 dark:border-white/10" 
                        />
                        <span className="text-xs font-medium text-zinc-600 dark:text-slate-400">{t.author.name}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-slate-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-zinc-400 dark:text-slate-500 hidden lg:table-cell text-xs">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/glossary/${t.id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-slate-400">
          <span>{total} thuật ngữ</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`${pathname}?${params.toString()}`); }}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === currentPage ? 'bg-primary text-white' : 'hover:bg-zinc-100 dark:hover:bg-white/10'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
