'use client';

import Link from 'next/link';
import { Tag } from 'lucide-react';

type TagItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export default function TagList({ tags }: { tags: TagItem[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Tag className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-800 dark:text-white">Thẻ phổ biến</h3>
      </div>
      <div className="flex flex-wrap gap-2 px-1">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/search?tag=${encodeURIComponent(tag.slug)}`}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-300 dark:border-white/10 text-xs font-medium text-zinc-600 dark:text-slate-400 hover:border-primary/30 hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5 group"
          >
            <span className="text-zinc-300 dark:text-slate-600 transition-colors group-hover:text-primary/50">#</span>
            {tag.name}
            <span className="text-[10px] text-zinc-500 dark:text-slate-500 font-bold ml-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
              {tag.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
