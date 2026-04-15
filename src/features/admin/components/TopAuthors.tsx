import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { Eye, FileText, Users2 } from 'lucide-react';

function fmt(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

type Author = {
  id: string;
  name: string;
  image: string | null;
  articleCount: number;
  totalViews: number;
};

export default function TopAuthors({ authors }: { authors: Author[] }) {
  const maxViews = authors[0]?.totalViews ?? 1;

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-zinc-200 dark:border-white/5">
        <Users2 className="w-4 h-4 text-emerald-500" />
        <h3 className="font-display font-bold text-zinc-800 dark:text-white">Top tác giả</h3>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-white/5">
        {authors.map((author, idx) => {
          const avatarUrl = author.image
            ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name ?? 'U')}&background=e2e8f0&color=0f172a&size=64`;
          const pct = maxViews > 0 ? (author.totalViews / maxViews) * 100 : 0;

          return (
            <div key={author.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
              <span className="text-sm font-bold text-zinc-200 dark:text-white/10 w-4 shrink-0 text-center">{idx + 1}</span>
              <Link href={`/profile/${author.id}`} className="shrink-0">
                <div className="relative w-9 h-9 shrink-0">
                  <Image
                    src={avatarUrl}
                    alt={author.name ?? ''}
                    fill
                    unoptimized
                    sizes="36px"
                    className="rounded-xl object-cover border border-zinc-200 dark:border-white/10"
                  />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${author.id}`} className="text-sm font-semibold text-zinc-800 dark:text-white group-hover:text-primary transition-colors block truncate">
                  {author.name}
                </Link>
                {/* Progress bar */}
                <div className="mt-1 h-1 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden w-full">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 text-zinc-500 justify-end">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{fmt(author.totalViews)}</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-500 justify-end mt-0.5">
                  <FileText className="w-3 h-3" />
                  <span className="text-[11px]">{author.articleCount} bài</span>
                </div>
              </div>
            </div>
          );
        })}
        {authors.length === 0 && (
          <div className="py-10 text-center text-sm text-zinc-500">Chưa có dữ liệu.</div>
        )}
      </div>
    </div>
  );
}
