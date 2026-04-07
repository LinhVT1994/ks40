import { getBookmarksAction } from '@/features/articles/actions/bookmark';
import { Bookmark, Heart, MessageCircle, Eye, Clock, Tag } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System Design', AI_ML: 'AI / ML', DEVOPS: 'DevOps',
  BLOCKCHAIN: 'Blockchain', FRONTEND: 'Frontend', BACKEND: 'Backend', OTHER: 'Khác',
};

const CATEGORY_COLORS: Record<string, string> = {
  SYSTEM_DESIGN: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  AI_ML:         'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  DEVOPS:        'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  BLOCKCHAIN:    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  FRONTEND:      'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  BACKEND:       'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  OTHER:         'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400',
};

function formatViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function BookmarksPage() {
  const articles = await getBookmarksAction();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10">
          <Bookmark className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">Bài viết đã lưu</h1>
          <p className="text-sm text-slate-500">{articles.length} bài viết</p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
          <Bookmark className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Chưa có bài viết nào được lưu</p>
          <p className="text-sm text-slate-400 mt-1">Bấm vào biểu tượng bookmark trên bài viết để lưu lại</p>
          <Link href="/" className="inline-block mt-4 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Khám phá bài viết
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
          {articles.map(article => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="flex items-stretch gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group"
            >
              {/* Thumbnail */}
              <div
                className="w-24 h-16 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 bg-cover bg-center overflow-hidden flex items-center justify-center text-slate-300 dark:text-white/20 font-bold text-2xl"
                style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')` } : undefined}
              >
                {!article.thumbnail && article.title[0]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1 flex-1">
                      {article.title}
                    </h3>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block ${CATEGORY_COLORS[article.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {CATEGORY_LABELS[article.category] ?? article.category}
                    </span>
                  </div>
                  {article.summary && (
                    <p className="text-xs text-slate-500 line-clamp-1">{article.summary}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span className="text-[11px]">{article._count.likes}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-[11px]">{article._count.comments}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="text-[11px]">{formatViews(article.viewCount)}</span>
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    <span className="text-[11px]">{article.readTime}p</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
