'use client';

import Image from 'next/image';
import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Heart, Eye, Clock, FileText, UserPlus, UserCheck, Calendar, ChevronDown,
  Globe, Facebook, Instagram, Twitter, Linkedin, Github, Youtube, Music,
} from 'lucide-react';
import { toggleFollowAction } from '@/features/member/actions/follow';
import { GlanceTrigger } from '@/features/member/components/GlancePreview';
import ProfileArticleCard from '@/features/member/components/ProfileArticleCard';
import { cn } from '@/lib/utils';

/* ── Helpers ───────────────────────────────────────────── */
function fmtViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

/* ── Types ─────────────────────────────────────────────── */
type TopicBadge = { label: string; color: string | null };

type Article = {
  id: string; title: string; slug: string; summary: string | null;
  thumbnail: string | null; thumbnailPosition: string | null;
  topic: TopicBadge; readTime: number; viewCount: number; publishedAt: Date | null;
  _count: { likes: number; comments: number };
};

type Follower = {
  id: string; name: string | null; image: string | null;
  bio: string | null; articleCount: number; username?: string | null;
};

/* ── Props ─────────────────────────────────────────────── */
const SOCIAL_LINKS = [
  { key: 'websiteUrl',   icon: Globe,     label: 'Website' },
  { key: 'facebookUrl',  icon: Facebook,  label: 'Facebook' },
  { key: 'instagramUrl', icon: Instagram, label: 'Instagram' },
  { key: 'twitterUrl',   icon: Twitter,   label: 'X' },
  { key: 'linkedinUrl',  icon: Linkedin,  label: 'LinkedIn' },
  { key: 'githubUrl',    icon: Github,    label: 'GitHub' },
  { key: 'youtubeUrl',   icon: Youtube,   label: 'YouTube' },
  { key: 'tiktokUrl',    icon: Music,     label: 'TikTok' },
] as const;

type Props = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    createdAt: Date;
    avatarUrl: string;
    totalViews: number;
    totalLikes: number;
    username?: string | null;
    _count: { articles: number };
    websiteUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    twitterUrl?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    youtubeUrl?: string | null;
  };
  articles: Article[];
  followers: Follower[];
  isFollowing: boolean;
  followerCount: number;
};

/* ── Main Component ────────────────────────────────────── */
export default function PublicProfileClient({ user, articles, followers, isFollowing: initialFollowing, followerCount: initialCount }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    startTransition(async () => {
      const result = await toggleFollowAction(user.id);
      if (result.success) {
        setIsFollowing(result.isFollowing);
        setFollowerCount(result.followerCount);
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 2xl:gap-16 items-start">
      {/* 1. Left Column: Identity & Follow - Fixed Sticky Rail */}
      <aside className="w-full lg:w-[280px] flex-shrink-0 lg:sticky lg:top-24 space-y-12 order-1">
        {/* User Identity Section */}
        <div className="relative px-2 flex flex-col items-start gap-4">
          {/* Avatar Area */}
          <div className="relative shrink-0">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 shadow-xl rounded-full overflow-hidden border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 group">
               <Image
                 src={user.avatarUrl}
                 alt={user.name ?? ''}
                 fill
                 unoptimized
                 priority
                 sizes="80px"
                 className="object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
               />
            </div>
          </div>

          {/* Identity Info */}
          <div className="w-full flex flex-col items-start text-left py-1">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">
              {user.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {user.username && (
                <p className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80">@{user.username}</p>
              )}
            </div>
            
            {/* Extended Content */}
            <div className="mt-4 space-y-8">

              {user.bio && (
                <div className="relative group">
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-slate-200 leading-relaxed font-signature font-medium italic">
                    &ldquo;{user.bio}&rdquo;
                  </p>
                  <div className="mt-1 h-0.5 w-6 bg-primary/30 rounded-full" />
                </div>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-zinc-500">
                {[
                  { label: 'Lượt xem', value: fmtViews(user.totalViews) },
                  { label: 'Lượt thích', value: fmtViews(user.totalLikes) },
                  { label: 'Followers', value: fmtViews(followerCount) },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-start min-w-[40px]">
                    <span className="text-sm font-black text-zinc-800 dark:text-white leading-none tracking-tight">{s.value}</span>
                    <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow Button */}
            <div className="mt-10">
              {session ? (
                <button
                  onClick={handleFollow}
                  disabled={isPending}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    isFollowing
                      ? 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-slate-300 border border-zinc-300 dark:border-white/10 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
                      : 'bg-primary text-white shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5'
                  } disabled:opacity-50`}
                >
                  {isFollowing ? (
                    <><UserCheck className="w-3.5 h-3.5" /> Hủy theo dõi</>
                  ) : (
                    <><UserPlus className="w-3.5 h-3.5" /> Theo dõi</>
                  )}
                </button>
              ) : (
                <Link
                   href="/login"
                   className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary text-white shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Theo dõi
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Center Column & Social Wrapper */}
      <div className="flex-1 flex flex-col lg:flex-row items-start relative order-3 lg:order-2 h-full min-h-[600px]">
        <main className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-lg font-black text-zinc-800 dark:text-white tracking-tight uppercase">
                Bài viết <span className="text-zinc-300 dark:text-slate-600 font-bold ml-1">({articles.length})</span>
              </h2>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent dark:from-white/10 dark:via-white/5" />
            </div>

            {articles.length === 0 ? (
              <div className="py-20 text-center rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                <FileText className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium tracking-wide">Tác giả chưa công khai bài viết nào.</p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-8 transition-all duration-700",
                articles.length === 1 ? "grid-cols-1 w-full" : 
                articles.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto" : 
                "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              )}>
                {articles.map((a, i) => (
                  <ProfileArticleCard 
                    key={a.id} 
                    article={a as any} 
                    index={i} 
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Right Column: Social Dock (Sticky centered on Desktop) */}
        <div className="hidden lg:block lg:sticky lg:top-1/2 lg:-translate-y-1/2 lg:ml-[50px] flex-shrink-0 w-[48px] h-fit order-3">
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
            {SOCIAL_LINKS.map(({ key, icon: Icon, label }) => {
              const url = (user as any)[key];
              if (!url) return null;
              
              const colors: Record<string, string> = {
                websiteUrl:   'hover:text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/20',
                facebookUrl:  'hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/20',
                instagramUrl: 'hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/20',
                twitterUrl:   'hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-800/10 dark:hover:bg-white/10 hover:border-zinc-800/20 dark:hover:border-white/20',
                linkedinUrl:  'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/20',
                githubUrl:    'hover:text-[#181717] dark:hover:text-white hover:bg-[#181717]/10 dark:hover:bg-white/10 hover:border-[#181717]/20 dark:hover:border-white/20',
                youtubeUrl:   'hover:text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/20',
                tiktokUrl:    'hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-900/10 dark:hover:bg-white/10 hover:border-zinc-900/20 dark:hover:border-white/20',
              };

              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className={cn(
                    "group relative p-3 rounded-full text-zinc-400 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-white/5 transition-all duration-300 hover:-translate-x-1 hover:shadow-xl dark:hover:shadow-primary/5 shadow-zinc-200/50",
                    colors[key]
                  )}
                >
                  <Icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Mobile Horizontal Version */}
        <div className="lg:hidden w-full order-2 border-y border-zinc-100 dark:border-white/5 py-8 mt-12">
           <div className="flex items-center justify-center gap-3">
             {SOCIAL_LINKS.map(({ key, icon: Icon, label }) => {
               const url = (user as any)[key];
               if (!url) return null;
               return (
                 <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500">
                   <Icon className="w-4 h-4" />
                 </a>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
}
