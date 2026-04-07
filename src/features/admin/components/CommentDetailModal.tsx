"use client";

import React, { useEffect } from 'react';
import { X, Eye, EyeOff, ShieldAlert, Trash2, ThumbsUp, MessageSquare, Calendar } from 'lucide-react';
import { Comment, CommentStatus } from '@/features/admin/data/comments';
import CommentStatusBadge from './CommentStatusBadge';

interface Props {
  comment: Comment | null;
  onClose: () => void;
  onToggleStatus: (id: string, current: CommentStatus) => void;
  onMarkSpam: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CommentDetailModal({ comment, onClose, onToggleStatus, onMarkSpam, onDelete }: Props) {
  useEffect(() => {
    if (!comment) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [comment, onClose]);

  if (!comment) return null;

  const handleDelete = () => {
    onDelete(comment.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-white/10 shrink-0"
              style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=e2e8f0&color=0f172a&size=80')` }}
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{comment.author.name}</p>
              <p className="text-xs text-slate-400">{comment.author.email}</p>
            </div>
            <CommentStatusBadge status={comment.status} />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Content */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nội dung bình luận</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {comment.content}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <ThumbsUp className="w-3.5 h-3.5" /> {comment.likes} lượt thích
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <MessageSquare className="w-3.5 h-3.5" /> {comment.replies} phản hồi
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar className="w-3.5 h-3.5" /> {formatFullDate(comment.createdAt)}
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-white/5" />

          {/* Article context */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bài viết liên quan</p>
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <p className="text-sm font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors leading-snug">
                {comment.article.title}
              </p>
              <p className="text-xs text-slate-400 mt-1">/{comment.article.slug}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] rounded-b-2xl">
          <button
            onClick={() => { onToggleStatus(comment.id, comment.status); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-colors"
          >
            {comment.status === 'visible' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {comment.status === 'visible' ? 'Ẩn bình luận' : 'Hiện bình luận'}
          </button>
          <button
            onClick={() => { onMarkSpam(comment.id); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Đánh dấu spam
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
