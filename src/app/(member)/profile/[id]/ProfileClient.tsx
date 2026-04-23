'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Heart, Eye, Clock, Calendar, FileText, Star,
  Bookmark, History, PenLine, Trash2, Settings,
  AlertCircle, UserCheck, UserMinus, Globe, Facebook, Instagram, Twitter, Linkedin, Github, Youtube, Music,
} from 'lucide-react';
import { deleteMemberArticleAction } from '@/features/member/actions/write';
import type { TopicItem } from '@/features/admin/actions/topic';
import ProfileArticleCard from '@/features/member/components/ProfileArticleCard';
import { cn } from '@/lib/utils';
import { GlanceTrigger } from '@/features/member/components/GlancePreview';

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

type Tab = 'articles' | 'drafts' | 'bookmarks' | 'history' | 'followers' | 'following' | 'ratings';

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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

  const gridCols = articles.length === 1 
    ? 'grid-cols-1 w-full' 
    : articles.length === 2 
      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-10' 
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8';

  return (
    <div>
      <div className={cn("grid gap-8 transition-opacity duration-500", loading ? "opacity-50" : "opacity-100", gridCols)}>
        {articles.map((a, i) => (
          <ProfileArticleCard key={a.id} article={a as any} index={i} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-12 pt-6 border-t border-zinc-200 dark:border-white/5">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1 || loading}
            className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary disabled:opacity-30 transition-colors"
          >
            ‹ Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              disabled={loading}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                p === page ? "bg-primary text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages || loading}
            className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary disabled:opacity-30 transition-colors"
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

  const gridCols = bookmarks.length === 1 
    ? 'grid-cols-1 w-full' 
    : bookmarks.length === 2 
      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-10' 
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8';

  return (
    <div className={cn("grid gap-8", gridCols)}>
      {bookmarks.map((b, i) => (
        <ProfileArticleCard key={b.id} article={b as any} index={i} />
      ))}
    </div>
  );
}

function HistoryList({ history }: { history: HistoryItem[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (history.length === 0)
    return (
      <div className="py-16 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <History className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-3" />
        <p className="text-zinc-500 text-sm font-medium">Chưa có lịch sử đọc.</p>
      </div>
    );
  return (
    <div className="space-y-4">
      {history.map(({ article, progress }, i) => (
        <GlanceTrigger key={article.id} article={article as any}>
          <Link 
            href={`/article/${article.slug}`} 
            style={{ animationDelay: `${i * 70}ms` }}
            className="group relative flex items-center gap-5 p-4 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-2xl hover:shadow-xl hover:shadow-primary/5 transition-all animate-in fade-in slide-in-from-left-4 fill-mode-both cursor-pointer"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
              <Image 
                src={article.thumbnail || '/placeholder.jpg'} 
                fill
                sizes="64px"
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                alt={article.title} 
              />
              {progress >= 0.95 && (
                 <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] max-md:backdrop-blur-none flex items-center justify-center">
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
                      <span className="text-primary font-bold">{Math.round(progress * 100)}%</span>
                   </div>
                   <div className="h-1 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-1000" style={{ width: `${progress * 100}%` }} />
                   </div>
                </div>
              </div>
            </div>
          </Link>
        </GlanceTrigger>
      ))}
    </div>
  );
}

function DraftList({ drafts }: { drafts: Draft[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
    <div className="space-y-6">
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
            className={cn(
              "group relative cursor-pointer bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-[2rem] p-4 flex flex-col md:flex-row gap-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 fill-mode-both",
              d.status === 'PENDING' && "pointer-events-none opacity-80"
            )}
          >
            <div className="w-full md:w-[240px] aspect-[16/10] md:aspect-square lg:aspect-[16/10] rounded-2xl overflow-hidden relative shrink-0">
               {d.thumbnail ? (
                  <Image src={d.thumbnail} fill sizes="240px" className="object-cover transition-transform duration-700 group-hover:scale-110" alt={d.title || 'Draft'} />
               ) : (
                  <div className="w-full h-full opacity-20" style={{ background: `linear-gradient(135deg, ${d.topic.color ?? '#3b82f6'}, transparent)` }} />
               )}
               <div className="absolute inset-x-0 top-3 px-3 flex justify-between items-start">
                  <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md border", s.color)}>
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

            <div className="flex-1 flex flex-col py-2">
              <h3 className="text-lg font-black text-zinc-800 dark:text-white group-hover:text-primary transition-colors leading-tight line-clamp-1 mb-3">
                {d.title || 'Draft: Chưa có tiêu đề'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
                {d.summary || 'Trình soạn thảo Zen đang lưu giữ những ý tưởng tuyệt vời nhất của bạn.'}
              </p>

              {d.status === 'REJECTED' && d.rejectionReason && (
                <div className="mb-6 p-4 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1.5 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    <AlertCircle className="w-3.5 h-3.5" /> Phản hồi từ Admin
                  </div>
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 leading-normal italic line-clamp-2">
                    &ldquo;{d.rejectionReason}&rdquo;
                  </p>
                </div>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                  <FileText className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tabular-nums">{words} từ</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tabular-nums">{readTime}m đọc</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 ml-auto uppercase tracking-tighter">
                  <Calendar className="w-3 h-3 opacity-60" />
                  <span>{mounted ? timeAgo(d.updatedAt) : ''}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center justify-center gap-2 md:pl-2">
               <div className={cn(
                 "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-4 py-3 rounded-[1.25rem] transition-all duration-300",
                 d.status === 'PENDING' ? "bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed" : "bg-primary/10 hover:bg-primary text-primary hover:text-white"
               )}>
                  <PenLine className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{d.status === 'PENDING' ? 'Đang duyệt' : 'Viết tiếp'}</span>
               </div>
               {d.status !== 'PENDING' && (
                 <button onClick={(e) => handleDelete(d.id, e)} disabled={deleting === d.id} className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[1.25rem] transition-all disabled:opacity-30 relative z-10">
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

function FollowerList({ followers, totalFollowers, totalPages, userId }: {
  followers: { id: string; name: string | null; image: string | null; bio: string | null; articleCount: number; username?: string | null }[];
  totalFollowers: number;
  totalPages: number;
  userId: string;
}) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(followers);
  const [loading, setLoading] = useState(false);

  const goToPage = async (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) return;
    setLoading(true);
    try {
      const { getFollowersAction } = await import('@/features/member/actions/profile-follow');
      const result = await getFollowersAction(userId, newPage);
      if (result.success && result.data) {
        setItems(result.data);
        setPage(newPage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (totalFollowers === 0)
    return (
      <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <Heart className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium tracking-tight">Bạn chưa có người theo dõi nào.</p>
      </div>
    );

  return (
    <div>
      <div className={cn("space-y-2 transition-opacity duration-500", loading ? "opacity-50" : "opacity-100")}>
        {items.map((f, i) => (
          <Link key={f.id} href={`/profile/${f.username ?? f.id}`} style={{ animationDelay: `${i * 50}ms` }} className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all animate-in fade-in slide-in-from-left-2 fill-mode-both cursor-pointer">
            <div className="relative w-10 h-10 shrink-0">
             <Image src={f.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name ?? 'User')}&background=e2e8f0&color=0f172a`} fill unoptimized sizes="40px" className="rounded-full object-cover border border-zinc-200 dark:border-white/10" alt={f.name ?? ''} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-white truncate">{f.name}</h3>
              {f.bio && <p className="text-xs text-zinc-500 truncate mt-0.5">{f.bio}</p>}
            </div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter shrink-0">{f.articleCount} bài</span>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8 pt-4 border-t border-zinc-200 dark:border-white/5">
          <button onClick={() => goToPage(page - 1)} disabled={page === 1 || loading} className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary transition-colors">‹ Trước</button>
          <button onClick={() => goToPage(page + 1)} disabled={page === totalPages || loading} className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary transition-colors">Sau ›</button>
        </div>
      )}
    </div>
  );
}

function FollowingList({ following, totalFollowing, totalPages, userId, isOwner }: {
  following: { id: string; name: string | null; image: string | null; bio: string | null; articleCount: number; username?: string | null }[];
  totalFollowing: number;
  totalPages: number;
  userId: string;
  isOwner: boolean;
}) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(following);
  const [loading, setLoading] = useState(false);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  const goToPage = async (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) return;
    setLoading(true);
    try {
      const { getFollowingAction } = await import('@/features/member/actions/profile-follow');
      const result = await getFollowingAction(userId, newPage);
      if (result.success && result.data) {
        setItems(result.data);
        setPage(newPage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    if (!isOwner) return;
    setUnfollowingId(targetId);
    try {
      const { toggleFollowAction } = await import('@/features/member/actions/follow');
      const res = await toggleFollowAction(targetId);
      if (res.success && !res.isFollowing) {
        setItems(prev => prev.filter(f => f.id !== targetId));
      }
    } finally {
      setUnfollowingId(null);
    }
  };

  if (totalFollowing === 0)
    return (
      <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <UserCheck className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium tracking-tight">{isOwner ? 'Bạn chưa theo dõi tác giả nào.' : 'Chưa theo dõi ai.'}</p>
      </div>
    );

  return (
    <div>
      <div className={cn("space-y-2 transition-opacity duration-500", loading ? "opacity-50" : "opacity-100")}>
        {items.map((f, i) => (
          <Link key={f.id} href={`/profile/${f.username ?? f.id}`} style={{ animationDelay: `${i * 50}ms` }} className="group flex items-center justify-between gap-4 px-4 py-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all animate-in fade-in slide-in-from-left-2 fill-mode-both cursor-pointer">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="relative w-10 h-10 shrink-0">
               <Image src={f.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name ?? 'User')}&background=e2e8f0&color=0f172a`} fill unoptimized sizes="40px" className="rounded-full object-cover border border-zinc-200 dark:border-white/10" alt={f.name ?? ''} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white truncate">{f.name}</h3>
                {f.bio && <p className="text-xs text-zinc-500 truncate mt-0.5">{f.bio}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {isOwner && (
                <button onClick={(e) => handleUnfollow(e, f.id)} disabled={unfollowingId === f.id} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                  <UserMinus className={cn("w-4 h-4", unfollowingId === f.id && "animate-pulse")} />
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8 pt-4 border-t border-zinc-200 dark:border-white/5">
          <button onClick={() => goToPage(page - 1)} disabled={page === 1 || loading} className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary transition-colors">‹ Trước</button>
          <button onClick={() => goToPage(page + 1)} disabled={page === totalPages || loading} className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-primary transition-colors">Sau ›</button>
        </div>
      )}
    </div>
  );
}

function RatingsDashboard({ data: initialData }: { data: AuthorRatingStats | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!initialData || initialData.totalCount === 0)
    return (
      <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
        <Star className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium tracking-tight">Chưa có đánh giá nào.</p>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 text-center transition-all hover:border-primary/20">
          <p className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter">{initialData.averageScore.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={cn("w-3.5 h-3.5", i <= Math.round(initialData.averageScore) ? "text-yellow-400 fill-yellow-400" : "text-zinc-300 dark:text-zinc-800")} />
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mt-3">Điểm TB</p>
        </div>
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter">{initialData.totalCount}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mt-3">Đánh giá</p>
        </div>
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter">{initialData.totalRatedArticles}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mt-3">Bài viết</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nhận xét mới nhất</h4>
        {initialData.ratings.filter(r => r.review).slice(0, 10).map(r => (
          <div key={`${r.userId}-${r.createdAt}`} className="flex gap-4 p-5 rounded-[2rem] bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 transition-all hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
            <div className="relative w-10 h-10 shrink-0">
               <Image src={r.user.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user.name)}&size=32`} alt={r.user.name} fill unoptimized sizes="40px" className="rounded-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-bold text-zinc-800 dark:text-white">{r.user.name}</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={cn("w-3 h-3", i <= r.score ? "text-yellow-400 fill-yellow-400" : "text-zinc-200 dark:text-zinc-800")} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-slate-400 leading-relaxed font-medium italic">&ldquo;{r.review}&rdquo;</p>
              <p className="mt-3 text-[10px] font-bold text-zinc-400 tabular-nums uppercase">{mounted ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SOCIAL_LINKS = [
  { key: 'websiteUrl',   icon: Globe,     label: 'Website' },
  { key: 'facebookUrl',  icon: Facebook,  label: 'Facebook' },
  { key: 'instagramUrl', icon: Instagram, label: 'Instagram' },
  { key: 'twitterUrl',   icon: Twitter,   label: 'X' },
  { key: 'linkedinUrl',  icon: Linkedin,  label: 'LinkedIn' },
  { key: 'githubUrl',    icon: Github,    label: 'GitHub' },
  { key: 'youtubeUrl',   icon: Youtube,   label: 'YouTube' },
  { key: 'tiktokUrl',    icon: Music,     label: 'TikTok' },
] as const;

export default function ProfileClient({
  user, articles, totalArticles, totalArticlePages, bookmarks, history, drafts, followers, totalFollowers, totalFollowerPages, following, totalFollowing, totalFollowingPages, isOwner, canWrite, ratingsData
}: {
  user: { id: string; name: string | null; image: string | null; bio: string | null; createdAt: Date; avatarUrl: string; totalViews: number; totalLikes: number; username?: string | null; _count: { articles: number } };
  articles: Article[]; totalArticles: number; totalArticlePages: number; bookmarks: { articles: Bookmark[]; total: number } | null; history: HistoryItem[] | null; drafts: Draft[] | null; followers: any[]; totalFollowers: number; totalFollowerPages: number; following: any[]; totalFollowing: number; totalFollowingPages: number; isOwner: boolean; canWrite: boolean; ratingsData: AuthorRatingStats | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as Tab) || 'articles';
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab') as Tab;
    if (t && ['articles', 'drafts', 'bookmarks', 'history', 'followers', 'following', 'ratings'].includes(t)) {
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
    { key: 'articles' as Tab, icon: FileText, label: 'Bài viết', count: totalArticles, show: true },
    { key: 'drafts' as Tab, icon: PenLine, label: 'Bản nháp', count: drafts?.length ?? 0, show: isOwner && canWrite },
    { key: 'bookmarks' as Tab, icon: Bookmark, label: 'Đã lưu', count: bookmarks?.total ?? 0, show: isOwner },
    { key: 'history' as Tab, icon: History, label: 'Lịch sử', count: history?.length ?? 0, show: isOwner },
    { key: 'followers' as Tab, icon: Heart, label: 'Followers', count: totalFollowers, show: true },
    { key: 'following' as Tab, icon: UserCheck, label: 'Following', count: totalFollowing, show: true },
    { key: 'ratings' as Tab, icon: Star, label: 'Đánh giá', count: ratingsData?.totalCount ?? 0, show: isOwner && canWrite },
  ] as const).filter(t => t.show);

  return (
    <div className="flex flex-col lg:flex-row gap-8 2xl:gap-16 items-start">
      {/* 1. Sidebar */}
      <aside className="w-full lg:w-[280px] flex-shrink-0 lg:sticky lg:top-24 space-y-12 order-1">
        <div className="relative px-2 flex flex-col items-start gap-4">
          <div className="relative shrink-0">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 shadow-xl rounded-full overflow-hidden border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 group">
              <Image src={user.avatarUrl} alt={user.name ?? ''} fill unoptimized priority sizes="80px" className="object-cover rounded-full transition-transform duration-500 group-hover:scale-110" />
            </div>
            {isOwner && (
               <Link href="/settings" className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-100 dark:border-white/10 text-zinc-500 hover:text-primary transition-all duration-300 hover:scale-110" title="Cài đặt">
                  <Settings className="w-3.5 h-3.5" />
               </Link>
            )}
          </div>

          {/* Identity Info */}
          <div className="w-full flex flex-col items-start text-left py-1">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">{user.name}</h1>
            {user.username && <p className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80 mt-1">@{user.username}</p>}
            
            <div className="mt-4 space-y-8 w-full">
              {user.bio && (
                <div className="relative group">
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-slate-200 leading-relaxed font-signature font-medium italic">&ldquo;{user.bio}&rdquo;</p>
                  <div className="mt-1.5 h-0.5 w-6 bg-primary/30 rounded-full" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 text-zinc-500">
                {[
                  { label: 'Views', value: fmtViews(user.totalViews) },
                  { label: 'Likes', value: fmtViews(user.totalLikes) },
                  { label: 'Fans', value: fmtViews(totalFollowers) },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-start min-w-[40px]">
                    <span className="text-sm font-black text-zinc-800 dark:text-white leading-none tracking-tight">{s.value}</span>
                    <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <nav className="w-full space-y-1 px-2">
          {tabDefs.map(({ key, icon: Icon, label, count }) => (
            <button key={key} onClick={() => handleTabChange(key)} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300", tab === key ? "bg-primary/5 text-primary" : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-white")}>
              <div className="flex items-center gap-3">
                <Icon className={cn("w-3.5 h-3.5", tab === key ? "opacity-100" : "opacity-30")} />
                <span>{label}</span>
              </div>
              {count > 0 && <span className={cn("text-[8px] tabular-nums", tab === key ? "opacity-100" : "opacity-40")}>{count}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* 2. Main Content & Social Dock Wrapper */}
      <div className="flex-1 flex flex-col lg:flex-row items-start relative order-3 lg:order-2 h-full min-h-[600px]">
        <main className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          <div className="mb-10 flex items-center gap-6">
            <h2 className="text-lg font-black text-zinc-800 dark:text-white uppercase tracking-tight">{tabDefs.find(t => t.key === tab)?.label}</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent dark:from-white/5 dark:via-white/[0.02]" />
          </div>
          
          <div className="pb-20">
            {tab === 'articles' && <ArticleList articles={articles} totalArticles={totalArticles} totalPages={totalArticlePages} userId={user.id} />}
            {tab === 'drafts' && <DraftList drafts={drafts ?? []} />}
            {tab === 'bookmarks' && <BookmarkList bookmarks={bookmarks?.articles ?? []} />}
            {tab === 'history' && <HistoryList history={history ?? []} />}
            {tab === 'followers' && <FollowerList followers={followers} totalFollowers={totalFollowers} totalPages={totalFollowerPages} userId={user.id} />}
            {tab === 'following' && <FollowingList following={following} totalFollowing={totalFollowing} totalPages={totalFollowingPages} userId={user.id} isOwner={isOwner} />}
            {tab === 'ratings' && isOwner && canWrite && <RatingsDashboard data={ratingsData} />}
          </div>
        </main>

        {/* Right Column: Social Dock (Sticky centered on Desktop) */}
        <div className="hidden lg:block lg:sticky lg:top-1/2 lg:-translate-y-1/2 lg:ml-[50px] flex-shrink-0 w-[48px] h-fit order-3">
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
            {SOCIAL_LINKS.map(({ key, icon: Icon, label }) => {
              const url = (user as any)[key];
              if (!url) return null;
              return (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" title={label} className="group p-3 rounded-full text-zinc-400 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-100 dark:border-white/5 transition-all hover:-translate-x-1 hover:text-primary hover:border-primary/20 shadow-sm">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Mobile Horizontal Version (keep at bottom of main wrapper) */}
        <div className="lg:hidden w-full order-2 border-y border-zinc-100 dark:border-white/5 py-8 mt-12">
          <div className="flex items-center justify-center gap-4">
            {SOCIAL_LINKS.map(({ key, icon: Icon }) => {
              const url = (user as any)[key];
              if (!url) return null;
              return <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500"><Icon className="w-4 h-4" /></a>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
