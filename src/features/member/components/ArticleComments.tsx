'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition, useMemo, useRef } from 'react';
import { MessageCircle, Send, User, Reply, Trash2, ArrowDownUp, ThumbsUp, ThumbsDown, ImagePlus, X } from 'lucide-react';
import { createCommentAction, deleteCommentAction, toggleCommentLikeAction, getRepliesAction, type CommentWithAuthor } from '@/features/articles/actions/comment';
import { useSession } from 'next-auth/react';
import AvatarImg from '@/components/shared/Avatar';
import { toast } from 'sonner';
import { compressImage } from '@/lib/compress-image';

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB raw; compressed before upload

async function uploadCommentImage(file: File): Promise<string> {
  const blob = await compressImage(file, 1280, 1280, 0.82);
  const ext  = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const compressed = new File([blob], `comment.${ext}`, { type: blob.type });

  const fd = new FormData();
  fd.append('file', compressed);
  const res = await fetch('/api/upload/comment-image', { method: 'POST', body: fd });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'Upload lỗi' }));
    throw new Error(error ?? 'Upload lỗi');
  }
  const { url } = await res.json();
  return url as string;
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useState(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="max-w-[95vw] max-h-[95vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

function CommentImages({ images, onImageClick }: { images: string[]; onImageClick: (src: string) => void }) {
  if (!images || images.length === 0) return null;
  return (
    <div className={`mb-3 grid gap-2 ${images.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2 max-w-md'}`}>
      {images.map((src, i) => (
        <button 
          key={i} 
          onClick={() => onImageClick(src)}
          className="block relative aspect-video group/img cursor-zoom-in overflow-hidden rounded-xl border border-zinc-200 dark:border-white/5"
        >
          <Image
            src={src}
            alt={`Ảnh ${i + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="w-full h-auto max-h-64 object-cover transition-transform duration-500 group-hover/img:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
        </button>
      ))}
    </div>
  );
}

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

function Avatar({ image, name, username, id, isSelf }: { image?: string | null; name: string; username?: string | null; id?: string; isSelf?: boolean }) {
  const content = <AvatarImg src={image} name={name} size={40} className="shrink-0" />;
  if (isSelf) return content;
  return (
    <Link href={`/@${username || id}`} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  );
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
  const [lightbox,      setLightbox]      = useState<string | null>(null);
  const [replyTo,       setReplyTo]       = useState<{ topLevelId: string; name: string } | null>(null);
  const [replyText,     setReplyText]     = useState('');
  const [sort,          setSort]          = useState<SortOption>('newest');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [isPending,     startTransition]  = useTransition();

  // Image attachment state
  const [files,     setFiles]     = useState<File[]>([]);
  const [previews,  setPreviews]  = useState<string[]>([]);
  const [replyFiles,    setReplyFiles]    = useState<File[]>([]);
  const [replyPreviews, setReplyPreviews] = useState<string[]>([]);
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const replyFileInputRef  = useRef<HTMLInputElement>(null);

  const validateFiles = (picked: File[], existingCount: number): File[] => {
    const remaining = MAX_IMAGES - existingCount;
    if (remaining <= 0) {
      toast.error(`Tối đa ${MAX_IMAGES} ảnh / bình luận`);
      return [];
    }
    const accepted: File[] = [];
    for (const f of picked.slice(0, remaining)) {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name}: không phải ảnh`); continue; }
      if (f.size > MAX_IMAGE_SIZE)      { toast.error(`${f.name}: quá 10MB`); continue; }
      accepted.push(f);
    }
    return accepted;
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const ok = validateFiles(picked, files.length);
    if (ok.length) {
      setFiles(prev => [...prev, ...ok]);
      setPreviews(prev => [...prev, ...ok.map(f => URL.createObjectURL(f))]);
    }
    e.target.value = '';
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles(prev    => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleReplyFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const ok = validateFiles(picked, replyFiles.length);
    if (ok.length) {
      setReplyFiles(prev    => [...prev, ...ok]);
      setReplyPreviews(prev => [...prev, ...ok.map(f => URL.createObjectURL(f))]);
    }
    e.target.value = '';
  };

  const removeReplyFile = (i: number) => {
    URL.revokeObjectURL(replyPreviews[i]);
    setReplyFiles(prev    => prev.filter((_, idx) => idx !== i));
    setReplyPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const resetReplyAttachments = () => {
    replyPreviews.forEach(URL.revokeObjectURL);
    setReplyFiles([]);
    setReplyPreviews([]);
  };

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
    if (!text.trim() && files.length === 0) return;
    startTransition(async () => {
      try {
        const urls = files.length
          ? await Promise.all(files.map(uploadCommentImage))
          : [];
        const result = await createCommentAction(articleId, text, undefined, urls);
        if (result.success && result.comment) {
          setText('');
          previews.forEach(URL.revokeObjectURL);
          setFiles([]);
          setPreviews([]);
          setComments(prev => [result.comment!, ...prev]);
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Đăng bình luận thất bại');
      }
    });
  };

  const handleReply = () => {
    if ((!replyText.trim() && replyFiles.length === 0) || !replyTo) return;
    const { topLevelId } = replyTo;
    startTransition(async () => {
      try {
        const urls = replyFiles.length
          ? await Promise.all(replyFiles.map(uploadCommentImage))
          : [];
        const content = replyText.trim() ? `@${replyTo.name} ${replyText.trim()}` : `@${replyTo.name}`;
        const result = await createCommentAction(articleId, content, topLevelId, urls);
        if (result.success && result.comment) {
          setReplyText('');
          setReplyTo(null);
          resetReplyAttachments();
          setComments(prev => prev.map(c =>
            c.id === topLevelId ? { ...c, replies: [...c.replies, result.comment!], replyCount: c.replyCount + 1, repliesLoaded: true } : c,
          ));
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Trả lời thất bại');
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
    <div className="mt-20 border-t border-zinc-200 dark:border-white/5 pt-12">
      {lightbox && <ImageLightbox src={lightbox} alt="Ảnh phóng to" onClose={() => setLightbox(null)} />}
      <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-white font-display">Bình luận</h2>
            <p className="text-sm text-zinc-500">{comments.length} bình luận</p>
          </div>
        </div>

        {comments.length > 0 && (
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl">
            <ArrowDownUp className="w-3.5 h-3.5 text-zinc-500 ml-2 shrink-0" />
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
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-slate-300'
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
          <Avatar image={session.user?.image} name={session.user?.name ?? ''} isSelf />
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              disabled={isPending}
              className="w-full bg-white dark:bg-white/[0.02] border border-zinc-300 dark:border-white/10 rounded-2xl p-4 pr-24 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[100px] resize-none text-zinc-800 dark:text-white placeholder:text-zinc-500 disabled:opacity-60"
            />
            {previews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative group w-20 h-20">
                    <Image src={src} alt="" fill sizes="80px" className="object-cover rounded-lg border border-zinc-200 dark:border-white/10" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-zinc-900/80 text-white opacity-0 group-hover:opacity-100 transition z-10"
                      aria-label="Xoá ảnh"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={handleFilePick}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending || files.length >= MAX_IMAGES}
              className="absolute bottom-3 right-14 p-2 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-40"
              title={`Đính kèm ảnh (tối đa ${MAX_IMAGES})`}
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={(!text.trim() && files.length === 0) || isPending}
              className={`absolute bottom-3 right-3 p-2 rounded-xl transition-all ${
                (text.trim() || files.length > 0) ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 mb-12 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
          <a href="/login" className="text-primary font-semibold hover:underline">Đăng nhập</a> để bình luận.
        </p>
      )}

      {/* Comments */}
      <div className="space-y-8">
        {filtered.map(c => (
          <div key={c.id}>
            <div className="flex gap-4">
              <Avatar image={c.author.image} name={c.author.name} username={c.author.username} id={c.author.id} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/@${c.author.username || c.author.id}`} className="font-bold text-sm text-zinc-800 dark:text-white hover:text-primary transition-colors">
                    {c.author.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500" suppressHydrationWarning>{timeAgo(c.createdAt)}</span>
                    {userId === c.author.id && (
                      <button onClick={() => handleDelete(c.id, null)} className="text-zinc-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {c.content && <p className="text-zinc-600 dark:text-slate-300 text-[15px] leading-relaxed mb-3">{c.content}</p>}
                <CommentImages images={c.images} onImageClick={setLightbox} />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(c.id, null, 'LIKE')}
                    disabled={!session || isPending}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                      c.isLiked ? 'text-emerald-500' : 'text-zinc-500 hover:text-emerald-500'
                    } disabled:cursor-default`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 transition-all ${c.isLiked ? 'fill-emerald-500' : ''}`} />
                    {c.likeCount > 0 && <span>{c.likeCount}</span>}
                  </button>
                  <button
                    onClick={() => handleLike(c.id, null, 'DISLIKE')}
                    disabled={!session || isPending}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                      c.isDisliked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'
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
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-primary transition-all text-xs font-semibold"
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
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-primary transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    {expandedReplies.has(c.id) ? 'Ẩn trả lời' : `${c.replyCount} trả lời`}
                  </button>
                )}

                {/* Replies + reply input */}
                {(expandedReplies.has(c.id) || replyTo?.topLevelId === c.id) && (
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-zinc-200 dark:border-white/5">
                    {expandedReplies.has(c.id) && c.replies.map(r => (
                      <div key={r.id} className="flex gap-3">
                        <Avatar image={r.author.image} name={r.author.name} username={r.author.username} id={r.author.id} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <Link href={`/@${r.author.username || r.author.id}`} className="font-bold text-sm text-zinc-800 dark:text-white hover:text-primary transition-colors">
                              {r.author.name}
                            </Link>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-zinc-500" suppressHydrationWarning>{timeAgo(r.createdAt)}</span>
                              {userId === r.author.id && (
                                <button onClick={() => handleDelete(r.id, c.id)} className="text-zinc-300 hover:text-rose-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          {r.content && (
                            <p className="text-zinc-600 dark:text-slate-300 text-[14px] leading-relaxed mb-2">
                              {r.content.startsWith('@') ? (() => {
                                const spaceIdx = r.content.indexOf(' ');
                                const mention = spaceIdx > 0 ? r.content.slice(0, spaceIdx) : r.content;
                                const rest = spaceIdx > 0 ? r.content.slice(spaceIdx + 1) : '';
                                return <><span className="text-primary font-semibold">{mention}</span>{rest ? ` ${rest}` : ''}</>;
                              })() : r.content}
                            </p>
                          )}
                          <CommentImages images={r.images} onImageClick={setLightbox} />
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLike(r.id, c.id, 'LIKE')}
                              disabled={!session || isPending}
                              className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                                r.isLiked ? 'text-emerald-500' : 'text-zinc-500 hover:text-emerald-500'
                              } disabled:cursor-default`}
                            >
                              <ThumbsUp className={`w-3 h-3 transition-all ${r.isLiked ? 'fill-emerald-500' : ''}`} />
                              {r.likeCount > 0 && <span>{r.likeCount}</span>}
                            </button>
                            <button
                              onClick={() => handleLike(r.id, c.id, 'DISLIKE')}
                              disabled={!session || isPending}
                              className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                                r.isDisliked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'
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
                                className="flex items-center gap-1.5 text-zinc-500 hover:text-primary transition-all text-xs font-semibold"
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
                        <Avatar image={session?.user?.image} name={session?.user?.name ?? ''} isSelf />
                        <div className="flex-1 relative">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder={`Trả lời ${replyTo.name}...`}
                            disabled={isPending}
                            autoFocus
                            className="w-full bg-white dark:bg-white/[0.02] border border-zinc-300 dark:border-white/10 rounded-xl p-3 pr-20 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[80px] resize-none text-zinc-800 dark:text-white placeholder:text-zinc-500 disabled:opacity-60"
                          />
                          {replyPreviews.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {replyPreviews.map((src, i) => (
                                <div key={i} className="relative group w-16 h-16">
                                  <Image src={src} alt="" fill sizes="64px" className="object-cover rounded-lg border border-zinc-200 dark:border-white/10" />
                                  <button
                                    type="button"
                                    onClick={() => removeReplyFile(i)}
                                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-zinc-900/80 text-white opacity-0 group-hover:opacity-100 transition z-10"
                                    aria-label="Xoá ảnh"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <input
                            ref={replyFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            hidden
                            onChange={handleReplyFilePick}
                          />
                          <button
                            type="button"
                            onClick={() => replyFileInputRef.current?.click()}
                            disabled={isPending || replyFiles.length >= MAX_IMAGES}
                            className="absolute bottom-2 right-11 p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-primary hover:bg-primary/10 transition disabled:opacity-40"
                            title={`Đính kèm ảnh (tối đa ${MAX_IMAGES})`}
                          >
                            <ImagePlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleReply}
                            disabled={(!replyText.trim() && replyFiles.length === 0) || isPending}
                            className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-all ${
                              (replyText.trim() || replyFiles.length > 0) ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 cursor-not-allowed'
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
        <div className="py-12 text-center text-zinc-500">
          <User className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Bạn chưa có bình luận nào.</p>
        </div>
      )}

      {comments.length === 0 && (
        <div className="py-16 text-center text-zinc-500">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        </div>
      )}
    </div>
  );
}
