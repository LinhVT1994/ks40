'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Plus, Search, Book, Layers, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  deleteBookAction,
  type BookSummary,
} from '@/features/admin/actions/book';

const AUDIENCE_CONFIG: Record<string, { label: string; className: string }> = {
  PUBLIC:  { label: 'Public',  className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  MEMBERS: { label: 'Members', className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  PREMIUM: { label: 'Premium', className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
};

// ── Main component ─────────────────────────────────────────────────

export default function BookClient({ books }: { books: BookSummary[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = (id: string) => {
    if (!confirm('Xoá book này? Tất cả chapters sẽ bị xoá theo.')) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteBookAction(id);
      router.refresh();
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm book..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-slate-400 shadow-sm"
          />
        </div>
        <Link
          href="/admin/books/create"
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Tạo Book mới
        </Link>
      </div>

      {/* Book list */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map(book => (
          <div
            key={book.id}
            className="flex flex-col md:flex-row gap-6 p-5 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl hover:border-primary/30 dark:hover:border-primary/20 transition-all group"
          >
            {/* Cover */}
            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 relative shrink-0 shadow-sm border border-slate-100 dark:border-white/5">
              {book.cover ? (
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-white/10">
                  <Book className="w-10 h-10" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/20 ${AUDIENCE_CONFIG[book.audience]?.className}`}>
                  {AUDIENCE_CONFIG[book.audience]?.label}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate font-display group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  {book.published ? (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Đã đăng</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Nháp</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed max-w-2xl">
                  {(book as any).description || 'Chưa có mô tả.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-y-3 gap-x-6 mt-4 md:mt-0">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary/60" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{book._count.chapters} Chapters</span>
                </div>
                <span className="text-xs text-slate-500">Tạo bởi {book.author.name}</span>
                <span className="text-xs text-slate-500">{new Intl.DateTimeFormat('vi-VN').format(new Date(book.createdAt))}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center md:flex-col justify-end gap-2 md:pl-6 md:border-l md:border-slate-100 md:dark:border-white/5">
              <Link
                href={`/admin/books/${book.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
              >
                <Settings2 className="w-3.5 h-3.5" /> Sửa Book
              </Link>
              <Link
                href={`/admin/books/${book.id}/chapters`}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" /> Sửa Chapters
              </Link>
              <button
                onClick={() => handleDelete(book.id)}
                disabled={deletingId === book.id}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all disabled:opacity-40"
                title="Xoá book"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <div className="inline-flex p-4 bg-slate-100 dark:bg-white/5 rounded-full mb-4">
              <Book className="w-8 h-8 text-slate-300 dark:text-white/20" />
            </div>
            <h4 className="text-slate-900 dark:text-white font-bold">Chưa có Book nào</h4>
            <p className="text-sm text-slate-500 mt-1">Bắt đầu bằng cách tạo một cuốn sách mới!</p>
          </div>
        )}
      </div>
    </div>
  );
}
