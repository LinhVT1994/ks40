'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Heart, Bookmark, Share2, UserPlus, UserCheck } from 'lucide-react';
import { useInteractionOptional } from '@/features/articles/context/ArticleInteractionContext';
import Avatar from '@/components/shared/Avatar';
import Link from 'next/link';
import ShareMenu from '@/components/shared/ShareMenu';

export default function FloatingInteractionHub() {
  const interaction = useInteractionOptional();
  
  const liked = interaction?.liked ?? false;
  const likes = interaction?.likes ?? 0;
  const likePending = interaction?.likePending ?? false;
  const handleLike = interaction?.handleLike ?? (() => {});
  const bookmarked = interaction?.bookmarked ?? false;
  const bookmarkPending = interaction?.bookmarkPending ?? false;
  const handleBookmark = interaction?.handleBookmark ?? (() => {});
  const readProgress = interaction?.readProgress ?? 0;
  const author = interaction?.author ?? { id: '', name: '', image: null, articleCount: 0, bio: null };
  const isFollowing = interaction?.isFollowing ?? false;
  const followerCount = interaction?.followerCount ?? 0;
  const followPending = interaction?.followPending ?? false;
  const handleFollow = interaction?.handleFollow ?? (() => {});
  const sidebarsVisible = interaction?.sidebarsVisible ?? true;
  const showSidebars = interaction?.showSidebars ?? (() => {});
  const hideSidebars = interaction?.hideSidebars ?? (() => {});

  const [focusActive, setFocusActive] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setFocusActive((e as CustomEvent).detail?.active ?? false);
    };
    window.addEventListener('focus-mode-changed', handler);
    return () => window.removeEventListener('focus-mode-changed', handler);
  }, []);

  const handleMouseEnter = () => {
    showSidebars();
  };

  const handleMouseLeave = () => {
    hideSidebars();
  };

  return (
    <div 
      className={`flex flex-col items-start gap-8 sticky top-40 h-fit py-4 transition-opacity duration-700 group/hub w-44 ${
        sidebarsVisible ? 'opacity-100' : 'opacity-0'
      } ${focusActive ? 'pointer-events-none !opacity-0' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Author Section (Minimalist Vertical) */}
      <div className="flex flex-col items-start gap-4 group/author w-full">
        <div className="flex flex-col items-start gap-3 w-full">
          <Link 
            href={`/profile/${author.username ?? author.id}`}
            className="relative block shrink-0"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover/author:opacity-100 transition-opacity duration-300" />
            <div className="relative rounded-full p-[1.5px] bg-white dark:bg-slate-800 ring-1 ring-zinc-200 dark:ring-white/10 group-hover/author:ring-primary/40 transition-all duration-300 shadow-sm">
              <div className="rounded-full overflow-hidden w-11 h-11 bg-zinc-100 dark:bg-slate-900 border border-zinc-100 dark:border-white/5">
                <Avatar src={author.image} name={author.name} size={44} className="w-full h-full object-cover" />
              </div>
            </div>
          </Link>
          
          <span className="text-[16px] font-bold text-zinc-900 dark:text-white leading-tight" title={author.name}>
            {author.name}
          </span>
        </div>

        {author.bio && (
          <div className="w-full">
            <p className="text-[13px] text-zinc-600 dark:text-slate-400 leading-[1.5] font-medium opacity-80 italic">
              {author.bio}
            </p>
          </div>
        )}

      <button
        onClick={handleFollow}
        disabled={followPending}
        className={`group/follow flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-[13px] font-black transition-all duration-300 border shadow-sm ${
          isFollowing
            ? 'bg-zinc-100 dark:bg-white/10 text-zinc-500 border-zinc-200 dark:border-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/20'
            : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent hover:translate-y-[-1px] active:scale-95'
        }`}
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-3.5 h-3.5 group-hover/follow:hidden" />
            <UserPlus className="w-3.5 h-3.5 hidden group-hover/follow:block rotate-45" />
            <span className="group-hover/follow:hidden">Following</span>
            <span className="hidden group-hover/follow:inline">Unfollow</span>
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Follow</span>
          </>
        )}
      </button>
      </div>

      <div className="flex flex-col items-start gap-6">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={likePending}
          className={`group/btn flex flex-col items-center gap-1.5 transition-all duration-300 ${
            liked ? 'text-rose-500 scale-110' : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-white'
          }`}
        >
          <div className={`p-2.5 rounded-full transition-all duration-300 ${
            liked ? 'bg-rose-50 dark:bg-rose-500/10' : 'hover:bg-zinc-100 dark:hover:bg-white/5'
          }`}>
            <Heart className={`w-[22px] h-[22px] ${liked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[13px] font-bold">{likes}</span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          disabled={bookmarkPending}
          className={`group/btn p-2.5 rounded-full transition-all duration-300 ${
            bookmarked 
              ? 'text-primary bg-primary/10 scale-110' 
              : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
          }`}
        >
          <Bookmark className={`w-[22px] h-[22px] ${bookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Share Button */}
        <ShareMenu
          align="left"
          trigger={
            <span className="p-2.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-300 inline-flex">
              <Share2 className="w-[22px] h-[22px]" />
            </span>
          }
        />
      </div>
    </div>
  );
}
