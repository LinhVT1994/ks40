'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import type { ArticleCard } from '@/features/articles/actions/article';
import TableOfContents from './TableOfContents';
import AuthorCard from './AuthorCard';

function MiniCard({ article, metric }: { article: ArticleCard; metric: React.ReactNode }) {
  return (
    <Link href={`/article/${article.slug}`} className="block group">
      <div className="flex gap-3 p-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-all rounded-xl">
        <div
          className="w-14 h-14 rounded-lg shrink-0 border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-300 dark:text-white/20 font-bold text-lg bg-cover bg-center"
          style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')`, backgroundPosition: article.thumbnailPosition ?? '50% 50%' } : undefined}
        >
          {!article.thumbnail && article.title[0]}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1.5">
            {article.title}
          </h4>
          {metric}
        </div>
      </div>
    </Link>
  );
}

type AuthorInfo = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  followerCount: number;
  articleCount: number;
  isFollowing: boolean;
};

export default function ArticleSidebar({
  history = [],
  headings,
  author,
}: {
  history?: { article: ArticleCard; progress: number }[];
  headings: { level: number; text: string; id: string }[];
  author?: AuthorInfo | null;
}) {
  return (
    <div className="flex flex-col gap-10">
      {author && (
        <>
          <AuthorCard author={author} />
          <div className="h-px bg-zinc-100 dark:bg-white/5" />
        </>
      )}

      {headings.length > 0 && (
        <>
          <TableOfContents headings={headings} />
          {history.length > 0 && (
            <div className="h-px bg-zinc-100 dark:bg-white/5" />
          )}
        </>
      )}

      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 px-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Vừa đọc gần đây</h3>
          </div>
          <div className="flex flex-col gap-1">
            {history.slice(0, 5).map(h => (
              <MiniCard
                key={h.article.id}
                article={h.article}
                metric={
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span className="text-[11px] font-medium">{h.article.readTime} phút đọc</span>
                    <span className="text-[10px] opacity-40">•</span>
                    <span className="text-[11px] font-bold text-primary">{Math.round(h.progress)}%</span>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
