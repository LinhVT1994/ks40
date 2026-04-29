'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Edit2, Trash2, Plus, Search, BookOpen, X, Loader2 } from 'lucide-react';
import { deleteGlossaryTermAction, createGlossaryTermAction, updateGlossaryTermAction, type GlossaryTermFormData } from '@/features/admin/actions/glossary';
import type { getGlossaryTermsAction } from '@/features/admin/actions/glossary';
import type { TopicItem } from '@/features/admin/actions/topic';
import { toast } from 'sonner';
import MarkdownPreview from '@/components/shared/editor/MarkdownPreview';
import EditorToolbar from '@/components/shared/editor/EditorToolbar';

type Terms = Awaited<ReturnType<typeof getGlossaryTermsAction>>['terms'];
type Term = Terms[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

interface GlossaryFormProps {
  initial?: Term;
  topics: TopicItem[];
  onClose: () => void;
  onSaved: () => void;
}

function GlossaryForm({ initial, topics, onClose, onSaved }: GlossaryFormProps) {
  const [term, setTerm] = useState(initial?.term ?? '');
  const [shortDef, setShortDef] = useState(initial?.shortDef ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [topicId, setTopicId] = useState(initial?.topicId ?? '');
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('split');
  const [isPending, startTransition] = useTransition();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertSyntax = (syntax: string, wrap = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = definition.substring(start, end);
    let newContent: string;
    let cursorPos: number;
    if (wrap) {
      newContent = definition.substring(0, start) + syntax + selected + syntax + definition.substring(end);
      cursorPos = selected ? end + syntax.length * 2 : start + syntax.length;
    } else {
      newContent = definition.substring(0, start) + syntax + selected + definition.substring(end);
      cursorPos = start + syntax.length + selected.length;
    }
    setDefinition(newContent);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(cursorPos, cursorPos); }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !shortDef.trim() || !definition.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const data: GlossaryTermFormData = { term, shortDef, definition, topicId: topicId || null };
    startTransition(async () => {
      const result = initial
        ? await updateGlossaryTermAction(initial.id, data)
        : await createGlossaryTermAction(data);
      if (result.success) {
        toast.success(initial ? 'Đã cập nhật thuật ngữ' : 'Đã tạo thuật ngữ');
        onSaved();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-8 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10">
          <h2 className="text-lg font-bold text-zinc-800 dark:text-white">
            {initial ? 'Chỉnh sửa thuật ngữ' : 'Thêm thuật ngữ mới'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">Thuật ngữ *</label>
              <input
                value={term}
                onChange={e => setTerm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="VD: P/E Ratio"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">Chủ đề</label>
              <select
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Không có chủ đề</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.emoji ? `${t.emoji} ` : ''}{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">Định nghĩa ngắn (tooltip) *</label>
            <input
              value={shortDef}
              onChange={e => setShortDef(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Định nghĩa ngắn gọn hiển thị khi hover"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">Giải thích đầy đủ (Markdown) *</label>
            <div className="border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden">
              <EditorToolbar viewMode={viewMode} onViewChange={setViewMode} onInsert={insertSyntax} />
              <div className={`grid ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} min-h-[280px]`}>
                {viewMode !== 'preview' && (
                  <textarea
                    ref={textareaRef}
                    value={definition}
                    onChange={e => setDefinition(e.target.value)}
                    className="w-full h-[280px] p-4 bg-zinc-50 dark:bg-slate-950 text-zinc-800 dark:text-slate-200 text-sm font-mono resize-none focus:outline-none border-r border-zinc-200 dark:border-white/10"
                    placeholder="Viết giải thích đầy đủ bằng Markdown..."
                  />
                )}
                {viewMode !== 'editor' && (
                  <div className="h-[280px] overflow-y-auto p-4 bg-white dark:bg-slate-900">
                    <MarkdownPreview content={definition} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-slate-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? 'Lưu thay đổi' : 'Tạo thuật ngữ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GlossaryClientProps {
  terms: Terms;
  total: number;
  totalPages: number;
  currentPage: number;
  topics: TopicItem[];
}

export default function GlossaryClient({ terms, total, totalPages, currentPage, topics }: GlossaryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<{ open: boolean; editing?: Term }>({ open: false });
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = (term: Term) => {
    if (!confirm(`Xóa thuật ngữ "${term.term}"?`)) return;
    startTransition(async () => {
      const result = await deleteGlossaryTermAction(term.id);
      if (result.success) toast.success('Đã xóa thuật ngữ');
      else toast.error(result.error);
    });
  };

  const handleSaved = () => {
    setFormState({ open: false });
    router.refresh();
  };

  return (
    <>
      {formState.open && (
        <GlossaryForm
          initial={formState.editing}
          topics={topics}
          onClose={() => setFormState({ open: false })}
          onSaved={handleSaved}
        />
      )}

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              defaultValue={searchParams.get('search') ?? ''}
              onChange={e => updateParam('search', e.target.value)}
              placeholder="Tìm thuật ngữ..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={() => setFormState({ open: true })}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors ml-auto"
          >
            <Plus className="w-4 h-4" /> Thêm thuật ngữ
          </button>
        </div>

        {/* Table */}
        {terms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-10 h-10 text-zinc-300 dark:text-slate-600 mb-3" />
            <p className="text-zinc-500 dark:text-slate-400 font-medium">Chưa có thuật ngữ nào</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-white/[0.03] border-b border-zinc-200 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500">Thuật ngữ</th>
                  <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500 hidden md:table-cell">Định nghĩa ngắn</th>
                  <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500 hidden lg:table-cell">Chủ đề</th>
                  <th className="px-5 py-3 text-left font-semibold text-zinc-500 dark:text-slate-500 hidden lg:table-cell">Ngày tạo</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {terms.map(t => (
                  <tr key={t.id} className="group hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-800 dark:text-white">{t.term}</div>
                      <div className="text-xs text-zinc-400 dark:text-slate-500 font-mono mt-0.5">{t.slug}</div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-zinc-600 dark:text-slate-400 line-clamp-2 max-w-xs">{t.shortDef}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {t.topic ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: `${t.topic.color ?? '#64748b'}20`, color: t.topic.color ?? '#64748b' }}>
                          {t.topic.label}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-400 dark:text-slate-500 hidden lg:table-cell text-xs">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setFormState({ open: true, editing: t })}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-slate-400">
            <span>{total} thuật ngữ</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`${pathname}?${params.toString()}`); }}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === currentPage ? 'bg-primary text-white' : 'hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
