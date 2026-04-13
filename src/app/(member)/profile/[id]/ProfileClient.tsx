'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Heart, MessageCircle, Eye, Clock, Calendar, FileText, Star,
  Bookmark, History, BookOpen, PenLine, Trash2, Settings,
  AlertCircle, Send as SendIcon, CheckCircle2, ChevronDown
} from 'lucide-react';
import { deleteMemberArticleAction } from '@/features/member/actions/write';
import DashboardStats from '@/features/member/components/Dashboard/DashboardStats';
import ContinueReading from '@/features/member/components/Dashboard/ContinueReading';
import DailyMotivation from '@/features/member/components/Dashboard/DailyMotivation';

/* ── Shared helpers ─────────────────────────────────────────── */
type TopicBadge = { label: string; color: string | null };
function fmtViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function countWords(str: string) {
  return str ? str.trim().split(/\s+/).length : 0;
}

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString('vi-VN');
}

/* ── Types ──────────────────────────────────────────────────── */
type Article = {
  id: string; title: string; slug: string; summary: string | null;
  thumbnail: string | null; thumbnailPosition: string | null;
  topic: TopicBadge; readTime: number; viewCount: number; publishedAt: Date | null;
  _count: { likes: number; comments: number };
};

type Bookmark = {
  id: string; title: string; slug: string; summary: string | null;
  thumbnail: string | null; topic: TopicBadge; readTime: number;
  viewCount: number;
  _count: { likes: number; comments: number };
};

type HistoryItem = {
  article: {
    id: string; title: string; slug: string; thumbnail: string | null;
    topic: TopicBadge; readTime: number; author: { name: string };
    summary: string | null;
  };
  progress: number;
  readAt: Date;
};

type Draft = {
  id: string; title: string; slug: string; summary: string | null;
  topicId: string; createdAt: Date; updatedAt: Date;
  status: 'DRAFT' | 'PENDING' | 'REJECTED';
  content: string; thumbnail: string | null;
  topic: { label: string; slug: string; color: string | null };
  rejectionReason?: string;
};

type Tab = 'articles' | 'drafts' | 'bookmarks' | 'history' | 'followers' | 'ratings';

type AuthorRatingStats = {
  ratings: Array<{
    userId: string;
    score: number;
    review: string | null;
    hidden: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string; image: string | null };
  }>;
  totalCount: number;
  averageScore: number;
  totalRatedArticles: number;
};

/* ── Sub-components ─────────────────────────────────────────── */
function ArticleList({ articles: initialArticles, totalArticles, totalPages: initialTotalPages, userId }: {
  articles: Article[];
  totalArticles: number;
  totalPages: number;
  userId: string;
}) {
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState(initialArticles);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  const goToPage = async (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) return;
    setLoading(true);
    try {
      const { getProfileArticlesAction } = await import('@/features/member/actions/profile');
      const result = await getProfileArticlesAction(userId, newPage);
      if (result.success && result.data) {
        setArticles(result.data as Article[]);
        setPage(newPage);
        setTotalPages(result.totalPages ?? initialTotalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  if (totalArticles === 0)
    return (
      <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <FileText className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">Bạn chưa đăng bài viết nào.</p>
        <Link href="/write" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">Viết bài ngay</Link>
      </div>
    );

  return (
    <div>
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        {articles.map((a, i) => (
          <Link
            key={a.id}
            href={`/article/${a.slug}`}
            style={{ animationDelay: `${i * 100}ms` }}
            className="group relative cursor-pointer bg-white/40 dark:bg-white/[0.02] backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
          >
            <div className="aspect-[16/10] overflow-hidden relative">
              <img
                src={a.thumbnail || '/placeholder-article.jpg'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={a.title}
              />
              <div className="absolute top-3 left-3">
                <span className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide shadow-sm border border-white/20 dark:border-white/5"
                  style={{ color: a.topic.color ?? '#3B82F6' }}>
                  {a.topic.label}
                </span>
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">{a.title}</h3>
              {a.summary && <p className="text-sm text-zinc-500 line-clamp-2 mb-4 leading-relaxed">{a.summary}</p>}

              <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-zinc-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /><span className="text-sm font-bold tabular-nums">{fmtViews(a._count.likes)}</span></span>
                  <span className="flex items-center gap-1.5"><Eye className="w-4.5 h-4.5" /><span className="text-sm font-bold tabular-nums">{fmtViews(a.viewCount)}</span></span>
                </div>
              </div>
            </div>

            {/* Premium Hover Guide Overlay */}
            <div className="absolute inset-0 bg-primary/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
               <div className="bg-white/90 dark:bg-slate-900/90 px-4 py-2 rounded-full shadow-2xl border border-primary/20 scale-90 group-hover:scale-100 transition-all duration-500">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Nhấn để xem bài</span>
               </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8 pt-4 border-t border-zinc-200 dark:border-white/5">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
          >
            ‹ Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              disabled={loading}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                p === page
                  ? 'bg-primary text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages || loading}
            className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
          >
            Sau ›
          </button>
        </div>
      )}
    </div>
  );
}

function BookmarkList({ bookmarks }: { bookmarks: Bookmark[] }) {
  if (bookmarks.length === 0)
    return (
      <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <Bookmark className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">Danh sách lưu của bạn đang trống.</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {bookmarks.map((b, i) => (
        <Link 
          key={b.id} 
          href={`/article/${b.slug}`} 
          style={{ animationDelay: `${i * 100}ms` }}
          className="group relative cursor-pointer bg-white/40 dark:bg-white/[0.02] backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        >
          <div className="aspect-[16/10] overflow-hidden relative">
            <img 
              src={b.thumbnail || '/placeholder-article.jpg'} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              alt={b.title}
            />
            <div className="absolute top-3 left-3">
              <span className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide shadow-sm border border-white/20 dark:border-white/5"
                style={{ color: b.topic.color ?? '#3B82F6' }}>
                {b.topic.label}
              </span>
            </div>
          </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">{b.title}</h3>
              {b.summary && <p className="text-sm text-zinc-500 line-clamp-2 mb-4 leading-relaxed">{b.summary}</p>}

              <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-zinc-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /><span className="text-sm font-bold tabular-nums">{fmtViews(b._count.likes)}</span></span>
                  <span className="flex items-center gap-1.5"><Eye className="w-4.5 h-4.5" /><span className="text-sm font-bold tabular-nums">{fmtViews(b.viewCount)}</span></span>
                </div>
              </div>
            </div>

            {/* Premium Hover Guide Overlay */}
            <div className="absolute inset-0 bg-primary/5 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
               <div className="bg-white/90 dark:bg-slate-900/90 px-4 py-2 rounded-full shadow-2xl border border-primary/20 scale-90 group-hover:scale-100 transition-all duration-500">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Nhấn để đọc ngay</span>
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
      <div className="py-16 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <History className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">Chưa có lịch sử đọc.</p>
      </div>
    );
  return (
    <div className="space-y-4">
      {history.map(({ article, progress }, i) => (
        <Link 
          key={article.id} 
          href={`/article/${article.slug}`} 
          style={{ animationDelay: `${i * 70}ms` }}
          className="group flex items-center gap-5 p-4 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-2xl hover:shadow-xl hover:shadow-primary/5 transition-all animate-in fade-in slide-in-from-left-4 fill-mode-both"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
            <img src={article.thumbnail || '/placeholder.jpg'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
            {progress >= 0.95 && (
               <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white animate-pulse" />
               </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors line-clamp-1 mb-1">{article.title}</h3>
            {article.summary && (
              <p className="text-sm text-zinc-500 dark:text-slate-400 line-clamp-1 mb-2 leading-relaxed">
                {article.summary}
              </p>
            )}
            <div className="mt-2.5 flex items-end gap-6">
              <div className="flex-1 space-y-2">
                 <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-zinc-500">
                    <span>Tiến độ đọc</span>
                    <span className="text-primary">{Math.round(progress * 100)}%</span>
                 </div>
                 <div className="h-1 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-1000" style={{ width: `${progress * 100}%` }} />
                 </div>
              </div>
            </div>
          </div>

          {/* Minimalist Hover Guide Overlay for History */}
          <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none">
             <div className="bg-primary text-white px-4 py-2 rounded-full shadow-2xl scale-90 group-hover:scale-100 transition-all duration-500 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest">Tiếp tục đọc</span>
                <BookOpen className="w-3 h-3" />
             </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function DraftList({ drafts }: { drafts: Draft[] }) {
  const [items, setItems] = useState(drafts);
  const [deleting, setDeleting] = useState<string | null>(null);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          label: 'Đang chờ duyệt', 
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          icon: Clock
        };
      case 'REJECTED':
        return { 
          label: 'Cần chỉnh sửa', 
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
          icon: AlertCircle
        };
      default:
        return { 
          label: 'Bản nháp', 
          color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/10',
          icon: FileText
        };
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Xoá bản nháp này?')) return;
    setDeleting(id);
    const result = await deleteMemberArticleAction(id);
    if (result.success) {
      setItems(prev => prev.filter(d => d.id !== id));
    }
    setDeleting(null);
  };

  if (items.length === 0)
    return (
      <div className="py-24 text-center">
        <PenLine className="w-8 h-8 text-zinc-100 dark:text-white/5 mx-auto mb-4" />
        <p className="text-zinc-500 text-sm font-bold tracking-tight">Cảm hứng đang chờ đợi bạn.</p>
        <Link href="/write" className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:opacity-70 transition-all">
          <span>Khởi tạo bản thảo mới</span>
        </Link>
      </div>
    );

  return (
    <div className="space-y-5">
      {items.map((d, index) => {
        const words = countWords(d.content || '');
        const readTime = Math.max(1, Math.ceil(words / 200));
        const s = getStatusInfo(d.status);
        const StatusIcon = s.icon;
        
        return (
          <Link 
            key={d.id} 
            href={d.status === 'PENDING' ? '#' : `/write/${d.id}`}
            style={{ animationDelay: `${index * 80}ms` }}
            className={`group relative cursor-pointer bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-[2rem] p-4 flex flex-col md:flex-row gap-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${d.status === 'PENDING' ? 'pointer-events-none opacity-80' : ''}`}
          >
            {/* Thumbnail / Gradient Fallback */}
            <div className="w-full md:w-[240px] aspect-[16/10] md:aspect-square lg:aspect-[16/10] rounded-2xl overflow-hidden relative shrink-0">
               {d.thumbnail ? (
                  <img src={d.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
               ) : (
                  <div 
                    className="w-full h-full opacity-20 dark:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${d.topic.color ?? '#3b82f6'}, transparent)` }}
                  />
               )}
               <div className="absolute inset-x-0 top-3 px-3 flex justify-between items-start">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${s.color}`}>
                     <StatusIcon className="w-3 h-3" />
                     {s.label}
                  </span>
               </div>
               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-900/60 to-transparent flex items-end p-4">
                  <span className="text-[9px] font-black text-white px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 uppercase tracking-widest">
                    {d.topic.label}
                  </span>
               </div>
            </div>

            {/* Content Info */}
            <div className="flex-1 flex flex-col py-2">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-black text-zinc-800 dark:text-white group-hover:text-primary transition-colors leading-tight line-clamp-1">
                  {d.title || 'Draft: Chưa có tiêu đề'}
                </h3>
              </div>
              
              <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {d.summary || 'Trình soạn thảo Zen đang lưu giữ những ý tưởng tuyệt vời nhất của bạn. Hãy quay lại và hoàn tất nó nhé.'}
              </p>

              {d.status === 'REJECTED' && d.rejectionReason && (
                <div className="mb-4 p-3 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    <AlertCircle className="w-3 h-3" /> Phản hồi từ Admin
                  </div>
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 leading-normal italic">
                    "{d.rejectionReason}"
                  </p>
                </div>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                    <FileText className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tabular-nums">{words} từ</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 dark:text-slate-400 uppercase tabular-nums">{readTime}m đọc</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 tracking-wider">
                  <Calendar className="w-3 h-3 opacity-60" />
                  <span>{timeAgo(d.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Practical Actions */}
            <div className="flex flex-row md:flex-col items-center justify-center gap-2 md:pl-2">
               <div 
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-4 py-3 rounded-[1.25rem] transition-all duration-300 group/edit ${
                    d.status === 'PENDING' ? 'bg-zinc-100 dark:bg-white/5 text-zinc-500 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'
                  }`}
               >
                  <PenLine className="w-4 h-4 transition-transform group-hover/edit:-rotate-12" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {d.status === 'PENDING' ? 'Đang duyệt' : d.status === 'REJECTED' ? 'Sửa lại' : 'Viết tiếp'}
                  </span>
               </div>
               {d.status !== 'PENDING' && (
                 <button 
                    onClick={(e) => handleDelete(d.id, e)} 
                    disabled={deleting === d.id}
                    className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[1.25rem] transition-all disabled:opacity-30 relative z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                 </button>
               )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function FollowerList({ followers: initialFollowers, totalFollowers, totalPages: initialTotalPages, userId }: {
  followers: { id: string; name: string | null; image: string | null; bio: string | null; articleCount: number }[];
  totalFollowers: number;
  totalPages: number;
  userId: string;
}) {
  const [page, setPage] = useState(1);
  const [followers, setFollowers] = useState(initialFollowers);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  const goToPage = async (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) return;
    setLoading(true);
    try {
      const { getFollowersAction } = await import('@/features/member/actions/profile-follow');
      const result = await getFollowersAction(userId, newPage);
      if (result.success && result.data) {
        setFollowers(result.data);
        setPage(newPage);
        setTotalPages(result.totalPages ?? initialTotalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  if (totalFollowers === 0)
    return (
      <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <Heart className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">Bạn chưa có người theo dõi nào.</p>
      </div>
    );

  return (
    <div>
      <div className={`space-y-2 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        {followers.map((f, i) => (
          <Link
            key={f.id}
            href={`/profile/${f.id}`}
            style={{ animationDelay: `${i * 50}ms` }}
            className="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors animate-in fade-in slide-in-from-left-2 fill-mode-both"
          >
            <img
              src={f.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name ?? 'User')}&background=e2e8f0&color=0f172a`}
              className="w-10 h-10 rounded-full object-cover border border-zinc-300 dark:border-white/10 shrink-0"
              alt={f.name ?? ''}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors truncate">{f.name}</h3>
              {f.bio && <p className="text-xs text-zinc-500 truncate mt-0.5">{f.bio}</p>}
            </div>
            <span className="text-[11px] font-bold text-zinc-500 tabular-nums shrink-0">{f.articleCount} bài viết</span>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6 pt-4 border-t border-zinc-200 dark:border-white/5">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
          >
            ‹ Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              disabled={loading}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                p === page
                  ? 'bg-primary text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages || loading}
            className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
          >
            Sau ›
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────── */
/* ── RatingsDashboard ───────────────────────────────────────── */
function RatingsDashboard({ data }: { data: AuthorRatingStats | null }) {
  if (!data || data.totalCount === 0)
    return (
      <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <Star className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">Chưa có đánh giá nào cho bài viết của bạn.</p>
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter">{data.averageScore.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(data.averageScore) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-white/10'}`} />
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-2">Điểm trung bình</p>
        </div>
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter">{data.totalCount}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-2">Tổng đánh giá</p>
        </div>
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter">{data.totalRatedArticles}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-2">Bài có đánh giá</p>
        </div>
      </div>

      {/* Recent reviews */}
      <div>
        <h4 className="text-xs font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest mb-4">Nhận xét gần đây</h4>
        <div className="space-y-3">
          {data.ratings.filter(r => r.review).length === 0 && (
            <p className="text-sm text-zinc-400">Chưa có nhận xét nào có nội dung.</p>
          )}
          {data.ratings
            .filter(r => r.review)
            .map(r => {
              const avatarUrl = r.user.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user.name)}&background=e2e8f0&color=0f172a&size=32`;
              return (
                <div key={`${r.userId}`} className="flex gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
                  <img src={avatarUrl} alt={r.user.name} className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-800 dark:text-white">{r.user.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`w-3 h-3 ${i <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-white/10'}`} />
                        ))}
                      </div>
                      {r.hidden && (
                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Đã ẩn</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">{r.review}</p>
                    <p className="mt-1 text-[10px] text-zinc-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* All ratings list (including score-only) */}
      <div>
        <h4 className="text-xs font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-widest mb-4">Tất cả đánh giá</h4>
        <div className="space-y-2">
          {data.ratings.map(r => (
            <div key={`${r.userId}`} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <img
                  src={r.user.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user.name)}&background=e2e8f0&color=0f172a&size=24`}
                  alt={r.user.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-slate-300">{r.user.name}</span>
                {r.hidden && <span className="text-[9px] font-bold text-rose-500 uppercase">Ẩn</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3 h-3 ${i <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300 dark:text-white/10'}`} />
                  ))}
                </div>
                <span className="text-[10px] text-zinc-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfileClient({
  user,
  articles,
  totalArticles,
  totalArticlePages,
  bookmarks,
  history,
  drafts,
  followers,
  totalFollowers,
  totalFollowerPages,
  isOwner,
  canWrite,
  stats,
  lastActivity,
  ratingsData,
}: {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    createdAt: Date;
    avatarUrl: string;
    totalViews: number;
    totalLikes: number;
    _count: { articles: number };
  };
  articles: Article[];
  totalArticles: number;
  totalArticlePages: number;
  bookmarks: { articles: Bookmark[]; total: number } | null;
  history: HistoryItem[] | null;
  drafts: Draft[] | null;
  followers: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    articleCount: number;
  }[];
  totalFollowers: number;
  totalFollowerPages: number;
  isOwner: boolean;
  canWrite: boolean;
  stats: {
    totalCompleted: number;
    notesCount: number;
    streak: number;
    last7Days: boolean[];
  } | null;
  lastActivity: any | null;
  ratingsData: AuthorRatingStats | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as Tab) || 'articles';
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab') as Tab;
    if (t && ['articles', 'drafts', 'bookmarks', 'history', 'followers', 'ratings'].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const tabDefs = ([
    { key: 'articles'  as Tab, icon: FileText,  label: 'Bài viết',    count: totalArticles,          show: true },
    { key: 'drafts'    as Tab, icon: PenLine,   label: 'Bản nháp',    count: drafts?.length ?? 0,      show: isOwner && canWrite },
    { key: 'bookmarks' as Tab, icon: Bookmark,  label: 'Đã lưu',      count: bookmarks?.total ?? 0,    show: isOwner },
    { key: 'history'   as Tab, icon: History,   label: 'Lịch sử đọc', count: history?.length ?? 0,      show: isOwner },
    { key: 'followers' as Tab, icon: Heart,     label: 'Người theo dõi', count: totalFollowers,   show: true },
    { key: 'ratings'   as Tab, icon: Star,      label: 'Đánh giá',      count: ratingsData?.totalCount ?? 0, show: isOwner && canWrite },
  ] as const).filter(t => t.show);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Sidebar: Profile + Navigation */}
      <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-12">
        {/* User Identity - Simplified Floating Version */}
        <div className="flex flex-col items-center px-4 text-center">
          <img 
            src={user.avatarUrl} 
            alt={user.name ?? ''}
            className="w-24 h-24 rounded-full object-cover border border-zinc-200 dark:border-white/10 shadow-sm"
          />
          
          <div className="mt-6 flex items-center justify-center gap-2 group">
            <h1 className="text-xl font-black text-zinc-800 dark:text-white tracking-tight">
              {user.name}
            </h1>
            {isOwner && (
              <Link href="/settings" className="p-1 text-zinc-500 hover:text-primary transition-colors" title="Thiết lập">
                <Settings className="w-4 h-4" />
              </Link>
            )}
          </div>
          
          {user.bio && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-slate-400 leading-relaxed font-semibold italic">
              "{user.bio}"
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-6">
            {[
              { label: 'Bài viết', value: user._count.articles },
              { label: 'Lượt xem', value: fmtViews(user.totalViews) },
              { label: 'Lượt thích', value: fmtViews(user.totalLikes) },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="text-base font-black text-zinc-800 dark:text-white leading-none tracking-tight">{s.value}</span>
                <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-tighter mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vertical Navigation - Sidebar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-4 mb-4">
            <h4 className="text-[10px] font-black text-zinc-500 dark:text-slate-500 tracking-[0.2em] uppercase">Thư viện</h4>
            {isOwner && canWrite && (
               <Link href="/write" className="flex items-center gap-1 text-primary hover:text-primary/80 text-[10px] font-black tracking-wider transition-all">
                  <PenLine className="w-3 h-3" />
                  <span>VIẾT BÀI</span>
               </Link>
            )}
          </div>
          
          <div className="space-y-1">
            {tabDefs.map(({ key, icon: Icon, label, count }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  tab === key
                    ? 'bg-primary/5 text-primary'
                    : 'text-zinc-500 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${tab === key ? 'text-primary' : 'text-zinc-300 dark:text-slate-600'}`} />
                  <span>{label}</span>
                </div>
                <span className={`text-[10px] font-bold tabular-nums ${
                  tab === key ? 'text-primary' : 'text-zinc-300 dark:text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-8 xl:col-span-9 animate-in fade-in slide-in-from-right-8 duration-1000 delay-150">
        <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-zinc-800 dark:text-white tracking-tighter">
              {tabDefs.find(t => t.key === tab)?.label}
            </h2>
            <div className="h-[2px] flex-1 mx-6 bg-gradient-to-r from-zinc-100 via-zinc-100/50 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent" />
        </div>

        {isOwner && tab === 'articles' && (
          <div className="mb-12 space-y-2">
            <DashboardStats stats={stats} />
            <ContinueReading lastActivity={lastActivity} />
            <DailyMotivation />
          </div>
        )}
        
        {tab === 'articles'  && <ArticleList  articles={articles} totalArticles={totalArticles} totalPages={totalArticlePages} userId={user.id} />}
        {tab === 'drafts'    && <DraftList    drafts={drafts ?? []} />}
        {tab === 'bookmarks' && <BookmarkList bookmarks={bookmarks?.articles ?? []} />}
        {tab === 'history'   && <HistoryList  history={history ?? []} />}
        {tab === 'followers' && <FollowerList followers={followers} totalFollowers={totalFollowers} totalPages={totalFollowerPages} userId={user.id} />}
        {tab === 'ratings'  && <RatingsDashboard data={ratingsData} />}
      </div>
    </div>
  );
}
