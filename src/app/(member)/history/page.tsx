import { getReadHistoryAction } from '@/features/articles/actions/read-history';
import type { Metadata } from 'next';
import { History, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title:  'Lịch sử đọc',
  robots: { index: false, follow: false },
};
import Link from 'next/link';

type HistoryRecord = {
  readAt: Date;
  article: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    topic: { id: string; slug: string; label: string; emoji: string | null; color: string | null };
    readTime: number;
    author: { name: string };
  };
  progress: number;
};

function groupByDate(records: HistoryRecord[]) {
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

  const groups = groupByDate(history as HistoryRecord[]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-violet-500/10">
          <History className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-800 dark:text-white font-display">Lịch sử đọc</h1>
          <p className="text-sm text-zinc-500">{history.length} bài gần đây</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-dashed border-zinc-300 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
          <History className="w-10 h-10 text-zinc-300 dark:text-white/20 mx-auto mb-4" />
          <p className="text-zinc-500 font-medium">Chưa đọc bài viết nào</p>
          <p className="text-sm text-zinc-500 mt-1">Lịch sử đọc sẽ được lưu tại đây</p>
          <Link href="/" className="inline-block mt-4 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Khám phá bài viết
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">{label}</h2>
              <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden divide-y divide-zinc-200 dark:divide-white/5">
                {items.map(({ article, progress }) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-14 h-14 shrink-0 rounded-xl bg-zinc-100 dark:bg-white/5 bg-cover bg-center flex items-center justify-center text-zinc-300 dark:text-white/20 font-bold text-xl overflow-hidden"
                      style={article.thumbnail ? { backgroundImage: `url('${article.thumbnail}')` } : undefined}
                    >
                      {!article.thumbnail && article.title[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                        {article.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{article.author.name}</p>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                          {Math.round(progress * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="shrink-0 text-right hidden sm:block">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white"
                        style={{ backgroundColor: article.topic.color ?? '#64748b' }}
                      >
                        {article.topic.label}
                      </span>
                      <div className="flex items-center gap-1 justify-end mt-1.5 text-zinc-500">
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
