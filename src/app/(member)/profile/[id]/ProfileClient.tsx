'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart, MessageCircle, Eye, Clock, Calendar, FileText,
  Bookmark, History, BookOpen,
} from 'lucide-react';

/* ── Shared helpers ─────────────────────────────────────────── */
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
function fmtViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/* ── Types ──────────────────────────────────────────────────── */
type Article = {
  id: string; title: string; slug: string; summary: string | null;
  thumbnail: string | null; thumbnailPosition: string | null;
  category: string; readTime: number; viewCount: number; publishedAt: Date | null;
  _count: { likes: number; comments: number };
};

type Bookmark = {
  id: string; title: string; slug: string; summary: string | null;
  thumbnail: string | null; category: string; readTime: number;
  viewCount: number;
  _count: { likes: number; comments: number };
};

type HistoryItem = {
  article: {
    id: string; title: string; slug: string; thumbnail: string | null;
    category: string; readTime: number; author: { name: string };
  };
  progress: number;
  readAt: Date;
};

type Tab = 'articles' | 'bookmarks' | 'history';

/* ── Sub-components ─────────────────────────────────────────── */
function ArticleList({ articles }: { articles: Article[] }) {
  if (articles.length === 0)
    return (
      <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
        <FileText className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Chưa có bài viết nào.</p>
      </div>
    );
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
      {articles.map(a => (
        <Link key={a.id} href={`/article/${a.slug}`}
          className="flex items-stretch gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group">
          <div className="w-20 h-14 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 bg-cover bg-center overflow-hidden flex items-center justify-center text-slate-300 dark:text-white/20 font-bold text-xl"
            style={a.thumbnail ? { backgroundImage: `url('${a.thumbnail}')`, backgroundPosition: a.thumbnailPosition ?? '50% 50%' } : undefined}>
            {!a.thumbnail && a.title[0]}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <div className="flex items-start gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1 flex-1">{a.title}</h3>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:block ${CATEGORY_COLORS[a.category] ?? ''}`}>
                  {CATEGORY_LABELS[a.category]}
                </span>
              </div>
              {a.summary && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{a.summary}</p>}
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /><span className="text-[11px]">{a._count.likes}</span></span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /><span className="text-[11px]">{a._count.comments}</span></span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /><span className="text-[11px]">{fmtViews(a.viewCount)}</span></span>
              <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" /><span className="text-[10px]">{a.readTime}p</span></span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function BookmarkList({ bookmarks }: { bookmarks: Bookmark[] }) {
  if (bookmarks.length === 0)
    return (
      <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
        <Bookmark className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Chưa lưu bài viết nào.</p>
      </div>
    );
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
      {bookmarks.map(b => (
        <Link key={b.id} href={`/article/${b.slug}`}
          className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group">
          <div className="w-16 h-12 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 bg-cover bg-center overflow-hidden flex items-center justify-center text-slate-300 dark:text-white/20 font-bold text-lg"
            style={b.thumbnail ? { backgroundImage: `url('${b.thumbnail}')` } : undefined}>
            {!b.thumbnail && b.title[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1 flex-1">{b.title}</h3>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:block ${CATEGORY_COLORS[b.category] ?? ''}`}>
                {CATEGORY_LABELS[b.category]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-slate-400">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /><span className="text-[11px]">{b._count.likes}</span></span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /><span className="text-[11px]">{fmtViews(b.viewCount)}</span></span>
              <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" /><span className="text-[10px]">{b.readTime}p</span></span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function HistoryList({ history }: { history: HistoryItem[] }) {
  if (history.length === 0)
    return (
      <div className="py-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
        <History className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Chưa đọc bài viết nào.</p>
      </div>
    );
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
      {history.map(({ article, progress, readAt }) => (
        <Link key={article.id} href={`/article/${article.slug}`}
          className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group">
          <div className="w-14 h-14 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 bg-cover bg-center overflow-hidden flex items-center justify-center text-slate-300 dark:text-white/20 font-bold text-xl"
            style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')` } : undefined}>
            {!article.thumbnail && article.title[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">{article.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{article.author.name}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">{Math.round(progress * 100)}%</span>
            </div>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[article.category] ?? ''}`}>
              {CATEGORY_LABELS[article.category]}
            </span>
            <div className="flex items-center gap-1 justify-end mt-1.5 text-slate-400">
              <Clock className="w-3 h-3" /><span className="text-[10px]">{article.readTime}p</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────── */
export default function ProfileClient({
  articles,
  bookmarks,
  history,
  isOwner,
}: {
  articles: Article[];
  bookmarks: Bookmark[] | null;
  history: HistoryItem[] | null;
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<Tab>('articles');

  const tabDefs = ([
    { key: 'articles'  as Tab, icon: FileText,  label: 'Bài viết',    count: articles.length,          ownerOnly: false },
    { key: 'bookmarks' as Tab, icon: Bookmark,  label: 'Đã lưu',      count: bookmarks?.length ?? 0,   ownerOnly: true },
    { key: 'history'   as Tab, icon: History,   label: 'Lịch sử đọc', count: history?.length ?? 0,     ownerOnly: true },
  ] as const).filter(t => !t.ownerOnly || isOwner);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100 dark:border-white/5">
        {tabDefs.map(({ key, icon: Icon, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold relative transition-colors ${
              tab === key
                ? 'text-primary'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === key ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/10 text-slate-500'
            }`}>
              {count}
            </span>
            {tab === key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'articles'  && <ArticleList  articles={articles} />}
      {tab === 'bookmarks' && <BookmarkList bookmarks={bookmarks ?? []} />}
      {tab === 'history'   && <HistoryList  history={history ?? []} />}
    </div>
  );
}
