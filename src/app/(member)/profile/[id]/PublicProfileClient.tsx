'use client';

import Image from 'next/image';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Heart, Eye, Clock, FileText, UserPlus, UserCheck, Calendar,
  Globe, Facebook, Instagram, Twitter, Linkedin, Github, Youtube,
} from 'lucide-react';
import { toggleFollowAction } from '@/features/member/actions/follow';

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
  bio: string | null; articleCount: number;
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
    <div className="space-y-16">
      {/* ── Hero: Profile Card ─────────────────────────── */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 via-accent-purple/5 to-transparent rounded-[2rem] blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-8 p-8 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl max-md:backdrop-blur-lg border border-zinc-200 dark:border-white/5 rounded-3xl shadow-sm">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="absolute -inset-2 bg-gradient-to-tr from-primary/20 to-accent-purple/20 rounded-full blur-xl opacity-60" />
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shadow-lg">
               <Image
                 src={user.avatarUrl}
                 alt={user.name ?? ''}
                 fill
                 priority
                 sizes="(max-width: 640px) 112px, 128px"
                 className="rounded-full object-cover border-4 border-white dark:border-slate-800"
               />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-tight">
              {user.name}
            </h1>

            {user.bio && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-slate-400 leading-relaxed font-medium italic max-w-xl">
                &ldquo;{user.bio}&rdquo;
              </p>
            )}

            <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-zinc-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tham gia từ {fmtDate(user.createdAt)}</span>
            </div>

            {/* Social Links */}
            {SOCIAL_LINKS.some(s => (user as any)[s.key]) && (
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
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
            <div className="mt-5 flex items-center justify-center sm:justify-start gap-6">
              {[
                { label: 'Bài viết', value: user._count.articles },
                { label: 'Lượt xem', value: fmtViews(user.totalViews) },
                { label: 'Lượt thích', value: fmtViews(user.totalLikes) },
                { label: 'Người theo dõi', value: fmtViews(followerCount) },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center sm:items-start">
                  <span className="text-lg font-black text-zinc-800 dark:text-white leading-none">{s.value}</span>
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mt-1">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Follow Button */}
            <div className="mt-6">
              {session ? (
                <button
                  onClick={handleFollow}
                  disabled={isPending}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isFollowing
                      ? 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-slate-300 border border-zinc-300 dark:border-white/10 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
                      : 'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5'
                  } disabled:opacity-50`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span className="group-hover:hidden">Đang theo dõi</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Theo dõi
                    </>
                  )}
                </button>
              ) : (
                <Link
                   href="/login"
                   className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Theo dõi
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Articles ───────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xl font-black text-zinc-800 dark:text-white tracking-tight">
            Bài viết <span className="text-zinc-300 dark:text-slate-600 font-bold text-base">({articles.length})</span>
          </h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-zinc-100 via-zinc-100/50 to-transparent dark:from-white/10 dark:via-white/5" />
        </div>

        {articles.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/5">
            <FileText className="w-10 h-10 text-zinc-200 dark:text-white/10 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">Chưa có bài viết nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {articles.map((a, i) => (
              <Link
                key={a.id}
                href={`/article/${a.slug}`}
                style={{ animationDelay: `${i * 100}ms` }}
                className="group relative bg-white/40 dark:bg-white/[0.02] backdrop-blur-md max-md:backdrop-blur-sm border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <Image
                    src={a.thumbnail || '/placeholder-article.jpg'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={a.title}
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="backdrop-blur-md max-md:backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide shadow-sm border border-white/20 dark:border-white/5"
                      style={{ color: a.topic.color ?? '#3B82F6' }}
                    >
                      {a.topic.label}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
                    {a.title}
                  </h3>
                  {a.summary && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">{a.summary}</p>
                  )}

                  <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-zinc-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold tabular-nums">{fmtViews(a._count.likes)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-bold tabular-nums">{fmtViews(a.viewCount)}</span>
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3" />{a.readTime}m
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Followers ──────────────────────────────────── */}
      {followers.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-black text-zinc-800 dark:text-white tracking-tight">
              Người theo dõi <span className="text-zinc-300 dark:text-slate-600 font-bold text-base">({followers.length})</span>
            </h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-zinc-100 via-zinc-100/50 to-transparent dark:from-white/10 dark:via-white/5" />
          </div>

          <div className="flex items-center -space-x-3">
            {followers.slice(0, 8).map((f) => (
              <Link
                 key={f.id}
                 href={`/profile/${f.id}`}
                 title={f.name ?? ''}
                 className="relative w-11 h-11 hover:z-10 hover:scale-110 transition-transform duration-200"
              >
                <Image
                  src={f.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name ?? 'User')}&background=e2e8f0&color=0f172a&size=80`}
                  fill
                  sizes="44px"
                  className="rounded-full object-cover ring-[3px] ring-white dark:ring-slate-950 shadow-sm"
                  alt={f.name ?? ''}
                />
              </Link>
            ))}
            {followers.length > 8 && (
              <div className="relative z-0 w-11 h-11 rounded-full bg-zinc-100 dark:bg-white/10 ring-[3px] ring-white dark:ring-slate-950 flex items-center justify-center">
                <span className="text-[11px] font-bold text-zinc-500 dark:text-slate-400">+{followers.length - 8}</span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
