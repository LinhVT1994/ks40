'use client';

import Link from 'next/link';
import { Eye, TrendingUp, History } from 'lucide-react';
import type { ArticleCard } from '@/features/articles/actions/article';
import TableOfContents from './TableOfContents';
import AuthorCard from './AuthorCard';

function formatViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

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
  trending,
  related,
  history = [],
  headings,
  author,
}: {
  trending: ArticleCard[];
  related: ArticleCard[];
  history?: { article: ArticleCard; progress: number }[];
  headings: { level: number; text: string; id: string }[];
  author?: AuthorInfo | null;
}) {
  return (
    <div className="xl:sticky xl:top-[100px] flex flex-col gap-10">
      {author && (
        <>
          <AuthorCard author={author} />
          <div className="h-px bg-zinc-100 dark:bg-white/5" />
        </>
      )}

      {headings.length > 0 && (
        <>
          <TableOfContents headings={headings} />
          {(trending.length > 0 || related.length > 0) && (
            <div className="h-px bg-zinc-100 dark:bg-white/5" />
          )}
        </>
      )}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Xem nhiều nhất</h3>
          </div>
          <div className="flex flex-col gap-1">
            {trending.map(a => (
              <MiniCard
                key={a.id}
                article={a}
                metric={
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">{formatViews(a.viewCount)}</span>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div>
          <div className="h-px bg-zinc-100 dark:bg-white/5 mb-8" />
          <div className="flex items-center gap-2 mb-4 px-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Bài viết liên quan</h3>
          </div>
          <div className="flex flex-col gap-1">
            {related.slice(0, 4).map(a => (
              <MiniCard
                key={a.id}
                article={a}
                metric={
                  <span className="text-[11px] text-zinc-500 font-medium">{a.readTime} phút đọc</span>
                }
              />
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div className="h-px bg-zinc-100 dark:bg-white/5 mb-8" />
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
