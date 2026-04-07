'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { SeriesNavItem } from '@/features/articles/actions/article';

type SeriesContext = {
  series: { id: string; title: string; slug: string };
  articles: SeriesNavItem[];
  currentIndex: number;
  total: number;
  prev: SeriesNavItem | null;
  next: SeriesNavItem | null;
  currentOrder: number | null;
};

export default function SeriesBanner({ ctx }: { ctx: SeriesContext }) {
  const [expanded, setExpanded] = useState(false);
  const { series, articles, currentIndex, total, prev, next } = ctx;

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Series</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{series.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            {currentIndex + 1} / {total}
          </span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Toggle series list"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="h-1 rounded-full bg-primary/10 dark:bg-primary/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Expandable article list */}
      {expanded && (
        <div className="border-t border-primary/10 dark:border-primary/20 px-5 py-3 space-y-1 max-h-64 overflow-y-auto">
          {articles.map((a, i) => {
            const isCurrent = i === currentIndex;
            return (
              <Link
                key={a.slug}
                href={`/article/${a.slug}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  isCurrent
                    ? 'bg-primary/10 text-primary font-bold cursor-default pointer-events-none'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-primary/5 font-medium'
                }`}
              >
                <span className="shrink-0 w-5 h-5 rounded-full border border-current/30 flex items-center justify-center text-[10px] font-black">
                  {isCurrent ? <Check className="w-3 h-3" /> : a.seriesOrder}
                </span>
                <span className="truncate">{a.title}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Prev / Next within series */}
      {(prev || next) && (
        <div className="border-t border-primary/10 dark:border-primary/20 px-5 py-3 flex items-center justify-between gap-4">
          {prev ? (
            <Link
              href={`/article/${prev.slug}`}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors min-w-0"
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[140px]">{prev.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link
              href={`/article/${next.slug}`}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors min-w-0 text-right"
            >
              <span className="truncate max-w-[140px]">{next.title}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}
