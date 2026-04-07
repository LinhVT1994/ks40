'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { GripVertical, Trash2, Plus, ArrowLeft, Play, Globe, Lock, Layers, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteChapterAction, reorderChaptersAction, updateChapterAction } from '@/features/admin/actions/book';

type Chapter = { id: string; title: string; slug: string; order: number; isFree: boolean; content?: string };
type Book    = { id: string; title: string; slug: string; chapters: Chapter[] };

export default function BookEditorClient({ book }: { book: Book }) {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>(book.chapters);
  const [dragging, setDragging] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Xoá chapter này?')) return;
    setChapters(prev => prev.filter(c => c.id !== id));
    startTransition(async () => {
      await deleteChapterAction(id);
      router.refresh();
    });
  };

  const toggleFree = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chapter = chapters.find(c => c.id === id);
    if (!chapter) return;
    const next = !chapter.isFree;
    setChapters(prev => prev.map(c => c.id === id ? { ...c, isFree: next } : c));
    startTransition(async () => {
      await updateChapterAction(id, { isFree: next });
      router.refresh();
    });
  };

  const onDragStart = (id: string) => setDragging(id);
  const onDragOver  = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragging || dragging === targetId) return;
    const from = chapters.findIndex(c => c.id === dragging);
    const to   = chapters.findIndex(c => c.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...chapters];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setChapters(next.map((c, i) => ({ ...c, order: i + 1 })));
  };
  const onDragEnd = () => {
    setDragging(null);
    const orders = chapters.map((c, i) => ({ id: c.id, order: i + 1 }));
    startTransition(async () => {
      await reorderChaptersAction(book.id, orders);
      router.refresh();
    });
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-10 flex flex-col pb-20 animate-in fade-in duration-700 font-sans">
      {/* Header - Phẳng & Clean (Tham khảo Quản lý Nội dung) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1 py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-1">Biên soạn sách</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {chapters.length} chương nội dung trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/books/${book.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/10 transition-all border border-slate-100 dark:border-white/5 shadow-sm shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Xem Landing page
          </Link>
          <Link 
            href={`/admin/books/${book.id}/chapters/new`}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Thêm chương mới
          </Link>
        </div>
      </div>

      {/* Danh sách chương - Table style */}
      <div className="flex flex-col">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-100 dark:border-white/5 mb-2">
          <div className="w-12 shrink-0"></div>
          <div className="flex-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề</div>
          <div className="w-32 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Quyền</div>
          <div className="w-32 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right pr-4">Hành động</div>
        </div>

        <div className="space-y-1">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              draggable
              onDragStart={() => onDragStart(chapter.id)}
              onDragOver={e => onDragOver(e, chapter.id)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02] border border-transparent transition-all group ${dragging === chapter.id ? 'opacity-40 scale-95 grayscale' : ''}`}
            >
              <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-primary transition-colors shrink-0">
                <GripVertical className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex flex-col">
                  <Link 
                    href={`/admin/books/${book.id}/chapters/${chapter.id}`} 
                    className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary transition-colors truncate tracking-tight"
                  >
                    {chapter.title}
                  </Link>
                  <span className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider font-medium font-sans">Chương {chapter.order.toString().padStart(2, '0')}</span>
                </div>
              </div>
              
              <div className="w-32 shrink-0 flex justify-center">
                <button
                  onClick={(e) => toggleFree(chapter.id, e)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    chapter.isFree 
                      ? 'text-emerald-500 bg-emerald-500/10' 
                      : 'text-amber-500 bg-amber-500/10'
                  }`}
                >
                  {chapter.isFree ? 'Miễn phí' : 'Premium'}
                </button>
              </div>

              <div className="w-32 shrink-0 flex items-center justify-end gap-2 pr-2">
                <Link
                  href={`/admin/books/${book.id}/chapters/${chapter.id}`}
                  className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                  title="Chỉnh sửa nội dung"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button
                  onClick={(e) => handleDelete(chapter.id, e)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                  title="Xóa chương này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {chapters.length === 0 && (
            <div className="text-center py-32 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[4rem] bg-slate-50/50 dark:bg-white/[0.01]">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white dark:bg-white/5 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5">
                <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Lộ trình chương đang trống</h3>
              <p className="text-sm font-medium text-slate-400 mt-3 mb-10 max-w-sm mx-auto leading-relaxed">Cuốn sách này chưa có chương nào. Hãy bắt đầu xây dựng cấu trúc nội dung để giúp học viên dễ dàng theo dõi nhé.</p>
              <Link href={`/admin/books/${book.id}/chapters/new`} className="inline-flex items-center gap-3 px-10 py-4 rounded-[2rem] bg-primary text-white hover:bg-primary/95 transition-all font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:-translate-y-1">
                <Plus className="w-5 h-5" /> Bắt đầu tạo ngay
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
