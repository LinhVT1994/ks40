'use client';

import { useState, useTransition } from 'react';
import { Heart, Bookmark, Share2, UserPlus, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleGlossaryLikeAction, toggleGlossaryBookmarkAction } from '../actions/glossary';
import { toggleFollowAction } from '@/features/member/actions/follow';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Avatar from '@/components/shared/Avatar';
import Link from 'next/link';

interface Props {
  termId: string;
  initialLiked: boolean;
  initialBookmarked: boolean;
  initialLikeCount: number;
  slug: string;
  termName: string;
  author: {
    id: string;
    name: string;
    image: string | null;
    username?: string | null;
  } | null;
}

export default function GlossaryInteractionBar({
  termId,
  initialLiked,
  initialBookmarked,
  initialLikeCount,
  slug,
  termName,
  author
}: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLikePending, startLikeTransition] = useTransition();
  const [isBookmarkPending, startBookmarkTransition] = useTransition();

  const handleLike = () => {
    startLikeTransition(async () => {
      try {
        const res = await toggleGlossaryLikeAction(termId);
        setIsLiked(res.isLiked);
        setLikeCount(res.count);
      } catch (err) {
        toast.error('Vui lòng đăng nhập để thực hiện hành động này');
      }
    });
  };

  const handleBookmark = () => {
    startBookmarkTransition(async () => {
      try {
        const res = await toggleGlossaryBookmarkAction(termId);
        setIsBookmarked(res.isBookmarked);
        toast.success(res.isBookmarked ? 'Đã lưu vào bộ sưu tập' : 'Đã xóa khỏi bộ sưu tập');
      } catch (err) {
        toast.error('Vui lòng đăng nhập để thực hiện hành động này');
      }
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: termName,
        text: `Tra cứu thuật ngữ: ${termName}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết');
    }
  };

  const isSelf = userId === author?.id;
  const [localIsFollowing, setLocalIsFollowing] = useState(false); // Simplified for now, should ideally be passed in
  const [isFollowPending, startFollowTransition] = useTransition();

  const handleFollow = () => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (!author) return;

    startFollowTransition(async () => {
      try {
        const res = await toggleFollowAction(author.id);
        if (res.success) {
          setLocalIsFollowing(res.isFollowing);
        }
      } catch (err) {
        toast.error('Lỗi khi thực hiện theo dõi');
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-2 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-full border border-zinc-200 dark:border-white/5 shadow-xl">
      {/* Author Avatar + Follow at Top */}
      {author && (
        <div className="flex flex-col items-center gap-4 mb-2">
          <Link 
            href={`/profile/${author.username || author.id}`}
            className="group/avatar relative"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
            <div className="relative rounded-full p-0.5 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-zinc-200 dark:ring-white/10 group-hover/avatar:ring-primary/40 transition-all duration-300">
              <Avatar src={author.image} name={author.name} size={44} />
            </div>
          </Link>
          
          {!isSelf && (
            <button
              onClick={handleFollow}
              disabled={isFollowPending}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                localIsFollowing 
                  ? 'bg-zinc-100 dark:bg-white/5 text-zinc-400' 
                  : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95'
              }`}
              title={localIsFollowing ? 'Đang theo dõi' : 'Theo dõi'}
            >
              {localIsFollowing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </button>
          )}
        </div>
      )}

      <div className="w-8 h-px bg-zinc-200 dark:bg-white/10 mx-auto" />

      {/* Like Button */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={handleLike}
          disabled={isLikePending}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            isLiked 
              ? 'bg-rose-500/10 text-rose-500' 
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/5'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isLiked ? 'liked' : 'unliked'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </motion.div>
          </AnimatePresence>
          
          {/* Subtle pulse for liked state */}
          {isLiked && (
            <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
          )}
        </button>
        <span className={`text-sm font-bold transition-colors ${isLiked ? 'text-rose-500' : 'text-zinc-500'}`}>
          {likeCount}
        </span>
      </div>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        disabled={isBookmarkPending}
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          isBookmarked 
            ? 'bg-primary/10 text-primary' 
            : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-primary hover:bg-primary/5'
        }`}
      >
        <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all duration-300"
      >
        <Share2 className="w-5 h-5" />
      </button>
    </div>
  );
}
