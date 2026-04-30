'use client';

import React from 'react';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { useInteractionOptional } from '@/features/articles/context/ArticleInteractionContext';
import ShareMenu from '@/components/shared/ShareMenu';

export default function MobileInteractionBar() {
  const interaction = useInteractionOptional();
  
  if (!interaction) return null;

  const {
    liked,
    likes,
    handleLike,
    likePending,
    bookmarked,
    handleBookmark,
    bookmarkPending,
  } = interaction;

  return (
    <div className="flex items-center gap-4">
      {/* Like */}
      <button
        onClick={handleLike}
        disabled={likePending}
        className={`flex items-center gap-1.5 py-2 transition-all active:scale-90 ${
          liked ? 'text-rose-500' : 'text-zinc-400 dark:text-slate-500 hover:text-rose-500'
        }`}
      >
        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
        <span className="text-xs font-bold tabular-nums">{likes}</span>
      </button>

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        disabled={bookmarkPending}
        className={`p-2 transition-all active:scale-90 ${
          bookmarked ? 'text-primary' : 'text-zinc-400 dark:text-slate-500 hover:text-primary'
        }`}
      >
        <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
      </button>

      {/* Share */}
      <ShareMenu
        align="right"
        trigger={
          <div className="p-2 text-zinc-400 dark:text-slate-500 hover:text-primary transition-all active:scale-90 cursor-pointer">
            <Share2 className="w-5 h-5" />
          </div>
        }
      />
    </div>
  );
}
