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
    <div className="flex items-center gap-0.5 sm:gap-1">
      {/* Like */}
      <button
        onClick={handleLike}
        disabled={likePending}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border border-transparent ${
          liked 
            ? 'text-rose-500 bg-rose-500/5 border-rose-500/10' 
            : 'text-zinc-500 hover:text-primary hover:bg-primary/5 hover:border-primary/20'
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-bold">{likes}</span>
      </button>

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        disabled={bookmarkPending}
        className={`p-2 rounded-lg transition-all border border-transparent ${
          bookmarked 
            ? 'text-primary bg-primary/5 border-primary/20' 
            : 'text-zinc-500 hover:text-primary hover:bg-primary/5 hover:border-primary/20'
        }`}
      >
        <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
      </button>

      {/* Share */}
      <ShareMenu
        align="center"
        trigger={
          <div className="p-2 rounded-lg text-zinc-500 hover:text-primary hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all cursor-pointer">
            <Share2 className="w-3.5 h-3.5" />
          </div>
        }
      />
    </div>
  );
}
