import { getReadHistoryAction } from '@/features/articles/actions/read-history';
import { History, Clock, BookOpen } from 'lucide-react';
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

function groupByDate(records: { readAt: Date; article: { id: string; title: string; slug: string; thumbnail: string | null; category: string; readTime: number; author: { name: string } }; progress: number }[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: typeof records }[] = [];
  const map = new Map<string, typeof records>();

  for (const r of records) {
    const d = new Date(r.readAt);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = 'Hôm nay';
    else if (d.getTime() === yesterday.getTime()) label = 'Hôm qua';
    else label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(r);
  }

  map.forEach((items, label) => groups.push({ label, items }));
  return groups;
}

export default async function HistoryPage() {
  const history = await getReadHistoryAction();

  const groups = groupByDate(history as Parameters<typeof groupByDate>[0]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-violet-500/10">
          <History className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white font-display">Lịch sử đọc</h1>
          <p className="text-sm text-slate-500">{history.length} bài gần đây</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
          <History className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Chưa đọc bài viết nào</p>
          <p className="text-sm text-slate-400 mt-1">Lịch sử đọc sẽ được lưu tại đây</p>
          <Link href="/" className="inline-block mt-4 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Khám phá bài viết
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{label}</h2>
              <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                {items.map(({ article, progress, readAt }) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-14 h-14 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 bg-cover bg-center flex items-center justify-center text-slate-300 dark:text-white/20 font-bold text-xl overflow-hidden"
                      style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')` } : undefined}
                    >
                      {!article.thumbnail && article.title[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{article.author.name}</p>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {Math.round(progress * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="shrink-0 text-right hidden sm:block">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[article.category] ?? 'bg-slate-100 text-slate-600'}`}>
                        {CATEGORY_LABELS[article.category] ?? article.category}
                      </span>
                      <div className="flex items-center gap-1 justify-end mt-1.5 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px]">{article.readTime}p</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
