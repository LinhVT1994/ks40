"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldAlert, Trash2, MessageSquareOff, MessageSquarePlus, Send, X, Check, Loader2 } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';

import { Comment, CommentStatus } from '@/features/admin/data/comments';
import CommentStatusBadge from './CommentStatusBadge';
import { replyAdminCommentAction } from '@/features/admin/actions/comment';

interface Props {
  comments: Comment[];
  onView: (c: Comment) => void;
  onToggleStatus: (id: string, current: CommentStatus) => void;
  onMarkSpam: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

// ── Inline quick-reply box ────────────────────────────────────────────────────
function QuickReplyBox({ commentId, onClose }: { commentId: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    if (!text.trim() || isPending) return;
    startTransition(async () => {
      await replyAdminCommentAction(commentId, text.trim());
      setSent(true);
      setTimeout(onClose, 1200);
    });
  };

  return (
    <div className="col-span-12 px-6 pb-4 -mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquarePlus className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">Phản hồi nhanh</span>
          <button onClick={onClose} className="ml-auto p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Nhập phản hồi của bạn..."
          rows={2}
          disabled={isPending || sent}
          className="w-full text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/25 resize-none placeholder:text-slate-400 dark:text-white disabled:opacity-50 transition-all"
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend(); }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Ctrl+Enter để gửi</span>
          <button
            onClick={handleSend}
            disabled={!text.trim() || isPending || sent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            {sent
              ? <><Check className="w-3.5 h-3.5" />Đã gửi!</>
              : isPending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Đang gửi…</>
              : <><Send className="w-3.5 h-3.5" />Gửi phản hồi</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommentTable({
  comments, onView, onToggleStatus, onMarkSpam, onDelete,
}: Props) {
  const [replyingId, setReplyingId] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm relative flex flex-col min-w-[800px]">
      {/* Header */}
      <div className="grid grid-cols-12 px-6 py-3 border-b border-slate-100 dark:border-white/5 text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md rounded-t-2xl sticky top-[65px] md:top-[73px] z-20">
        <div className="col-span-3">Người dùng</div>
        <div className="col-span-4">Nội dung</div>
        <div className="col-span-3">Bài viết</div>
        <div className="col-span-1">Thời gian</div>
        <div className="col-span-1 text-center">Trạng thái</div>
      </div>

      {/* Body */}
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <MessageSquareOff className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Không tìm thấy bình luận nào</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          comments.map(comment => {
            const { date, time } = formatDate(comment.createdAt);
            const isReplying = replyingId === comment.id;
            return (
              <React.Fragment key={comment.id}>
                <div className={`relative grid grid-cols-12 items-center px-6 py-4 transition-colors group ${isReplying ? 'bg-primary/[0.02]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}>
                  {/* Author */}
                  <div className="col-span-3 flex items-center gap-3 pr-3">
                    <Avatar src={null} name={comment.author.name} size={32} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {comment.author.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{comment.author.email}</p>
                    </div>
                  </div>

                  {/* Actions — absolute, floats on hover */}
                  <div className="absolute left-1/4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/10 shadow-md px-1 py-0.5 z-10">
                    <button
                      onClick={() => setReplyingId(isReplying ? null : comment.id)}
                      className={`p-1.5 rounded-lg transition-colors ${isReplying ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10 text-slate-400 hover:text-primary'}`}
                      title="Phản hồi nhanh"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onView(comment)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(comment.id, comment.status)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title={comment.status === 'visible' ? 'Ẩn bình luận' : 'Hiện bình luận'}
                    >
                      {comment.status === 'visible' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onMarkSpam(comment.id)}
                      className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition-colors"
                      title="Đánh dấu spam"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Xóa bình luận"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="col-span-4 pr-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-slate-400">👍 {comment.likes}</span>
                      <span className="text-[11px] text-slate-400">💬 {comment.replies}</span>
                    </div>
                  </div>

                  {/* Article */}
                  <div className="col-span-3 pr-4">
                    <Link
                      href={`/article/${comment.article.slug}`}
                      target="_blank"
                      className="text-sm text-primary hover:text-primary/80 transition-colors truncate font-medium block"
                    >
                      {comment.article.title}
                    </Link>
                  </div>

                  {/* Date */}
                  <div className="col-span-1">
                    <p className="text-[11px] text-slate-500">{date}</p>
                    <p className="text-[11px] text-slate-400">{time}</p>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 text-center">
                    <CommentStatusBadge status={comment.status} />
                  </div>

                  {/* Actions placeholder removed — rendered absolutely above */}
                </div>

                {/* Quick Reply Inline Box */}
                {isReplying && (
                  <QuickReplyBox
                    commentId={comment.id}
                    onClose={() => setReplyingId(null)}
                  />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

    </div>
  );
}
