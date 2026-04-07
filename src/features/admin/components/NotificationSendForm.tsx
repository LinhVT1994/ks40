'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { Send, X, Users, User, Loader2, CheckCheck, Plus, FileText, MessageSquare, Heart, Zap } from 'lucide-react';
import { sendNotificationAction } from '@/features/admin/actions/notifications';

type UserOption = { id: string; name: string; email: string };

const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  SYSTEM:        { icon: Zap,           color: 'text-rose-500',   bg: 'bg-rose-500/10',   label: 'Hệ thống'  },
  NEW_ARTICLE:   { icon: FileText,      color: 'text-blue-500',   bg: 'bg-blue-500/10',   label: 'Bài viết'  },
  COMMENT_REPLY: { icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10', label: 'Bình luận' },
  LIKE:          { icon: Heart,         color: 'text-pink-500',   bg: 'bg-pink-500/10',   label: 'Yêu thích' },
};

export default function NotificationSendForm({
  users, onSent, alwaysOpen,
}: {
  users: UserOption[];
  onSent: () => void;
  alwaysOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    target: 'broadcast' as 'broadcast' | 'users',
    userIds: [] as string[],
    type: 'SYSTEM' as string,
    title: '',
    message: '',
    link: '',
  });
  const [mention, setMention] = useState('');       // text after @
  const [showMention, setShowMention] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const mentionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleUser = (id: string) =>
    setForm(f => ({
      ...f,
      userIds: f.userIds.includes(id) ? f.userIds.filter(u => u !== id) : [...f.userIds, id],
    }));

  const mentionResults = mention.length > 0
    ? users.filter(u =>
        !form.userIds.includes(u.id) &&
        (u.name.toLowerCase().includes(mention.toLowerCase()) ||
         u.email.toLowerCase().includes(mention.toLowerCase()))
      ).slice(0, 6)
    : [];

  const selectMention = (id: string) => {
    toggleUser(id);
    setMention('');
    setShowMention(false);
    setHighlightIdx(0);
    inputRef.current?.focus();
  };

  const handleMentionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '@' || val.startsWith('@')) {
      setMention(val.slice(1));
      setShowMention(true);
      setHighlightIdx(0);
    } else {
      setMention('');
      setShowMention(false);
    }
  };

  const handleMentionKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMention || mentionResults.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, mentionResults.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); selectMention(mentionResults[highlightIdx].id); }
    if (e.key === 'Escape')    { setShowMention(false); }
  };

  useEffect(() => {
    if (!showMention) return;
    const handler = (e: MouseEvent) => {
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node))
        setShowMention(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMention]);

  const handleSend = () => {
    if (!form.title.trim()) return;
    startTransition(async () => {
      await sendNotificationAction({
        broadcast: form.target === 'broadcast',
        userIds: form.target === 'users' ? form.userIds : undefined,
        type: form.type as any,
        title: form.title.trim(),
        message: form.message.trim() || undefined,
        link: form.link.trim() || undefined,
      });
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setOpen(false);
        setForm({ target: 'broadcast', userIds: [], type: 'SYSTEM', title: '', message: '', link: '' });
        onSent();
      }, 1500);
    });
  };

  if (!open && !alwaysOpen) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-primary/20">
        <Plus className="w-4 h-4" /> Gửi thông báo
      </button>
    );
  }

  const selectedUsers = users.filter(u => form.userIds.includes(u.id));

  const inputCls = 'w-full px-4 py-3 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white placeholder:text-slate-400 transition-all';

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Soạn thông báo</h3>
        {!alwaysOpen && (
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Target + Type — inline rows */}
      {/* Target */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đối tượng nhận</p>
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'broadcast', label: 'Tất cả người dùng', icon: Users },
            { key: 'users',     label: 'Người dùng cụ thể', icon: User  },
          ] as const).map(t => (
            <button key={t.key} type="button" onClick={() => set('target', t.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-sm font-semibold transition-all w-fit ${
                form.target === t.key
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 dark:border-white/10 text-slate-500 bg-slate-50 dark:bg-white/5 hover:border-slate-300'
              }`}>
              <t.icon className="w-4 h-4 shrink-0" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loại thông báo</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_CFG).map(([key, c]) => {
            const TIcon = c.icon;
            const isActive = form.type === key;
            return (
              <button key={key} type="button" onClick={() => set('type', key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-sm font-semibold transition-all w-fit ${
                  isActive ? `${c.bg} ${c.color} border-transparent` : 'border-slate-200 dark:border-white/10 text-slate-500 bg-slate-50 dark:bg-white/5 hover:border-slate-300'
                }`}>
                <TIcon className="w-4 h-4 shrink-0" />{c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* User mention picker */}
      {form.target === 'users' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Người nhận</p>

          {/* Chips + input box */}
          <div ref={mentionRef} className="relative">
            <div
              onClick={() => inputRef.current?.focus()}
              className="min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-text focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              {selectedUsers.map(u => (
                <span key={u.id} className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  @{u.name}
                  <button type="button" onClick={() => toggleUser(u.id)}
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                value={showMention ? `@${mention}` : ''}
                onChange={handleMentionInput}
                onKeyDown={handleMentionKey}
                placeholder={selectedUsers.length === 0 ? 'Gõ @ để tìm người dùng...' : '@'}
                className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-slate-700 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Mention dropdown */}
            {showMention && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                {mentionResults.length > 0 ? mentionResults.map((u, i) => (
                  <button key={u.id} type="button" onMouseDown={() => selectMention(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${i === highlightIdx ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
                      {u.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </button>
                )) : mention.length > 0 ? (
                  <p className="px-4 py-4 text-sm text-slate-400 text-center">Không tìm thấy người dùng</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiêu đề <span className="text-rose-400 normal-case">*</span></p>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Nhập tiêu đề thông báo..."
          className={inputCls} />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nội dung phụ</p>
        <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={5}
          placeholder="Mô tả thêm..."
          className={`${inputCls} resize-none`} />
      </div>

      {/* Link */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Link điều hướng</p>
        <input value={form.link} onChange={e => set('link', e.target.value)}
          placeholder="/..."
          className={inputCls} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          {form.target === 'broadcast'
            ? <><Users className="w-3.5 h-3.5" /> {users.length} người dùng</>
            : selectedUsers.length > 0 ? `${selectedUsers.length} người được chọn` : 'Chưa chọn người dùng'
          }
        </p>
        <button onClick={handleSend}
          disabled={!form.title.trim() || (form.target === 'users' && !form.userIds.length) || isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            done ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:opacity-90'
          }`}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCheck className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {isPending ? 'Đang gửi...' : done ? 'Đã gửi!' : 'Gửi ngay'}
        </button>
      </div>
    </div>
  );
}
