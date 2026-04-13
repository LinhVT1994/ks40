'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({ currentPage, totalPages, total, label, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const btnCls = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/10 text-sm font-medium text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (currentPage <= 4) return i + 1 > 5 ? (i === 5 ? -1 : totalPages) : i + 1;
    if (currentPage >= totalPages - 3) return i < 1 ? i + 1 : (i === 1 ? -1 : totalPages - 6 + i);
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages][i];
  });

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-zinc-500 dark:text-slate-400">
        Trang {currentPage}/{totalPages} · {total.toLocaleString('vi-VN')} {label}
      </p>
      <div className="flex items-center gap-2">
        <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} className={btnCls}>
          <ChevronLeft className="w-4 h-4" /> Trước
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === -1 ? (
              <span key={`e-${i}`} className="px-1 text-zinc-500 dark:text-slate-300 text-sm">…</span>
            ) : (
              <button key={p} onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                  p === currentPage
                    ? 'bg-primary text-white'
                    : 'text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}>
                {p}
              </button>
            )
          )}
        </div>

        <button disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)} className={btnCls}>
          Sau <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
