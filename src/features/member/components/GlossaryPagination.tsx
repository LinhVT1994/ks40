'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GlossaryPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
}

export default function GlossaryPagination({ currentPage, totalPages, total }: GlossaryPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/glossary?${params.toString()}`);
  };

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-12 border-t border-zinc-200 dark:border-white/10 mt-16">
      <p className="text-sm font-medium text-zinc-500 dark:text-slate-400">
        Hiển thị <span className="text-zinc-900 dark:text-white font-bold">{total}</span> thuật ngữ
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-slate-300 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          {pages[0] > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                1
              </button>
              <span className="text-zinc-400">...</span>
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                p === currentPage
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}

          {pages[pages.length - 1] < totalPages && (
            <>
              <span className="text-zinc-400">...</span>
              <button
                onClick={() => handlePageChange(totalPages)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-slate-300 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
