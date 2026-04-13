'use client';

import React, { useState, useTransition } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Globe, Users, Star, Lock, Loader2, X, Check } from 'lucide-react';
import { createSeriesAction, updateSeriesAction, deleteSeriesAction } from '@/features/admin/actions/series';
import type { SeriesSummary } from '@/features/admin/actions/series';
import { ArticleAudience } from '@prisma/client';

const AUDIENCE_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  PUBLIC:  { label: 'Public',   icon: Globe,  className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  MEMBERS: { label: 'Members',  icon: Users,  className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  PREMIUM: { label: 'Premium',  icon: Star,   className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  PRIVATE: { label: 'Private',  icon: Lock,   className: 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-slate-400' },
};

function toSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

type FormState = {
  title: string;
  slug: string;
  description: string;
  audience: string;
};

function SeriesModal({
  initial,
  onClose,
  onSubmit,
  isPending,
  error,
  mode,
}: {
  initial?: Partial<FormState>;
  onClose: () => void;
  onSubmit: (data: FormState) => void;
  isPending: boolean;
  error: string | null;
  mode: 'create' | 'edit';
}) {
  const [form, setForm] = useState<FormState>({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    audience: initial?.audience ?? 'PUBLIC',
  });

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-zinc-300 dark:border-white/10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-white/5">
          <h2 className="text-lg font-bold text-zinc-800 dark:text-white">
            {mode === 'create' ? 'Tạo series mới' : 'Chỉnh sửa series'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2.5 rounded-xl">{error}</p>
          )}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tiêu đề</label>
            <input
              className="mt-1.5 w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary text-zinc-800 dark:text-white"
              value={form.title}
              onChange={e => { set('title', e.target.value); set('slug', toSlug(e.target.value)); }}
              placeholder="Ví dụ: System Design từ A–Z"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Slug</label>
            <input
              className="mt-1.5 w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-primary text-zinc-800 dark:text-white"
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mô tả (tuỳ chọn)</label>
            <textarea
              className="mt-1.5 w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary text-zinc-800 dark:text-white resize-none"
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Audience</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(AUDIENCE_CONFIG).map(([k, cfg]) => (
                <button
                  key={k}
                  onClick={() => set('audience', k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    form.audience === k
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-zinc-300 dark:border-white/10 text-zinc-500 hover:border-primary/30'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-white border border-zinc-300 dark:border-white/10 transition-colors">
            Huỷ
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={isPending || !form.title || !form.slug}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {mode === 'create' ? 'Tạo series' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SeriesClient({ series: initial }: { series: SeriesSummary[] }) {
  const [series, setSeries] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<SeriesSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = (form: FormState) => {
    setError(null);
    startTransition(async () => {
      const result = await createSeriesAction({
        title: form.title,
        slug: form.slug,
        description: form.description || undefined,
        audience: form.audience as ArticleAudience,
      });
      if (result.success) {
        setShowCreate(false);
        // Optimistic: add placeholder, rely on revalidation for real data
        setSeries(prev => [
          { id: result.id, title: form.title, slug: form.slug, audience: form.audience as ArticleAudience, thumbnail: null, _count: { articles: 0 } },
          ...prev,
        ]);
      } else {
        setError(result.error);
      }
    });
  };

  const handleEdit = (form: FormState) => {
    if (!editItem) return;
    setError(null);
    startTransition(async () => {
      const result = await updateSeriesAction(editItem.id, {
        title: form.title,
        slug: form.slug,
        description: form.description || undefined,
        audience: form.audience as ArticleAudience,
      });
      if (result.success) {
        setSeries(prev => prev.map(s =>
          s.id === editItem.id
            ? { ...s, title: form.title, slug: form.slug, audience: form.audience as ArticleAudience }
            : s
        ));
        setEditItem(null);
      } else {
        setError(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      await deleteSeriesAction(id);
      setSeries(prev => prev.filter(s => s.id !== id));
      setDeletingId(null);
    });
  };

  return (
    <>
      {(showCreate || editItem) && (
        <SeriesModal
          mode={showCreate ? 'create' : 'edit'}
          initial={editItem ? { title: editItem.title, slug: editItem.slug, audience: editItem.audience } : undefined}
          onClose={() => { setShowCreate(false); setEditItem(null); setError(null); }}
          onSubmit={showCreate ? handleCreate : handleEdit}
          isPending={isPending}
          error={error}
        />
      )}

      <div className="space-y-4">
        {/* Create button */}
        <button
          onClick={() => { setShowCreate(true); setError(null); }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Tạo series mới
        </button>

        {series.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
            <BookOpen className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">Chưa có series nào</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-300 dark:border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-white/5 border-b border-zinc-300 dark:border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tiêu đề</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Slug</th>
                  <th className="text-center px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Bài viết</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Audience</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {series.map(s => {
                  const aud = AUDIENCE_CONFIG[s.audience];
                  const AudIcon = aud?.icon ?? Globe;
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-zinc-800 dark:text-white truncate max-w-[200px]">{s.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="font-mono text-xs text-zinc-500">{s.slug}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-zinc-600 dark:text-slate-300">{s._count.articles}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${aud?.className}`}>
                          <AudIcon className="w-3 h-3" />
                          {aud?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => { setEditItem(s); setError(null); }}
                            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 hover:text-primary transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 transition-colors disabled:opacity-50"
                          >
                            {deletingId === s.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
