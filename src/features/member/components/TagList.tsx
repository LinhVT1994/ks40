'use client';

import Link from 'next/link';
import { Tag } from 'lucide-react';

type TagItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

// Muted, warm-leaning palette that sits well on the cream / dark-brown theme.
const TAG_COLORS = [
  'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 dark:bg-orange-500/10 dark:border-orange-400/20 dark:text-orange-300',
  'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-400/20 dark:text-amber-300',
  'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-400/20 dark:text-emerald-300',
  'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100 dark:bg-teal-500/10 dark:border-teal-400/20 dark:text-teal-300',
  'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100 dark:bg-sky-500/10 dark:border-sky-400/20 dark:text-sky-300',
  'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-400/20 dark:text-rose-300',
  'bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100 dark:bg-violet-500/10 dark:border-violet-400/20 dark:text-violet-300',
];

// Stable color per tag so it doesn't change between renders or pages.
function tagColor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
}

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
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 group ${tagColor(tag.slug)}`}
          >
            <span className="opacity-50">#</span>
            {tag.name}
            <span className="text-[10px] font-bold ml-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
              {tag.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
