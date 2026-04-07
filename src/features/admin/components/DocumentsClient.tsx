'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Edit2, Trash2, Plus, Search, Filter, Calendar, LayoutGrid, Tag, Award, X, ChevronDown, Loader2 } from 'lucide-react';
import { deleteArticleAction, quickUpdateArticleAction } from '@/features/admin/actions/article';
import AdminPagination from './AdminPagination';
import type { getAdminArticlesAction } from '@/features/admin/actions/article';
import type { ArticleStatus, ArticleAudience } from '@prisma/client';

type Articles = Awaited<ReturnType<typeof getAdminArticlesAction>>['articles'];

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System Design', AI_ML: 'AI / ML', DEVOPS: 'DevOps',
  BLOCKCHAIN: 'Blockchain', FRONTEND: 'Frontend', BACKEND: 'Backend', OTHER: 'Khác',
};

const CATEGORY_COLORS: Record<string, string> = {
  SYSTEM_DESIGN: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  AI_ML:         'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  DEVOPS:        'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  BLOCKCHAIN:    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  FRONTEND:      'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  BACKEND:       'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  OTHER:         'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400',
};

const AUDIENCE_CONFIG: Record<string, { label: string; className: string }> = {
  PUBLIC:  { label: 'Public',   className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  MEMBERS: { label: 'Members',  className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  PREMIUM: { label: 'Premium',  className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  PRIVATE: { label: 'Private',  className: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400' },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

export default function DocumentsClient({
  articles,
  total,
  totalPages,
  currentPage,
  categories,
}: {
  articles: Articles;
  total: number;
  totalPages: number;
  currentPage: number;
  categories: string[];
}) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters]     = useState(false);
  const [deletingId,  setDeletingId]      = useState<string | null>(null);
  const [isPending,   startTransition]    = useTransition();


  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá bài viết này?')) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteArticleAction(id);
      setDeletingId(null);
    });
  };

  const handleQuickUpdate = (id: string, patch: { status?: ArticleStatus; audience?: ArticleAudience }) => {
    startTransition(async () => {
      await quickUpdateArticleAction(id, patch);
    });
  };

  const handlePageChange = (page: number) => updateParam('page', String(page));

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              defaultValue={searchParams.get('search') ?? ''}
              placeholder="Tìm kiếm bài viết..."
              onKeyDown={e => { if (e.key === 'Enter') updateParam('search', (e.target as HTMLInputElement).value); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-2 py-2.5 text-sm font-bold transition-all cursor-pointer ${showFilters ? 'text-primary' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Filter className="w-4 h-4" /> Lọc nâng cao
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-black/20 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <LayoutGrid className="w-3.5 h-3.5 text-primary" /> Danh mục
                </label>
                <select
                  defaultValue={searchParams.get('category') ?? ''}
                  onChange={e => updateParam('category', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-slate-700 shadow-sm cursor-pointer"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <Award className="w-3.5 h-3.5 text-primary" /> Trạng thái
                </label>
                <select
                  defaultValue={searchParams.get('status') ?? ''}
                  onChange={e => updateParam('status', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-slate-700 shadow-sm cursor-pointer"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PUBLISHED">Đã đăng</option>
                  <option value="DRAFT">Nháp</option>
                  <option value="SCHEDULED">Lên lịch</option>
                </select>
              </div>
              <div className="flex flex-col gap-2.5 justify-end">
                <button
                  onClick={() => { router.push(pathname); setShowFilters(false); }}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <X className="w-4 h-4" /> Xóa lọc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-lg shadow-sm">
          <div className="min-w-[900px]">
            {/* Sticky header */}
            <div className="grid grid-cols-12 px-6 py-3 border-b border-slate-100 dark:border-white/5 text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/95 dark:bg-slate-900/90 backdrop-blur-md rounded-t-lg items-center sticky top-[65px] md:top-[73px] z-20">
              <div className="col-span-4">Tiêu đề</div>
              <div className="col-span-2">Danh mục</div>
              <div className="col-span-1">Tags</div>
              <div className="col-span-1 text-right">Lượt xem</div>
              <div className="col-span-1 text-center">Tác giả</div>
              <div className="col-span-1 text-center">Quyền</div>
              <div className="col-span-1 text-center">Trạng thái</div>
              <div className="col-span-1 text-right"></div>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-white/5">
          {articles.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">Không có bài viết nào.</div>
          ) : (
            articles.map(doc => (
              <div key={doc.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <div className="col-span-4 pr-4">
                  <Link href={`/article/${doc.slug}`} target="_blank" className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors block">
                    {doc.title}
                  </Link>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {doc.publishedAt ? formatDate(doc.publishedAt) : formatDate(doc.createdAt)}
                  </p>
                </div>
                <div className="col-span-2 pr-2">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[doc.category] ?? 'bg-slate-100 text-slate-600'}`}>
                    {CATEGORY_LABELS[doc.category] ?? doc.category}
                  </span>
                </div>
                <div className="col-span-1 pr-2 flex gap-1 flex-wrap">
                  {doc.tags.slice(0, 1).map(t => (
                    <span key={t.tag.name} className="text-[9px] font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 truncate max-w-[70px]">
                      {t.tag.name}
                    </span>
                  ))}
                  {doc.tags.length > 1 && (
                    <span className="text-[9px] font-medium px-2 py-1 rounded-md bg-slate-50 dark:bg-white/5 text-slate-400 border border-slate-100 dark:border-white/5">
                      +{doc.tags.length - 1}
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-right text-sm font-bold text-slate-700 dark:text-slate-300 pr-2">
                  {doc.viewCount.toLocaleString()}
                </div>
                <div className="col-span-1 text-center text-sm text-slate-500 truncate px-1">
                  {doc.author?.name ?? '—'}
                </div>
                <div className="col-span-1 flex justify-center">
                  <div className={`relative flex items-center gap-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${AUDIENCE_CONFIG[(doc as any).audience]?.className ?? AUDIENCE_CONFIG.PRIVATE.className}`}>
                    <select
                      defaultValue={(doc as any).audience}
                      disabled={isPending}
                      onChange={e => handleQuickUpdate(doc.id, { audience: e.target.value as ArticleAudience })}
                      onClick={e => e.stopPropagation()}
                      className="text-[10px] font-bold pl-2.5 pr-5 py-1 rounded-full uppercase tracking-wider border-0 outline-none cursor-pointer appearance-none bg-transparent"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="MEMBERS">Members</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                    <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  <div className={`relative flex items-center rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                    doc.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : doc.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                  }`}>
                    <select
                      defaultValue={doc.status}
                      disabled={isPending}
                      onChange={e => handleQuickUpdate(doc.id, { status: e.target.value as ArticleStatus })}
                      onClick={e => e.stopPropagation()}
                      className="text-[10px] font-bold pl-2.5 pr-5 py-1 rounded-full uppercase tracking-wider border-0 outline-none cursor-pointer appearance-none bg-transparent"
                    >
                      <option value="PUBLISHED">Đã đăng</option>
                      <option value="DRAFT">Nháp</option>
                      <option value="SCHEDULED">Lên lịch</option>
                    </select>
                    <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-1 flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/articles/${doc.id}/edit`} className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id || isPending}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        label="bài viết"
        onPageChange={handlePageChange}
      />
    </>
  );
}
