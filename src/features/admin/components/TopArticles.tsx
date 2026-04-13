import React from 'react';
import Link from 'next/link';
import { Eye, Heart, MessageCircle, TrendingUp, ExternalLink } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System', AI_ML: 'AI/ML', DEVOPS: 'DevOps',
  BLOCKCHAIN: 'Blockchain', FRONTEND: 'Frontend', BACKEND: 'Backend', OTHER: 'Khác',
};

const CATEGORY_COLORS: Record<string, string> = {
  SYSTEM_DESIGN: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  AI_ML:         'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  DEVOPS:        'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  BLOCKCHAIN:    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  FRONTEND:      'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  BACKEND:       'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  OTHER:         'bg-zinc-100 text-zinc-600 dark:bg-white/5 dark:text-slate-400',
};

function fmt(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

type Article = {
  id: string; title: string; slug: string; thumbnail: string | null;
  topic: { label: string; color: string | null };
  viewCount: number;
  _count: { likes: number; comments: number };
  author: { name: string; image: string | null };
};

export default function TopArticles({ articles }: { articles: Article[] }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-zinc-800 dark:text-white">Top bài viết</h3>
        </div>
        <Link href="/admin/documents" className="text-xs font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
          Xem tất cả <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-white/5">
        {articles.map((article, idx) => (
          <div key={article.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all group relative">
            <span className="text-sm font-black text-zinc-300 dark:text-white/10 w-4 shrink-0 text-center">{idx + 1}</span>
            
            {/* Thumbnail */}
            <div className="relative w-20 aspect-[16/10] rounded-lg overflow-hidden shrink-0 border border-zinc-200 dark:border-white/5 shadow-sm bg-zinc-50 dark:bg-white/5">
              <img 
                src={article.thumbnail || '/placeholder-article.jpg'} 
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="flex-1 min-w-0">
              <Link
                href={`/article/${article.slug}`}
                target="_blank"
                className="text-sm font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors block truncate pr-2"
              >
                {article.title}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-primary/5 text-primary border border-primary/10">
                  {article.topic.label}
                </span>
                <span className="text-[11px] font-medium text-zinc-500">{article.author.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-zinc-500 shrink-0">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{fmt(article.viewCount)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{article._count.likes}</span>
              </span>
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <div className="py-10 text-center text-sm text-zinc-500">Chưa có dữ liệu.</div>
        )}
      </div>
    </div>
  );
}
