import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldAlert, Trash2, MessageSquareOff, MessageSquarePlus, Send, X, Check, Loader2, MoreVertical } from 'lucide-react';
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
  onMoreClick: (e: React.MouseEvent, c: Comment) => void;
  onContextMenu: (e: React.MouseEvent, c: Comment) => void;
  replyingId: string | null;
  onReplyingIdChange: (id: string | null) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative inline-flex group/tip">
      {children}
      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] font-bold text-white bg-zinc-800 rounded-lg whitespace-nowrap opacity-0 scale-95 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:scale-100 transition-all duration-150 z-30 shadow-xl border border-white/10">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[4px] border-transparent border-t-zinc-800" />
      </div>
    </div>
  );
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
    <div className="px-6 pb-4 -mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquarePlus className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">Phản hồi nhanh</span>
          <button onClick={onClose} className="ml-auto p-0.5 rounded text-zinc-500 hover:text-zinc-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Nhập phản hồi của bạn..."
          rows={2}
          autoFocus
          disabled={isPending || sent}
          className="w-full text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/25 resize-none placeholder:text-zinc-500 dark:text-white disabled:opacity-50 transition-all"
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend(); }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">Ctrl+Enter để gửi</span>
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
  comments, onView, onToggleStatus, onMarkSpam, onDelete, onMoreClick, onContextMenu,
  replyingId, onReplyingIdChange
}: Props) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm relative flex flex-col min-w-[900px]">
      {/* Header */}
      <div className="grid grid-cols-[180px_4fr_40px_2fr_100px_80px] gap-x-4 px-6 py-3 border-b border-zinc-200 dark:border-white/5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-slate-200 bg-zinc-50/90 dark:bg-slate-900/90 backdrop-blur-md rounded-t-2xl sticky top-[65px] md:top-[73px] z-20">
        <div className="">Người dùng</div>
        <div className="">Nội dung</div>
        <div className="text-center">&nbsp;</div>
        <div className="">Bài viết</div>
        <div className="">Thời gian</div>
        <div className="text-center">Trạng thái</div>
      </div>

      {/* Body */}
      <div className="divide-y divide-zinc-200 dark:divide-white/5 overflow-hidden">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
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
                <div 
                  onContextMenu={(e) => onContextMenu(e, comment)}
                  className={`relative grid grid-cols-[180px_4fr_40px_2fr_100px_80px] gap-x-4 items-center px-6 py-4 transition-colors group cursor-default ${isReplying ? 'bg-primary/[0.02]' : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'}`}
                >
                  {/* Author */}
                  <div className="flex items-center gap-3 pr-3 min-w-0">
                    <Avatar src={null} name={comment.author.name} size={32} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-800 dark:text-white truncate group-hover:text-primary transition-colors">
                        {comment.author.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-slate-300 truncate">{comment.author.email}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pr-4 min-w-0">
                    <p className="text-sm text-zinc-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-slate-300">👍 {comment.likes}</span>
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-slate-300">💬 {comment.replies}</span>
                    </div>
                  </div>

                  {/* Actions — button, floats on hover */}
                  <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip label="Thao tác nhanh">
                      <button 
                        onClick={(e) => onMoreClick(e, comment)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 hover:text-primary transition-all cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>

                  {/* Article */}
                  <div className="pr-4 min-w-0">
                    <Link
                      href={`/article/${comment.article.slug}`}
                      target="_blank"
                      className="text-sm text-primary hover:text-primary/100 transition-colors truncate font-bold block"
                    >
                      {comment.article.title}
                    </Link>
                  </div>

                  {/* Date */}
                  <div className="">
                    <p className="text-[11px] font-bold text-zinc-500 dark:text-slate-300">{date}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-slate-400">{time}</p>
                  </div>

                  {/* Status */}
                  <div className="text-center">
                    <CommentStatusBadge status={comment.status} />
                  </div>
                </div>

                {/* Quick Reply Inline Box */}
                {isReplying && (
                  <QuickReplyBox
                    commentId={comment.id}
                    onClose={() => onReplyingIdChange(null)}
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
