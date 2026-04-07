'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UserPlus, UserCheck, Facebook, Instagram, Twitter, Link as LinkIcon } from 'lucide-react';
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
  // Các field mạng xã hội (tương lai backend có thể trả về)
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
};

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function AuthorCard({ author }: { author: AuthorInfo }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [isFollowing,   setIsFollowing]   = useState(author.isFollowing);
  const [followerCount, setFollowerCount] = useState(author.followerCount);
  const [isPending,     startTransition]  = useTransition();

  const handleFollow = () => {
    startTransition(async () => {
      const result = await toggleFollowAction(author.id);
      if (result.success) {
        setIsFollowing(result.isFollowing);
        setFollowerCount(result.followerCount);
      }
    });
  };

  const isSelf = userId === author.id;

  return (
    <div className="group relative p-5 rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-xl flex flex-col gap-4 overflow-hidden">
      {/* Nền phản quang mờ */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

      {/* Top: Avatar bên trái + Tên + Chỉ số */}
      <div className="relative z-10 flex items-center gap-3.5">
        {/* Avatar */}
        <Link href={`/profile/${author.id}`} className="relative shrink-0 block group/avatar">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
          <div className="relative rounded-full p-[2px] bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-white/10 group-hover/avatar:ring-primary/40 transition-all duration-300">
            <div className="rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900">
              <Avatar src={author.image} name={author.name} size={52} className="w-full h-full object-cover" />
            </div>
          </div>
        </Link>
        
        {/* Name + Stats */}
        <div className="flex-1 min-w-0 pt-0.5">
          <Link
            href={`/profile/${author.id}`}
            className="block text-[16px] font-bold text-slate-900 dark:text-white hover:text-primary transition-colors leading-tight truncate"
          >
            {author.name}
          </Link>
          
          <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
              <span className="text-slate-700 dark:text-slate-200 font-bold">{formatCount(author.articleCount)}</span>
              <span className="text-[10px] uppercase tracking-wider">bài</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1">
              <span className="text-slate-700 dark:text-slate-200 font-bold">{formatCount(followerCount)}</span>
              <span className="text-[10px] uppercase tracking-wider">fl</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Bio */}
      {author.bio && (
        <div className="relative z-10 w-full mb-1">
          <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-primary/30 dark:border-primary/50 pl-3">
            {author.bio}
          </p>
        </div>
      )}

      {/* Footer: Socials + Action Button */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
        
        {/* Social Icons */}
        <div className="flex items-center gap-1.5">
          <a href={author.facebookUrl || "#"} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Facebook">
            <Facebook className="w-3.5 h-3.5" />
          </a>
          <a href={author.instagramUrl || "#"} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors" title="Instagram">
            <Instagram className="w-3.5 h-3.5" />
          </a>
          <a href={author.tiktokUrl || "#"} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-colors" title="TikTok">
            <LinkIcon className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Action Button */}
        {!isSelf && (
          <div className="shrink-0 flex items-center">
            {session ? (
              <button
                onClick={handleFollow}
                disabled={isPending}
                className={`group/btn relative flex items-center justify-start gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all overflow-hidden w-[130px] ${
                  isFollowing
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/30'
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
