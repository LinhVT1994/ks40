'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AdminPagination from './AdminPagination';
import CommentFiltersBar from './CommentFiltersBar';
import CommentTable from './CommentTable';
import CommentDetailModal from './CommentDetailModal';
import type { Comment, CommentStatus } from '@/features/admin/data/comments';
import type { AdminComment } from '@/features/admin/actions/comment';
import { updateCommentStatusAction, deleteAdminCommentAction } from '@/features/admin/actions/comment';
import { CommentStatus as PrismaCommentStatus } from '@prisma/client';
import { MoreVertical, ExternalLink, Eye, EyeOff, ShieldAlert, Trash2, MessageSquarePlus, ChevronDown } from 'lucide-react';

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

  // Context Menu state
  const [menu, setMenu] = useState<{ x: number; y: number; visible: boolean; comment: Comment | null }>({
    x: 0, y: 0, visible: false, comment: null
  });
  const [replyingId, setReplyingId] = useState<string | null>(null);

  // Sync khi server trả về data mới
  useEffect(() => {
    setLocalComments(initialComments.map(toComment));
  }, [initialComments]);

  // Close menu on click outside or scroll
  useEffect(() => {
    const handleClose = () => setMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, comment: Comment) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, visible: true, comment });
  };

  const handleMoreClick = (e: React.MouseEvent, comment: Comment) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ x: rect.left - 160, y: rect.bottom + 8, visible: true, comment });
  };

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
    if (selectedComment?.id === id) setSelectedComment(prev => prev ? { ...prev, status: next } : null);
    startTransition(async () => { await updateCommentStatusAction(id, STATUS_UP_MAP[next]); });
  };

  const handleMarkSpam = (id: string) => {
    setLocalComments(prev => prev.map(c => c.id === id ? { ...c, status: 'spam' } : c));
    if (selectedComment?.id === id) setSelectedComment(prev => prev ? { ...prev, status: 'spam' } : null);
    startTransition(async () => { await updateCommentStatusAction(id, PrismaCommentStatus.SPAM); });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    setLocalComments(prev => prev.filter(c => c.id !== id));
    if (selectedComment?.id === id) setSelectedComment(null);
    startTransition(async () => { await deleteAdminCommentAction(id); });
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white font-display">Quản lý bình luận</h1>
        <p className="text-sm text-zinc-500 mt-1">Quản lý bình luận trong hệ thống</p>
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
        isPending={isPending}
      />

      <div className={`transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <CommentTable
          comments={localComments}
          onView={setSelectedComment}
          onToggleStatus={handleToggleStatus}
          onMarkSpam={handleMarkSpam}
          onDelete={handleDelete}
          onMoreClick={handleMoreClick}
          onContextMenu={handleContextMenu}
          replyingId={replyingId}
          onReplyingIdChange={setReplyingId}
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

      {/* Context Menu */}
      {menu.visible && menu.comment && (
        <div 
          style={{ top: menu.y, left: menu.x }}
          className="fixed z-[120] w-52 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-0.5">
            <Link href={`/article/${menu.comment.article.slug}`} target="_blank" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
              <ExternalLink className="w-4 h-4" /> Xem bài viết
            </Link>
            <button onClick={() => { setSelectedComment(menu.comment); setMenu({ ...menu, visible: false }); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
              <Eye className="w-4 h-4" /> Xem chi tiết
            </button>
            <button onClick={() => { setReplyingId(menu.comment!.id); setMenu({ ...menu, visible: false }); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
              <MessageSquarePlus className="w-4 h-4" /> Phản hồi nhanh
            </button>
            
            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
            
            <div className="relative group/sub">
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors">
                <div className="flex items-center gap-2.5">
                  {menu.comment.status === 'visible' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  Trạng thái
                </div>
                <ChevronDown className="w-3 h-3 -rotate-90" />
              </button>
              <div className="absolute left-full top-0 pl-1 opacity-0 scale-95 pointer-events-none group-hover/sub:opacity-100 group-hover/sub:scale-100 group-hover/sub:pointer-events-auto transition-all z-[130] duration-200">
                <div className="absolute left-0 top-0 bottom-0 w-4 -ml-2" />
                <div className="w-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-zinc-300 dark:border-white/10 rounded-2xl shadow-2xl p-1">
                  <button
                    onClick={() => { handleToggleStatus(menu.comment!.id, menu.comment!.status); setMenu({ ...menu, visible: false }); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary transition-colors`}
                  >
                    {menu.comment.status === 'visible' ? 'Ẩn bình luận' : 'Hiện bình luận'}
                  </button>
                  <button
                    onClick={() => { handleMarkSpam(menu.comment!.id); setMenu({ ...menu, visible: false }); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-amber-500/10 hover:text-amber-500 transition-colors ${menu.comment.status === 'spam' ? 'text-amber-500 bg-amber-500/5' : 'text-zinc-500'}`}
                  >
                    Đánh dấu Spam
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px border-t border-dashed border-zinc-300 dark:border-white/10 my-1 ml-3 mr-3" />
            <button
              onClick={() => { handleDelete(menu.comment!.id); setMenu({ ...menu, visible: false }); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Xóa bình luận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
