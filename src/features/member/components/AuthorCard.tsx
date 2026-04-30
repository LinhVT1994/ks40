'use client';

import { useState, useTransition, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserPlus, UserCheck, Globe, Facebook, Instagram, Twitter, Linkedin, Github, Youtube, Music } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { toggleFollowAction } from '@/features/member/actions/follow';

type AuthorInfo = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  followerCount: number;
  articleCount: number;
  isFollowing: boolean;
  username?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
};

const SOCIAL_LINKS = [
  { key: 'websiteUrl',   icon: Globe,     hoverColor: 'hover:text-primary hover:bg-primary/10' },
  { key: 'facebookUrl',  icon: Facebook,  hoverColor: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10' },
  { key: 'instagramUrl', icon: Instagram, hoverColor: 'hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10' },
  { key: 'twitterUrl',   icon: Twitter,   hoverColor: 'hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10' },
  { key: 'linkedinUrl',  icon: Linkedin,  hoverColor: 'hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10' },
  { key: 'githubUrl',    icon: Github,    hoverColor: 'hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/20' },
  { key: 'youtubeUrl',   icon: Youtube,   hoverColor: 'hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' },
  { key: 'tiktokUrl',    icon: Music,     hoverColor: 'hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/20' },
] as const;

import { useInteractionOptional } from '@/features/articles/context/ArticleInteractionContext';

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function AuthorCard({ author: initialAuthor }: { author: AuthorInfo }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const context = useInteractionOptional();
  
  // Use context if available (on Article pages), otherwise fallback to local state
  const [localIsFollowing, setLocalIsFollowing] = useState(initialAuthor.isFollowing);
  const [localFollowerCount, setLocalFollowerCount] = useState(initialAuthor.followerCount);
  const [localFollowPending, startFollowTransition] = useTransition();

  const isFollowing = context ? context.isFollowing : localIsFollowing;
  const followerCount = context ? context.followerCount : localFollowerCount;
  const followPending = context ? context.followPending : localFollowPending;

  const handleFollow = useCallback(async () => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (context) {
      context.handleFollow();
      return;
    }

    // Fallback logic for non-article pages
    startFollowTransition(async () => {
      try {
        const result = await toggleFollowAction(initialAuthor.id);
        if (result.success) {
          setLocalIsFollowing(result.isFollowing);
          setLocalFollowerCount(result.followerCount);
        }
      } catch (error) {
        console.error('Failed to toggle follow:', error);
      }
    });
  }, [session, context, initialAuthor.id]);

  const isSelf = userId === initialAuthor.id;

  return (
    <div className="group relative p-5 rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-zinc-300/80 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-xl flex flex-col gap-4 overflow-hidden">
      {/* Nền phản quang mờ */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

      {/* Top: Avatar bên trái + Tên + Chỉ số */}
      <div className="relative z-10 flex items-center gap-3.5">
        {/* Avatar */}
        <Link href={`/@${initialAuthor.username ?? initialAuthor.id}`} className="relative shrink-0 block group/avatar">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
          <div className="relative rounded-full p-[2px] bg-white dark:bg-slate-800 shadow-sm ring-1 ring-zinc-300 dark:ring-white/10 group-hover/avatar:ring-primary/40 transition-all duration-300">
            <div className="rounded-full overflow-hidden bg-zinc-100 dark:bg-slate-900">
              <Avatar src={initialAuthor.image} name={initialAuthor.name} size={52} className="w-full h-full object-cover" />
            </div>
          </div>
        </Link>
        
        {/* Name + Stats */}
        <div className="flex-1 min-w-0 pt-0.5">
          <Link
            href={`/@${initialAuthor.username ?? initialAuthor.id}`}
            className="block text-[16px] font-bold text-zinc-800 dark:text-white hover:text-primary transition-colors leading-tight truncate"
          >
            {initialAuthor.name}
          </Link>
          
          <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-slate-400 font-medium mt-1.5">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
              <span className="text-zinc-700 dark:text-slate-200 font-bold">{formatCount(initialAuthor.articleCount)}</span>
              <span className="text-[10px] uppercase tracking-wider">bài</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1">
              <span className="text-zinc-700 dark:text-slate-200 font-bold">{formatCount(followerCount)}</span>
              <span className="text-[10px] uppercase tracking-wider">fl</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Bio */}
      {initialAuthor.bio && (
        <div className="relative z-10 w-full mb-1">
          <p className="text-[13px] text-zinc-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-primary/30 dark:border-primary/50 pl-3">
            {initialAuthor.bio}
          </p>
        </div>
      )}

      {/* Footer: Socials + Action Button */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-white/5">
        
        {/* Social Icons — chỉ hiện khi có URL */}
        <div className="flex items-center gap-1.5">
          {SOCIAL_LINKS.map(({ key, icon: Icon, hoverColor }) => {
            const url = (initialAuthor as any)[key];
            if (!url) return null;
            return (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className={`w-7 h-7 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-slate-400 ${hoverColor} transition-colors`}>
                <Icon className="w-3.5 h-3.5" />
              </a>
            );
          })}
        </div>

        {/* Action Button */}
        {!isSelf && (
          <div className="shrink-0 flex items-center">
            {session ? (
              <button
                onClick={handleFollow}
                disabled={followPending}
                className={`group/btn relative flex items-center justify-start gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all overflow-hidden w-[130px] ${
                  isFollowing
                    ? 'bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 border border-zinc-300 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/30'
                    : 'bg-primary text-white shadow-[0_2px_10px_-4px_rgba(var(--primary-rgb),0.6)] hover:shadow-[0_4px_12px_-4px_rgba(var(--primary-rgb),0.8)] hover:-translate-y-0.5 border border-transparent'
                } disabled:opacity-50`}
              >
                {!isFollowing && <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover/btn:translate-y-[100%] transition-transform duration-500 ease-in-out" />}
                
                {isFollowing
                  ? <><UserCheck className="w-3.5 h-3.5 group-hover/btn:hidden" /><UserPlus className="w-3.5 h-3.5 hidden group-hover/btn:block" /></>
                  : <UserPlus className="w-3.5 h-3.5 relative z-10" />
                }
                <span className="relative z-10">
                  {isFollowing
                    ? <><span className="group-hover/btn:hidden">Đang theo dõi</span><span className="hidden group-hover/btn:inline">Bỏ theo dõi</span></>
                    : 'Theo dõi'
                  }
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                className="group/btn relative flex items-center justify-start gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold bg-primary text-white shadow-[0_2px_10px_-4px_rgba(var(--primary-rgb),0.6)] hover:shadow-[0_4px_12px_-4px_rgba(var(--primary-rgb),0.8)] hover:-translate-y-0.5 transition-all overflow-hidden w-[130px]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover/btn:translate-y-[100%] transition-transform duration-500 ease-in-out" />
                <UserPlus className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Theo dõi</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
