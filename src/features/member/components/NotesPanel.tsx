'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  StickyNote,
  X,
  Plus,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import {
  getNotesAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  type NoteItem,
} from '@/features/member/actions/note';

// ── Color palette ───────────────────────────────────────────────────

const NOTE_COLORS = [
  {
    key: 'yellow',
    label: 'Vàng',
    card: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-300 dark:border-yellow-500/30',
    border: 'border-yellow-400 dark:border-yellow-500',
    dot: 'bg-yellow-400',
  },
  {
    key: 'blue',
    label: 'Xanh dương',
    card: 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30',
    border: 'border-blue-400 dark:border-blue-500',
    dot: 'bg-blue-400',
  },
  {
    key: 'green',
    label: 'Xanh lá',
    card: 'bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/30',
    border: 'border-green-400 dark:border-green-500',
    dot: 'bg-green-400',
  },
  {
    key: 'pink',
    label: 'Hồng',
    card: 'bg-pink-50 dark:bg-pink-500/10 border-pink-300 dark:border-pink-500/30',
    border: 'border-pink-400 dark:border-pink-500',
    dot: 'bg-pink-400',
  },
  {
    key: 'purple',
    label: 'Tím',
    card: 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30',
    border: 'border-purple-400 dark:border-purple-500',
    dot: 'bg-purple-400',
  },
] as const;

type ColorKey = (typeof NOTE_COLORS)[number]['key'];

function getColorConfig(key: string) {
  return NOTE_COLORS.find((c) => c.key === key) ?? NOTE_COLORS[0];
}

// ── Color dot selector ──────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: ColorKey;
  onChange: (c: ColorKey) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {NOTE_COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          title={c.label}
          onClick={() => onChange(c.key)}
          className={`w-5 h-5 rounded-full ${c.dot} transition-transform ${
            value === c.key
              ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-slate-400 dark:ring-slate-500 scale-110'
              : 'hover:scale-110'
          }`}
        />
      ))}
    </div>
  );
}

// ── Note card ───────────────────────────────────────────────────────

function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: NoteItem;
  onUpdate: (id: string, data: { title?: string; content?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title ?? '');
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState<ColorKey>((note.color as ColorKey) ?? 'yellow');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colorCfg = getColorConfig(color);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onUpdate(note.id, { title: title.trim() || undefined, content: content.trim(), color });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // reset
      setTitle(note.title ?? '');
      setContent(note.content);
      setColor((note.color as ColorKey) ?? 'yellow');
      setEditing(false);
    }
  };

  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(note.createdAt));

  return (
    <div
      className={`group relative rounded-xl border border-l-4 ${colorCfg.card} ${colorCfg.border} p-3 transition-all duration-200`}
    >
      {/* Delete button */}
      {!editing && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(note.id)}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 transition-colors"
              >
                Xoá
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors"
              >
                Huỷ
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
              title="Xoá ghi chú"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề (tuỳ chọn)"
            className="w-full text-xs font-semibold bg-transparent border-b border-slate-200 dark:border-slate-700 pb-1 outline-none placeholder:text-slate-400 text-slate-700 dark:text-slate-200 focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
          />
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className="w-full text-sm bg-transparent outline-none resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            placeholder="Nội dung ghi chú..."
          />
          <div className="flex items-center justify-between pt-1">
            <ColorPicker value={color} onChange={setColor} />
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setTitle(note.title ?? '');
                  setContent(note.content);
                  setColor((note.color as ColorKey) ?? 'yellow');
                  setEditing(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="cursor-pointer"
          onClick={() => setEditing(true)}
          title="Nhấp để chỉnh sửa"
        >
          {note.title && (
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 truncate pr-6">
              {note.title}
            </p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-4">
            {note.content}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">{formattedDate}</p>
        </div>
      )}
    </div>
  );
}

// ── Add note form ───────────────────────────────────────────────────

function AddNoteForm({ onAdd, onCancel }: { onAdd: (note: NoteItem) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<ColorKey>('yellow');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const note = await createNoteAction({
        title: title.trim() || undefined,
        content: content.trim(),
        color,
      });
      onAdd(note);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 p-3 space-y-2 shadow-sm">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề (tuỳ chọn)"
        className="w-full text-xs font-semibold bg-transparent border-b border-slate-200 dark:border-slate-700 pb-1 outline-none placeholder:text-slate-400 text-slate-800 dark:text-white focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
      />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
        placeholder="Nội dung ghi chú... (Ctrl+Enter để lưu)"
        className="w-full text-sm bg-transparent outline-none resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
      />
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-700 dark:hover:bg-slate-100 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────

export default function NotesPanel() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotesAction();
      setNotes(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !initialized) {
      setInitialized(true);
      loadNotes();
    }
  }, [isOpen, initialized, loadNotes]);

  // Listen for toggle event from ProductivityHub
  useEffect(() => {
    const handler = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-global-notes', handler);
    return () => window.removeEventListener('toggle-global-notes', handler);
  }, []);

  // Only render for authenticated users
  if (status === 'unauthenticated' || status === 'loading' || !session) return null;

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setShowAddForm(false);
  };

  const handleAdd = (note: NoteItem) => {
    setNotes((prev) => [note, ...prev]);
    setShowAddForm(false);
  };

  const handleUpdate = async (
    id: string,
    data: { title?: string; content?: string; color?: string },
  ) => {
    const updated = await updateNoteAction(id, data);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  const handleDelete = async (id: string) => {
    await deleteNoteAction(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const noteCount = notes.length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 right-0 w-80 sm:w-96 z-50 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h2 className="font-bold text-sm text-slate-800 dark:text-white">Ghi chú của tôi</h2>
            {noteCount > 0 && (
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-1.5 py-0.5">
                {noteCount}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Add form */}
          {showAddForm && (
            <AddNoteForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : notes.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <StickyNote className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              <p className="text-sm text-slate-400 dark:text-slate-500">Chưa có ghi chú nào</p>
              <p className="text-xs text-slate-300 dark:text-slate-600">
                Nhấn &quot;+&quot; để thêm ghi chú mới
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Footer — add button */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 dark:border-white/10">
          <button
            onClick={() => {
              setShowAddForm(true);
            }}
            disabled={showAddForm}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Thêm ghi chú
          </button>
        </div>
      </div>
    </>
  );
}
