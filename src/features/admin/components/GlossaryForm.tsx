'use client';

import React, { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Loader2, Eye, Edit3, Columns, 
  ArrowRight, Type, Tag, Info, BookOpen, ChevronLeft
} from 'lucide-react';
import { createGlossaryTermAction, updateGlossaryTermAction, type GlossaryTermFormData } from '@/features/admin/actions/glossary';
import type { TopicItem } from '@/features/admin/actions/topic';
import { toast } from 'sonner';
import { ArticleStatus } from '@prisma/client';
import MarkdownPreview from '@/components/shared/editor/MarkdownPreview';
import EditorToolbar from '@/components/shared/editor/EditorToolbar';
import TopicSelector from '@/components/shared/editor/TopicSelector';
import { Globe, FileText, Clock, AlertTriangle } from 'lucide-react';

type Term = {
  id: string;
  term: string;
  shortDef: string;
  definition: string;
  topicId: string | null;
  status: ArticleStatus;
};

interface GlossaryFormProps {
  initial?: Term;
  topics: TopicItem[];
}

export default function GlossaryForm({ initial, topics }: GlossaryFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [term, setTerm] = useState(initial?.term ?? '');
  const [shortDef, setShortDef] = useState(initial?.shortDef ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [topicId, setTopicId] = useState(initial?.topicId ?? '');
  const [status, setStatus] = useState<ArticleStatus>(initial?.status ?? ArticleStatus.PUBLISHED);
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('split');
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleNext = () => {
    if (!term.trim()) { toast.error('Vui lòng nhập tên thuật ngữ'); return; }
    if (!topicId) { toast.error('Vui lòng chọn chủ đề'); return; }
    if (!shortDef.trim()) { toast.error('Vui lòng nhập định nghĩa ngắn'); return; }
    setStep(2);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!definition.trim()) { toast.error('Vui lòng nhập nội dung chi tiết'); return; }

    const data: GlossaryTermFormData = { term, shortDef, definition, topicId: topicId || null, status };
    startTransition(async () => {
      const result = initial
        ? await updateGlossaryTermAction(initial.id, data)
        : await createGlossaryTermAction(data);
      if (result.success) {
        toast.success(initial ? 'Đã cập nhật thuật ngữ' : 'Đã tạo thuật ngữ');
        router.push('/admin/glossary');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-slate-900 min-h-full">
      {/* STEP CONTENT */}
      {step === 1 ? (
        /* STEP 1: METADATA (Article Step 1 Style) */
        <div className="p-6 md:p-12">
          <div className="max-w-5xl mx-auto">
            {/* Header Area */}
            <div className="mb-10 border-b border-zinc-200 dark:border-white/10 pb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">Thông tin thuật ngữ</h2>
                <p className="text-zinc-500 mt-1">Cung cấp các thông tin cơ bản và định nghĩa ngắn cho thuật ngữ.</p>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                   Bước 1 / 2
                 </div>
              </div>
            </div>

            <div className="space-y-10">
              {/* Term Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Type className="w-3.5 h-3.5" /> Tên thuật ngữ <span className="text-rose-500">*</span>
                </label>
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Nhập tên thuật ngữ (VD: P/E Ratio)..."
                  className="w-full max-w-xl text-base font-medium bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-zinc-800 dark:text-white placeholder:text-zinc-400"
                />
              </div>

              {/* Topic Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Chủ đề <span className="text-rose-500">*</span>
                </label>
                <TopicSelector 
                  topics={topics}
                  selectedId={topicId}
                  onSelect={setTopicId}
                />
              </div>

              {/* Short Definition */}
              <div className="space-y-2">
                <div className="flex items-center justify-between max-w-2xl">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" /> Định nghĩa ngắn (Tooltip) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-zinc-400">{shortDef.length}/200</span>
                </div>
                <textarea
                  value={shortDef}
                  onChange={e => setShortDef(e.target.value)}
                  rows={4}
                  placeholder="Viết định nghĩa ngắn gọn hiển thị khi di chuột qua thuật ngữ này..."
                  className="w-full max-w-2xl text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-zinc-800 dark:text-white placeholder:text-zinc-400 leading-relaxed"
                />
              </div>

              {/* Status Management */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Trạng thái hiển thị
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: ArticleStatus.PUBLISHED, label: 'Công khai', icon: Globe, desc: 'Hiển thị ngay lập tức' },
                    { id: ArticleStatus.DRAFT, label: 'Bản nháp', icon: FileText, desc: 'Chỉ Admin thấy' },
                    { id: ArticleStatus.PENDING, label: 'Chờ duyệt', icon: Clock, desc: 'Đang xem xét' },
                    { id: ArticleStatus.REJECTED, label: 'Từ chối', icon: AlertTriangle, desc: 'Không được duyệt' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      type="button"
                      className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left w-[180px] ${
                        status === s.id
                          ? 'bg-primary/5 border-primary ring-2 ring-primary/20'
                          : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <s.icon className={`w-3.5 h-3.5 ${status === s.id ? 'text-primary' : 'text-zinc-400'}`} />
                        <span className={status === s.id ? 'text-primary' : ''}>{s.label}</span>
                      </div>
                      <span className="text-[10px] opacity-60 leading-tight">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-8 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                <button
                  onClick={() => router.push('/admin/glossary')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-white/10 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20 transition-all"
                >
                  Hủy bỏ
                </button>
                <div className="flex items-center gap-4">
                  <p className="text-[11px] text-zinc-500 italic hidden sm:block">* Điền đủ các thông tin bắt buộc để tiếp tục</p>
                  <button
                    onClick={handleNext}
                    disabled={!term.trim() || !topicId || !shortDef.trim()}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-zinc-800 dark:bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
                  >
                    Tiếp theo: Viết nội dung
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: EDITOR (Article Step 2 Style) */
        <div className="h-[calc(100vh-64px)] flex flex-col min-w-0 overflow-hidden">

          <EditorToolbar viewMode={viewMode} onViewChange={setViewMode} onInsert={insertSyntax} />
          
          <div className="flex-1 flex overflow-hidden">
            {/* WRITE SPACE */}
            {(viewMode === 'editor' || viewMode === 'split') && (
              <div className={`flex flex-col h-full ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <div className="px-6 py-3 bg-zinc-50/50 dark:bg-white/[0.01] border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <BookOpen className="w-3 h-3" /> Markdown
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  value={definition}
                  onChange={e => setDefinition(e.target.value)}
                  placeholder="Sử dụng Markdown để viết định nghĩa đầy đủ..."
                  className="flex-1 w-full p-8 bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed text-zinc-800 dark:text-slate-200 placeholder:text-zinc-200 dark:placeholder:text-slate-800"
                  spellCheck={false}
                  autoFocus
                />
              </div>
            )}

            {/* PREVIEW SPACE */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={`flex flex-col h-full ${viewMode === 'split' ? 'w-1/2 border-l border-zinc-200 dark:border-white/10' : 'w-full'} overflow-hidden bg-white dark:bg-slate-900`}>
                <div className="px-6 py-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01] flex items-center justify-between shrink-0">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Preview</span>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex-1 overflow-y-auto p-10 prose prose-zinc lg:prose-lg dark:prose-invert max-w-none">
                  <MarkdownPreview content={definition} />
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM CONTROLS */}
          <div className="px-6 py-4 shrink-0 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between z-[40]">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              QUAY LẠI BƯỚC 1
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-zinc-800 dark:bg-primary text-white text-xs font-black tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-zinc-800/10 dark:shadow-primary/20 active:scale-95"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {initial ? 'CẬP NHẬT THUẬT NGỮ' : 'HOÀN TẤT & LƯU'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
