'use client';

import { useState, useTransition, useMemo } from 'react';
import { MessageCircle, Send, User, Reply, Trash2, ArrowDownUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { createCommentAction, deleteCommentAction, toggleCommentLikeAction, getRepliesAction, type CommentWithAuthor } from '@/features/articles/actions/comment';
import { useSession } from 'next-auth/react';
import AvatarImg from '@/components/shared/Avatar';

type SortOption = 'newest' | 'oldest' | 'mine';

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function Avatar({ image, name }: { image?: string | null; name: string }) {
  return <AvatarImg src={image} name={name} size={40} className="shrink-0" />;
}

export default function ArticleComments({
  articleId,
  initialComments,
}: {
  articleId: string;
  initialComments: CommentWithAuthor[];
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [comments,      setComments]      = useState(initialComments);
  const [text,          setText]          = useState('');
  const [replyTo,       setReplyTo]       = useState<{ topLevelId: string; name: string } | null>(null);
  const [replyText,     setReplyText]     = useState('');
  const [sort,          setSort]          = useState<SortOption>('newest');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [isPending,     startTransition]  = useTransition();

  const toggleReplies = async (commentId: string) => {
    const isExpanded = expandedReplies.has(commentId);
    if (isExpanded) {
      setExpandedReplies(prev => { const next = new Set(prev); next.delete(commentId); return next; });
      return;
    }
    const comment = comments.find(c => c.id === commentId);
    if (comment && !comment.repliesLoaded) {
      const replies = await getRepliesAction(commentId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies, repliesLoaded: true } : c));
    }
    setExpandedReplies(prev => new Set(prev).add(commentId));
  };

  const filtered = useMemo(() => {
    let list = [...comments];
    if (sort === 'oldest') list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sort === 'mine') list = list.filter(c => c.author.id === userId);
    return list;
  }, [comments, sort, userId]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      const result = await createCommentAction(articleId, text);
      if (result.success && result.comment) {
        setText('');
        setComments(prev => [result.comment!, ...prev]);
      }
    });
  };

  const handleReply = () => {
    if (!replyText.trim() || !replyTo) return;
    const { topLevelId } = replyTo;
    startTransition(async () => {
      const content = `@${replyTo.name} ${replyText.trim()}`;
      const result = await createCommentAction(articleId, content, topLevelId);
      if (result.success && result.comment) {
        setReplyText('');
        setReplyTo(null);
        setComments(prev => prev.map(c =>
          c.id === topLevelId ? { ...c, replies: [...c.replies, result.comment!], replyCount: c.replyCount + 1, repliesLoaded: true } : c,
        ));
      }
    });
  };

  const handleLike = (commentId: string, parentId: string | null, type: 'LIKE' | 'DISLIKE') => {
    startTransition(async () => {
      const result = await toggleCommentLikeAction(commentId, type);
      if (!result.success) return;
      const update = (c: CommentWithAuthor) => c.id === commentId
        ? { ...c, likeCount: result.likeCount, dislikeCount: result.dislikeCount, isLiked: result.isLiked, isDisliked: result.isDisliked }
        : c;
      if (!parentId) {
        setComments(prev => prev.map(update));
      } else {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: c.replies.map(update) } : c,
        ));
      }
    });
  };

  const handleDelete = (commentId: string, parentId: string | null) => {
    startTransition(async () => {
      const result = await deleteCommentAction(commentId);
      if (result.success) {
        if (!parentId) {
          setComments(prev => prev.filter(c => c.id !== commentId));
        } else {
          setComments(prev => prev.map(c =>
            c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c,
          ));
        }
      }
    });
  };

  return (
    <div className="mt-20 border-t border-slate-100 dark:border-white/5 pt-12">
      <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Bình luận</h2>
            <p className="text-sm text-slate-500">{comments.length} bình luận</p>
          </div>
        </div>

        {comments.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-400 ml-2 shrink-0" />
            {([
              ['newest', 'Mới nhất'],
              ['oldest', 'Cũ nhất'],
              ...(userId ? [['mine', 'Của tôi']] : []),
            ] as [SortOption, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sort === key
                    ? 'bg-white dark:bg-white/10 text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      {session ? (
        <div className="flex gap-4 mb-12">
          <Avatar image={session.user?.image} name={session.user?.name ?? ''} />
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              disabled={isPending}
              className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-4 pr-14 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[100px] resize-none text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || isPending}
              className={`absolute bottom-3 right-3 p-2 rounded-xl transition-all ${
                text.trim() ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95' : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mb-12 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <a href="/login" className="text-primary font-semibold hover:underline">Đăng nhập</a> để bình luận.
        </p>
      )}

      {/* Comments */}
      <div className="space-y-8">
        {filtered.map(c => (
          <div key={c.id}>
            <div className="flex gap-4">
              <Avatar image={c.author.image} name={c.author.name} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{c.author.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{timeAgo(c.createdAt)}</span>
                    {userId === c.author.id && (
                      <button onClick={() => handleDelete(c.id, null)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed mb-3">{c.content}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(c.id, null, 'LIKE')}
                    disabled={!session || isPending}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                      c.isLiked ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'
                    } disabled:cursor-default`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 transition-all ${c.isLiked ? 'fill-emerald-500' : ''}`} />
                    {c.likeCount > 0 && <span>{c.likeCount}</span>}
                  </button>
                  <button
                    onClick={() => handleLike(c.id, null, 'DISLIKE')}
                    disabled={!session || isPending}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                      c.isDisliked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                    } disabled:cursor-default`}
                  >
                    <ThumbsDown className={`w-3.5 h-3.5 transition-all ${c.isDisliked ? 'fill-rose-500' : ''}`} />
                    {c.dislikeCount > 0 && <span>{c.dislikeCount}</span>}
                  </button>
                  {session && (
                    <button
                      onClick={() => {
                      setReplyTo(replyTo?.topLevelId === c.id && !replyTo?.name ? null : { topLevelId: c.id, name: c.author.name });
                      setExpandedReplies(prev => new Set(prev).add(c.id));
                    }}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-all text-xs font-semibold"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Trả lời
                    </button>
                  )}
                </div>

                {/* Replies toggle */}
                {c.replyCount > 0 && (
                  <button
                    onClick={() => toggleReplies(c.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-primary transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    {expandedReplies.has(c.id) ? 'Ẩn trả lời' : `${c.replyCount} trả lời`}
                  </button>
                )}

                {/* Replies + reply input */}
                {(expandedReplies.has(c.id) || replyTo?.topLevelId === c.id) && (
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-slate-100 dark:border-white/5">
                    {expandedReplies.has(c.id) && c.replies.map(r => (
                      <div key={r.id} className="flex gap-3">
                        <Avatar image={r.author.image} name={r.author.name} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{r.author.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">{timeAgo(r.createdAt)}</span>
                              {userId === r.author.id && (
                                <button onClick={() => handleDelete(r.id, c.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[14px] leading-relaxed mb-2">
                            {r.content.startsWith('@') ? (() => {
                              const spaceIdx = r.content.indexOf(' ');
                              const mention = spaceIdx > 0 ? r.content.slice(0, spaceIdx) : r.content;
                              const rest = spaceIdx > 0 ? r.content.slice(spaceIdx + 1) : '';
                              return <><span className="text-primary font-semibold">{mention}</span>{rest ? ` ${rest}` : ''}</>;
                            })() : r.content}
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLike(r.id, c.id, 'LIKE')}
                              disabled={!session || isPending}
                              className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                                r.isLiked ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'
                              } disabled:cursor-default`}
                            >
                              <ThumbsUp className={`w-3 h-3 transition-all ${r.isLiked ? 'fill-emerald-500' : ''}`} />
                              {r.likeCount > 0 && <span>{r.likeCount}</span>}
                            </button>
                            <button
                              onClick={() => handleLike(r.id, c.id, 'DISLIKE')}
                              disabled={!session || isPending}
                              className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                                r.isDisliked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                              } disabled:cursor-default`}
                            >
                              <ThumbsDown className={`w-3 h-3 transition-all ${r.isDisliked ? 'fill-rose-500' : ''}`} />
                              {r.dislikeCount > 0 && <span>{r.dislikeCount}</span>}
                            </button>
                            {session && (
                              <button
                                onClick={() => setReplyTo(
                                  replyTo?.topLevelId === c.id && replyTo?.name === r.author.name
                                    ? null
                                    : { topLevelId: c.id, name: r.author.name }
                                )}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-all text-xs font-semibold"
                              >
                                <Reply className="w-3 h-3" />
                                Trả lời
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Reply input — always at bottom of replies */}
                    {replyTo?.topLevelId === c.id && (
                      <div className="flex gap-3 pt-1">
                        <Avatar image={session?.user?.image} name={session?.user?.name ?? ''} />
                        <div className="flex-1 relative">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder={`Trả lời ${replyTo.name}...`}
                            disabled={isPending}
                            autoFocus
                            className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 pr-12 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[80px] resize-none text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60"
                          />
                          <button
                            onClick={handleReply}
                            disabled={!replyText.trim() || isPending}
                            className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-all ${
                              replyText.trim() ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && sort === 'mine' && comments.length > 0 && (
        <div className="py-12 text-center text-slate-400">
          <User className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Bạn chưa có bình luận nào.</p>
        </div>
      )}

      {comments.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        </div>
      )}
    </div>
  );
}
