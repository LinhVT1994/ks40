'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AdminPagination from './AdminPagination';
import CommentFiltersBar from './CommentFiltersBar';
import CommentTable from './CommentTable';
import CommentDetailModal from './CommentDetailModal';
import type { Comment, CommentStatus } from '@/features/admin/data/comments';
import type { AdminComment } from '@/features/admin/actions/comment';
import { updateCommentStatusAction, deleteAdminCommentAction } from '@/features/admin/actions/comment';
import { CommentStatus as PrismaCommentStatus } from '@prisma/client';

type FilterStatus = CommentStatus | 'all';

function toComment(c: AdminComment): Comment {
  const statusMap: Record<PrismaCommentStatus, CommentStatus> = {
    VISIBLE: 'visible',
    HIDDEN:  'hidden',
    SPAM:    'spam',
  };
  return {
    id:        c.id,
    content:   c.content,
    status:    statusMap[c.status],
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    author:    { name: c.author.name, email: c.author.email },
    article:   { id: c.article.id, title: c.article.title, slug: c.article.slug },
    likes:     0,
    replies:   c._count.replies,
  };
}

const STATUS_UP_MAP: Record<'visible' | 'hidden' | 'spam', PrismaCommentStatus> = {
  visible: PrismaCommentStatus.VISIBLE,
  hidden:  PrismaCommentStatus.HIDDEN,
  spam:    PrismaCommentStatus.SPAM,
};

export default function CommentsClient({
  comments: initialComments,
  total,
  totalPages,
  currentPage,
  currentSort,
  counts,
}: {
  comments: AdminComment[];
  total: number;
  totalPages: number;
  currentPage: number;
  currentSort: 'newest' | 'oldest';
  counts: { all: number; visible: number; hidden: number; spam: number };
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localComments, setLocalComments] = useState<Comment[]>(initialComments.map(toComment));
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Sync khi server trả về data mới
  useEffect(() => {
    setLocalComments(initialComments.map(toComment));
  }, [initialComments]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  const activeStatus = (searchParams.get('status')?.toLowerCase() ?? 'all') as FilterStatus;

  const handleStatusChange = (v: FilterStatus) => {
    if (v === 'all') updateParam('status', '');
    else updateParam('status', v.toUpperCase());
  };

  const handleSortChange = (v: 'newest' | 'oldest') => updateParam('sort', v === 'newest' ? '' : v);

  const handleToggleStatus = (id: string, current: CommentStatus) => {
    const next: CommentStatus = current === 'visible' ? 'hidden' : 'visible';
    setLocalComments(prev => prev.map(c => c.id === id ? { ...c, status: next } : c));
    setSelectedComment(prev => prev?.id === id ? { ...prev, status: next } : prev);
    startTransition(async () => { await updateCommentStatusAction(id, STATUS_UP_MAP[next]); });
  };

  const handleMarkSpam = (id: string) => {
    setLocalComments(prev => prev.map(c => c.id === id ? { ...c, status: 'spam' } : c));
    setSelectedComment(prev => prev?.id === id ? { ...prev, status: 'spam' } : prev);
    startTransition(async () => { await updateCommentStatusAction(id, PrismaCommentStatus.SPAM); });
  };

  const handleDelete = (id: string) => {
    setLocalComments(prev => prev.filter(c => c.id !== id));
    if (selectedComment?.id === id) setSelectedComment(null);
    startTransition(async () => { await deleteAdminCommentAction(id); });
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Quản lý Bình luận</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý bình luận trong hệ thống</p>
      </div>

      <CommentFiltersBar
        search={searchParams.get('search') ?? ''}
        onSearchChange={v => updateParam('search', v)}
        activeStatus={activeStatus}
        onStatusChange={handleStatusChange}
        activeSort={currentSort}
        onSortChange={handleSortChange}
        counts={counts}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(v => !v)}
      />

      <div className={`transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <CommentTable
          comments={localComments}
          onView={setSelectedComment}
          onToggleStatus={handleToggleStatus}
          onMarkSpam={handleMarkSpam}
          onDelete={handleDelete}
        />
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        label="bình luận"
        onPageChange={p => updateParam('page', String(p))}
      />

      <CommentDetailModal
        comment={selectedComment}
        onClose={() => setSelectedComment(null)}
        onToggleStatus={handleToggleStatus}
        onMarkSpam={handleMarkSpam}
        onDelete={handleDelete}
      />
    </div>
  );
}
