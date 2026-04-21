'use client';

import Image from 'next/image';
import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Heart, Eye, Clock, FileText, UserPlus, UserCheck, Calendar,
  Globe, Facebook, Instagram, Twitter, Linkedin, Github, Youtube,
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      {/* ── Left Sidebar: Profile Identity ────────────────── */}
      <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-8">
        <div className="relative flex flex-col items-start gap-5 p-2 text-left">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shadow-xl rounded-full overflow-hidden border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 group">
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

          {/* Info */}
          <div className="w-full flex flex-col items-start text-left">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white tracking-tight leading-tight">
              {user.name}
            </h1>
            {user.username && (
              <p className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80 mt-1 mb-4">@{user.username}</p>
            )}

            {user.bio && (
              <div className="relative mb-4 group max-w-[200px]">
                <p className="text-sm text-zinc-800 dark:text-slate-200 leading-relaxed font-signature font-medium italic">
                  &ldquo;{user.bio}&rdquo;
                </p>
                <div className="mt-1 h-0.5 w-6 bg-primary/30 rounded-full" />
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-500 font-medium">
               <Calendar className="w-3.5 h-3.5 opacity-70" />
               <span>Tham gia {mounted ? fmtDate(user.createdAt) : ''}</span>
            </div>

            {/* Social Links */}
            {SOCIAL_LINKS.some(s => (user as any)[s.key]) && (
              <div className="mt-5 flex items-center gap-3">
                {SOCIAL_LINKS.map(({ key, icon: Icon, label }) => {
                  const url = (user as any)[key];
                  if (!url) return null;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Stats Row */}
            <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-5 text-zinc-500">
              {[
                { label: 'Lượt xem', value: fmtViews(user.totalViews) },
                { label: 'Lượt thích', value: fmtViews(user.totalLikes) },
                { label: 'Followers', value: fmtViews(followerCount) },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-start min-w-[50px]">
                  <span className="text-sm font-black text-zinc-800 dark:text-white leading-none tracking-tight">{s.value}</span>
                  <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Follow Button */}
            <div className="mt-6">
              {session ? (
                <button
                  onClick={handleFollow}
                  disabled={isPending}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    isFollowing
                      ? 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-slate-300 border border-zinc-300 dark:border-white/10 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
                      : 'bg-primary text-white shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5'
                  } disabled:opacity-50`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Hủy theo dõi
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Theo dõi
                    </>
                  )}
                </button>
              ) : (
                <Link
                   href="/login"
                   className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-primary text-white shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Theo dõi
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right Column: Content Area ──────────────────── */}
      <main className="lg:col-span-8 xl:col-span-9 space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000">
        {/* ── Articles ───────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-lg font-black text-zinc-800 dark:text-white tracking-tight uppercase">
              Bài viết <span className="text-zinc-300 dark:text-slate-600 font-bold ml-1">({articles.length})</span>
            </h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-zinc-100 via-zinc-100/50 to-transparent dark:from-white/10 dark:via-white/5" />
          </div>

          {articles.length === 0 ? (
            <div className="py-20 text-center rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
              <FileText className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium tracking-wide">Tác giả chưa công khai bài viết nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
    </div>
  );
}
