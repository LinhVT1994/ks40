"use client";

import React, { useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSiteConfigAction, setSiteConfigAction } from '@/features/admin/actions/config';
import { TopicItem, getTopicTreeAction, getEnabledTopicTreeAction, saveTopicsAction } from '@/features/admin/actions/topic';
import Link from 'next/link';
import { getTagsWithCountAction, createTagAction, updateTagAction, deleteTagAction } from '@/features/admin/actions/taxonomy';
import AdminHeader from '@/features/admin/components/AdminHeader';
import {
  Globe, User, FileText, Users, Bell, Palette,
  Save, Eye, EyeOff, Upload, Check, Sparkles, GripVertical, Pencil, Plus, Trash2,
  Tag, Award, Loader2, Hash, Search,
  Folder, ChevronRight, X, ExternalLink,
} from 'lucide-react';

/* ─── Reusable Modal ────────────────────────────────────────── */
function AddModal({ isOpen, onClose, onConfirm, title, isPending }: { isOpen: boolean; onClose: () => void; onConfirm: (val: { label: string; slug: string; color: string }) => void; title: string; isPending?: boolean; }) {
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#3b82f6');
  React.useEffect(() => { if (isOpen) { setLabel(''); setSlug(''); setColor('#3b82f6'); } }, [isOpen]);
  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const handleLabelChange = (v: string) => { setLabel(v); if (!slug || slug === autoSlug(label)) setSlug(autoSlug(v)); };
  const submit = () => { if (label.trim() && slug.trim()) onConfirm({ label: label.trim(), slug: slug.trim(), color }); };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-zinc-800/40 backdrop-blur-sm transition-opacity" />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-zinc-300/60 dark:border-white/10 shadow-2xl rounded-2xl p-8 animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold mb-6 text-zinc-800 dark:text-white">{title}</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tên nhóm</p>
            <input autoFocus value={label} onChange={e => handleLabelChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose(); }} placeholder="Ví dụ: Công nghệ, Đời sống..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl outline-none focus:border-primary/30 transition-all text-sm" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Slug</p>
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="ten-nhom" className="w-full px-4 py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl outline-none focus:border-primary/30 transition-all text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Màu</p>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-[46px] rounded-2xl cursor-pointer border border-zinc-200 dark:border-white/5 bg-transparent p-1 overflow-hidden" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 font-bold text-zinc-500 hover:text-zinc-700 transition-colors text-sm">Huỷ</button>
            <button onClick={submit} disabled={!label.trim() || !slug.trim() || isPending} className="px-6 py-2.5 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-30 transition-all shadow-lg shadow-primary/20 text-sm">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Thêm ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTagModal({ isOpen, onClose, onConfirm, isPending }: { isOpen: boolean; onClose: () => void; onConfirm: (name: string) => void; isPending?: boolean }) {
  const [val, setVal] = useState('');
  React.useEffect(() => { if (isOpen) setVal(''); }, [isOpen]);
  const submit = () => { if (val.trim()) onConfirm(val.trim()); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-zinc-800/40 backdrop-blur-sm transition-opacity" />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-zinc-300/60 dark:border-white/10 shadow-2xl rounded-2xl p-8 animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl font-bold mb-6 text-zinc-800 dark:text-white">Thêm tag mới</h2>
        <div className="space-y-6">
          <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose(); }} placeholder="Tên tag (ví dụ: Marketing, Tip...)" className="w-full px-4 py-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl outline-none focus:border-primary/30 transition-all text-sm" />
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 font-bold text-zinc-500 hover:text-zinc-700 transition-colors text-sm">Huỷ</button>
            <button onClick={submit} disabled={!val.trim() || isPending} className="px-6 py-2.5 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-30 transition-all shadow-lg shadow-primary/20 text-sm">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Thêm ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Types ─────────────────────────────────────────────────── */
type TabKey = 'website' | 'account' | 'content' | 'members' | 'notifications' | 'appearance' | 'onboarding' | 'topics' | 'tags' | 'badges';

const SOON_TABS = new Set<TabKey>(['website', 'account', 'content', 'members', 'notifications', 'appearance']);

const tabs: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: 'website',       icon: Globe,        label: 'Trang web'    },
  { key: 'account',       icon: User,         label: 'Tài khoản'    },
  { key: 'content',       icon: FileText,     label: 'Nội dung'     },
  { key: 'members',       icon: Users,        label: 'Thành viên'   },
  { key: 'notifications', icon: Bell,         label: 'Thông báo'    },
  { key: 'appearance',    icon: Palette,      label: 'Giao diện'    },
  { key: 'onboarding',    icon: Sparkles,     label: 'Onboarding'   },
  { key: 'topics',        icon: Folder,       label: 'Chủ đề'       },
  { key: 'tags',          icon: Tag,          label: 'Tags'         },
  { key: 'badges',        icon: Award,        label: 'Badges'       },
];

type OnboardingItem = { value: string; label: string; emoji: string; color: string; enabled: boolean };
type ConfigItem = OnboardingItem;

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ec4899', '#f43f5e', '#06b6d4', '#64748b',
];

/* ─── Reusable UI Components ───────────────────────────────── */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-base font-bold text-zinc-800 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8">
      <div className="md:w-52 shrink-0">
        <p className="text-sm font-semibold text-zinc-700 dark:text-slate-300">{label}</p>
        {hint && <p className="text-xs text-zinc-500 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputClass = 'w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-zinc-500 transition-shadow';
const textareaClass = `${inputClass} resize-none`;
const selectClass = 'w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-zinc-700 cursor-pointer';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-zinc-200 dark:bg-white/10'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      {label && <span className="text-sm text-zinc-600 dark:text-slate-400">{label}</span>}
    </label>
  );
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${
          saved
            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
            : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
        }`}
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Đã lưu' : 'Lưu thay đổi'}
      </button>
    </div>
  );
}

function AddItemForm({ onAdd }: { onAdd: (item: ConfigItem) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({
      value: `CUSTOM_${Date.now()}`,
      label: label.trim(),
      emoji: emoji || '⭐',
      color,
      enabled: true,
    });
    setLabel(''); setEmoji(''); setColor('#3b82f6');
    setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-zinc-300 dark:border-white/10 text-sm font-semibold text-zinc-500 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
        <Plus className="w-4 h-4" /> Thêm mục mới
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <p className="text-xs font-bold text-primary uppercase tracking-wider">Thêm mục mới</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-500">Tên hiển thị <span className="text-rose-400">*</span></p>
          <input autoFocus value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false); }} placeholder="Tên mục..." className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-500">Icon (emoji)</p>
          <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="⭐" className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-zinc-500">Màu sắc</p>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: color === c ? '#0f172a' : 'transparent', boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : 'none' }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border border-zinc-300 dark:border-white/10 bg-transparent p-0 overflow-hidden" />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button type="button" onClick={handleAdd} disabled={!label.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> Thêm
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5">Huỷ</button>
      </div>
    </div>
  );
}

function ConfigItemRow({ item, onChange, onDelete }: { item: ConfigItem; onChange: (next: ConfigItem) => void; onDelete?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(item);
  const commit = () => { onChange(draft); setExpanded(false); };

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${item.enabled ? 'bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10' : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${!item.enabled ? 'opacity-40' : ''}`}>
        <GripVertical className="w-4 h-4 text-zinc-300 dark:text-slate-600 shrink-0 cursor-grab active:cursor-grabbing" />
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: item.color + '22', border: `1.5px solid ${item.color}55` }}>
          {item.emoji}
        </div>
        <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-slate-200">{item.label}</span>
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
        <button type="button" onClick={() => { setDraft(item); setExpanded(v => !v); }}
          className={`p-1.5 rounded-lg transition-colors ${expanded ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-primary hover:bg-primary/5'}`}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="p-1.5 rounded-lg text-zinc-300 dark:text-white/20 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button type="button" onClick={() => onChange({ ...item, enabled: !item.enabled })}
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${item.enabled ? 'bg-primary' : 'bg-zinc-200 dark:bg-white/10'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.enabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-200 dark:border-white/5 space-y-3 shadow-inner bg-zinc-50/50 dark:bg-white/[0.01]">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500">Tên hiển thị</p>
              <input autoFocus value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setExpanded(false); }} className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg outline-none" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500">Icon (emoji)</p>
              <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-lg outline-none" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
             <button type="button" onClick={() => setExpanded(false)} className="px-3 py-1.5 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">Huỷ</button>
             <button type="button" onClick={commit} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-bold"><Check className="w-3.5 h-3.5" /> OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab Content Components ─────────────────────────────────── */
function WebsiteTab() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Thông tin cơ bản">
        <Field label="Tên trang web"><input className={inputClass} defaultValue="KS40" /></Field>
        <Field label="Slogan"><input className={inputClass} defaultValue="Nền tảng học lập trình chuyên sâu" /></Field>
        <Field label="Mô tả"><textarea className={textareaClass} rows={3} defaultValue="KS40 là nền tảng chia sẻ kiến thức về lập trình." /></Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function AccountTab() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Thông tin cá nhân">
        <Field label="Tên hiển thị"><input className={inputClass} defaultValue="Admin User" /></Field>
        <Field label="Email"><input className={inputClass} type="email" defaultValue="admin@ks40.com" /></Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function ContentTab() {
  const [allowComment, setAllowComment] = useState(true);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Bình luận">
        <Field label="Cho phép bình luận"><Toggle checked={allowComment} onChange={setAllowComment} label={allowComment ? 'Bật' : 'Tắt'} /></Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function MembersTab() {
  const [openReg, setOpenReg] = useState(true);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Đăng ký tài khoản">
        <Field label="Cho phép đăng ký tự do"><Toggle checked={openReg} onChange={setOpenReg} label={openReg ? 'Mở đăng ký' : 'Chỉ dùng link mời'} /></Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function NotificationsTab() {
  const [notifs, setNotifs] = useState({ newComment: true, newMember: true });
  const [saved, setSaved] = useState(false);
  const toggle = (k: keyof typeof notifs) => setNotifs(v => ({ ...v, [k]: !v[k] }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Email Notifications">
        <Field label="Bình luận mới"><Toggle checked={notifs.newComment} onChange={() => toggle('newComment')} /></Field>
        <Field label="Thành viên mới"><Toggle checked={notifs.newMember} onChange={() => toggle('newMember')} /></Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Theme">
        <Field label="Giao diện mặc định">
          <div className="flex gap-3">
             {['light', 'dark', 'system'].map(k => (
               <button key={k} onClick={() => setTheme(k as any)} className={`px-4 py-2 rounded-xl border ${theme === k ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-300 text-zinc-500'}`}>{k}</button>
             ))}
          </div>
        </Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

const DEFAULT_OCCUPATIONS: ConfigItem[] = [
  { value: 'STUDENT',   label: 'Sinh viên', emoji: '🎓', color: '#8b5cf6', enabled: true },
  { value: 'DEVELOPER', label: 'Developer',  emoji: '💻', color: '#3b82f6', enabled: true },
];
function OnboardingTab({ initialOccupations }: { initialOccupations: OnboardingItem[] }) {
  const [isPending, startTransition] = React.useTransition();
  const [saved, setSaved] = useState(false);
  const [occupations, setOccupations] = useState<OnboardingItem[]>(initialOccupations);
  const [parentTopics, setParentTopics] = useState<TopicItem[] | null>(null);

  React.useEffect(() => {
    getEnabledTopicTreeAction().then(setParentTopics).catch(() => setParentTopics([]));
  }, []);

  const save = () => {
    startTransition(async () => {
      await setSiteConfigAction('onboarding_occupations', occupations);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <Section title="Vai trò (Occupation)">
        <div className="space-y-2">
          {occupations.map(item => <ConfigItemRow key={item.value} item={item} onChange={next => setOccupations(prev => prev.map(i => i.value === next.value ? next : i))} onDelete={() => setOccupations(prev => prev.filter(i => i.value !== item.value))} />)}
        </div>
        <AddItemForm onAdd={item => setOccupations(prev => [...prev, item])} />
      </Section>
      <Section title="Chủ đề quan tâm (Onboarding Step 2)">
        <p className="text-xs text-zinc-500 dark:text-slate-500 mb-3">
          Người dùng mới sẽ chọn từ các chủ đề cha đang bật. Quản lý chủ đề tại tab <Link href="/admin/settings?tab=topics" className="text-primary hover:underline inline-flex items-center gap-1">Chủ đề <ExternalLink className="w-3 h-3" /></Link>.
        </p>
        {parentTopics === null ? (
          <div className="text-sm text-zinc-500 py-4">Đang tải...</div>
        ) : parentTopics.length === 0 ? (
          <div className="text-sm text-zinc-500 py-4">Chưa có chủ đề nào được bật.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {parentTopics.map(t => (
              <span key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-700 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color ?? '#64748b' }} />
                {t.emoji && <span>{t.emoji}</span>}
                {t.label}
                {t.children && t.children.length > 0 && <span className="text-xs text-zinc-500">({t.children.length})</span>}
              </span>
            ))}
          </div>
        )}
      </Section>
      <div className="flex justify-end pt-2">
        <button onClick={save} disabled={isPending} className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
          {isPending ? 'Đang lưu...' : saved ? 'Đã lưu' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}

/* ─── Topics Tab (Zen UI + Auto-save) ────────────────────────── */
function TopicsTab() {
  const [items, setItems] = useState<TopicItem[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [childModalParentId, setChildModalParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = React.useTransition();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    getTopicTreeAction().then(d => { setItems(d); setExpandedParents(new Set(d.length > 0 ? [d[0].id] : [])); }).catch(() => setItems([]));
  }, []);

  const save = (nextItems: TopicItem[]) => {
    setItems(nextItems);
    startTransition(async () => { await saveTopicsAction(nextItems); });
  };

  const handleCreateGroup = ({ label, slug, color }: { label: string; slug: string; color: string }) => {
    const newItem: TopicItem = { id: `new-${Date.now()}`, slug, label, emoji: null, color, order: 0, enabled: true, parentId: null };
    save([...(items ?? []), newItem]);
    setIsModalOpen(false);
  };

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedParents(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const updateParent = (next: TopicItem) => save((items ?? []).map(p => p.id === next.id ? { ...next, children: p.children } : p));
  const deleteParent = (id: string) => save((items ?? []).filter(p => p.id !== id));
  const updateChild = (parentId: string, next: TopicItem) => save((items ?? []).map(p => p.id === parentId ? { ...p, children: (p.children ?? []).map(c => c.id === next.id ? next : c) } : p));
  const deleteChild = (parentId: string, childId: string) => save((items ?? []).map(p => p.id === parentId ? { ...p, children: (p.children ?? []).filter(c => c.id !== childId) } : p));
  const addChild = (data: { label: string; slug: string; color: string }) => {
    if (!childModalParentId) return;
    const newItem: TopicItem = { id: `new-${Date.now()}`, slug: data.slug, label: data.label, emoji: null, color: data.color, order: 0, enabled: true, parentId: childModalParentId };
    save((items ?? []).map(p => p.id === childModalParentId ? { ...p, children: [...(p.children ?? []), newItem] } : p));
    setChildModalParentId(null);
  };

  const filteredItems = React.useMemo(() => {
    if (!items || !searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(parent => {
      const parentMatches = parent.label.toLowerCase().includes(q);
      const childMatches = (parent.children ?? []).some(child => child.label.toLowerCase().includes(q));
      if (childMatches && !expandedParents.has(parent.id)) {
        setTimeout(() => setExpandedParents(p => new Set(p).add(parent.id)), 0);
      }
      return parentMatches || childMatches;
    });
  }, [items, searchQuery, expandedParents]);

  if (!items) return <div className="text-center py-8 text-zinc-500">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Section title="Quản lý Chủ đề">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm kiếm chủ đề..." className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 pl-10 pr-4 py-2.5 text-sm rounded-2xl outline-none focus:border-primary/30 transition-all" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 shadow-sm shadow-primary/10 transition-all shrink-0">
            <Plus className="w-4 h-4" /> Thêm nhóm
          </button>
        </div>

        <div className="space-y-0.5 mt-4">
          {!filteredItems || filteredItems.length === 0 ? <p className="text-sm text-zinc-500 py-4 text-center">{searchQuery ? "Không tìm thấy kết quả" : "Chưa có chủ đề nào"}</p> : filteredItems.map(parent => {
            const isExpanded = expandedParents.has(parent.id);
            return (
              <div key={parent.id}>
                <DataGridRow item={parent} isParent isExpanded={isExpanded} onToggle={e => toggleExpand(parent.id, e)} onChange={updateParent} onDelete={() => deleteParent(parent.id)} />
                {isExpanded && (
                  <div className="pl-6 mt-0.5 space-y-0.5 relative before:absolute before:left-[17px] before:top-2 before:bottom-4 before:w-px before:bg-zinc-200 dark:before:bg-white/10">
                    {(parent.children ?? []).filter(child => !searchQuery.trim() || child.label.toLowerCase().includes(searchQuery.toLowerCase())).map(child => <DataGridRow key={child.id} item={child} onChange={next => updateChild(parent.id, next)} onDelete={() => deleteChild(parent.id, child.id)} />)}
                    {!searchQuery && (
                      <button onClick={() => setChildModalParentId(parent.id)} className="flex items-center gap-2 pl-4 py-1.5 text-[13px] text-zinc-500 hover:text-primary transition-colors group w-full">
                        <Plus className="w-3.5 h-3.5 text-zinc-300 group-hover:text-primary transition-colors" /> Thêm chủ đề con...
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
      <AddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleCreateGroup} title="Tạo nhóm chủ đề mới" isPending={isPending} />
      <AddModal isOpen={!!childModalParentId} onClose={() => setChildModalParentId(null)} onConfirm={addChild} title="Thêm chủ đề con" isPending={isPending} />
    </div>
  );
}



function DataGridRow({ item, isParent, isExpanded, onToggle, onChange, onDelete }: { item: TopicItem; isParent?: boolean; isExpanded?: boolean; onToggle?: (e: React.MouseEvent) => void; onChange: (next: TopicItem) => void; onDelete?: () => void; }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const commit = () => { onChange(draft); setIsEditing(false); };
  const articleCount = item._count?.articles ?? 0;

  if (isEditing) {
    return (
      <div className={`px-3 py-2.5 bg-primary/5 dark:bg-primary/10 rounded-xl space-y-2 ${isParent ? "" : "ml-4"}`}>
        <div className="flex items-center gap-2">
          <input autoFocus value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setIsEditing(false); }} placeholder="Tên" className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-zinc-300 dark:border-white/10 rounded-lg outline-none" />
          <input value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} placeholder="slug" className="w-36 px-3 py-1.5 text-sm font-mono bg-white dark:bg-slate-800 border border-zinc-300 dark:border-white/10 rounded-lg outline-none" />
          <input type="color" value={draft.color ?? '#64748b'} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))} className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-300 dark:border-white/10 bg-transparent p-0.5 overflow-hidden shrink-0" />
          <div className="flex items-center gap-1">
            <button onClick={() => setIsEditing(false)} className="p-1.5 text-zinc-500 hover:bg-white/50 rounded-lg"><X className="w-4 h-4" /></button>
            <button onClick={commit} className="p-1.5 bg-primary text-white rounded-lg"><Check className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-2 py-2 group hover:bg-zinc-50 dark:hover:bg-white/[0.02] rounded-xl transition-colors ${!item.enabled ? "opacity-50" : ""}`}>
      {isParent ? (
        <button onClick={onToggle} className="p-1.5 -ml-1 text-zinc-500 hover:text-zinc-800 transition-all">
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </button>
      ) : (
        <div className="w-7 h-7 flex items-center justify-center -ml-1" />
      )}
      
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color ?? '#64748b' }} />

      <span className={`flex-1 truncate font-semibold text-zinc-700 dark:text-slate-200 ${isParent ? "text-sm" : "text-[13px]"}`}>{item.label}</span>
      <span className="text-[11px] font-mono text-zinc-500 shrink-0 hidden sm:block">{item.slug}</span>

      <div className="flex items-center gap-2">
        {articleCount > 0 && <span className="text-[10px] font-bold text-zinc-500 dark:text-slate-400 bg-zinc-200 dark:bg-white/10 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/5 shrink-0 select-none">{articleCount} bài</span>}
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setDraft(item); setIsEditing(true); }} className="p-1.5 text-zinc-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          {onDelete && <button onClick={onDelete} disabled={articleCount > 0} className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-20 transition-colors" title={articleCount > 0 ? "Không thể xóa chủ đề có bài viết" : "Xóa"}><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>

        <button onClick={() => onChange({ ...item, enabled: !item.enabled })} className={`relative w-8 h-4.5 rounded-full transition-colors shrink-0 ${item.enabled ? 'bg-primary' : 'bg-zinc-200 dark:bg-white/10'}`}>
          <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${item.enabled ? 'translate-x-[14px]' : ''}`} />
        </button>
      </div>
    </div>
  );
}


/* ─── Tags Tab (Zen UI) ───────────────────────────────────────── */
type TagRow = { id: string; name: string; slug: string; _count: { articles: number } };
function TagsTab() {
  const [tags, setTags] = useState<TagRow[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => { getTagsWithCountAction().then(data => setTags(data as TagRow[])).catch(() => setTags([])); }, []);

  const handleCreate = (name: string) => {
    startTransition(async () => {
      const tag = await createTagAction(name);
      setTags(prev => [...(prev ?? []), { ...tag, _count: { articles: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setIsModalOpen(false);
    });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    startTransition(async () => {
      const updated = await updateTagAction(id, editName.trim());
      setTags(prev => (prev ?? []).map(t => t.id === id ? { ...t, ...updated } : t));
      setEditId(null);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTagAction(id);
      setTags(prev => (prev ?? []).filter(t => t.id !== id));
    });
  };

  if (!tags) return <div className="text-center py-8 text-zinc-500">Đang tải...</div>;

  const filteredTags = tags.filter(tag => !searchQuery.trim() || tag.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <Section title="Quản lý Tags">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm kiếm tags..." className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 pl-10 pr-4 py-2.5 text-sm rounded-2xl outline-none focus:border-primary/30 transition-all" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 shadow-sm shadow-primary/10 transition-all shrink-0">
            <Plus className="w-4 h-4" /> Thêm tag
          </button>
        </div>

        <div className="space-y-0.5 mt-4">
          {filteredTags.length === 0 && <p className="text-sm text-zinc-500 py-4 text-center">{searchQuery ? "Không tìm thấy kết quả" : "Chưa có tag nào"}</p>}
          {filteredTags.map(tag => (
            <div key={tag.id} className="flex items-center gap-3 px-2 py-2 group hover:bg-zinc-50 dark:hover:bg-white/[0.02] rounded-xl transition-colors">
              <Hash className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {editId === tag.id ? (
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') setEditId(null); }} className="flex-1 text-sm bg-transparent border-b border-primary outline-none" />
              ) : (
                <span className="flex-1 text-sm font-semibold text-zinc-700 dark:text-slate-200">{tag.name}</span>
              )}
              <span className="text-[10px] font-bold text-zinc-500 dark:text-slate-400 bg-zinc-200 dark:bg-white/10 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/5 shrink-0 select-none">{tag._count.articles} bài</span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                 {editId === tag.id ? <button onClick={() => handleUpdate(tag.id)} className="text-primary"><Check className="w-3.5 h-3.5" /></button> : <button onClick={() => { setEditId(tag.id); setEditName(tag.name); }} className="text-zinc-500"><Pencil className="w-3.5 h-3.5" /></button>}
                 <button onClick={() => handleDelete(tag.id)} disabled={tag._count.articles > 0} className="text-zinc-500 hover:text-rose-500 disabled:opacity-20"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <AddTagModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleCreate} isPending={isPending} />
    </div>
  );
}



const DEFAULT_BADGES_CONFIG: ConfigItem[] = [
  { value: 'HOT', label: 'Hot', emoji: '🔥', color: '#ef4444', enabled: true },
  { value: 'NEW', label: 'New', emoji: '✨', color: '#3b82f6', enabled: true },
];

function BadgesTab() {
  const [items, setItems] = useState<ConfigItem[] | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [saved, setSaved] = useState(false);

  React.useEffect(() => { getSiteConfigAction('article_badges').then(d => setItems((d as ConfigItem[] | null) ?? DEFAULT_BADGES_CONFIG)).catch(() => setItems(DEFAULT_BADGES_CONFIG)); }, []);

  const save = () => { if (!items) return; startTransition(async () => { await setSiteConfigAction('article_badges', items); setSaved(true); setTimeout(() => setSaved(false), 2000); }); };
  if (!items) return <div className="text-center py-8 text-zinc-500">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Section title="Badges bài viết">
        <div className="space-y-2">
          {items.map(item => <ConfigItemRow key={item.value} item={item} onChange={next => setItems(prev => (prev ?? []).map(i => i.value === next.value ? next : i))} onDelete={() => setItems(prev => (prev ?? []).filter(i => i.value !== item.value))} />)}
        </div>
        <AddItemForm onAdd={item => setItems(prev => [...(prev ?? []), item])} />
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

/* ─── Nav groups ─────────────────────────────────────────────── */
const NAV_GROUPS: { label: string; items: TabKey[] }[] = [
  { label: 'Chung',      items: ['website', 'appearance', 'notifications'] },
  { label: 'Tài khoản',  items: ['account'] },
  { label: 'Nội dung',   items: ['content', 'topics', 'tags', 'badges'] },
  { label: 'Thành viên', items: ['members', 'onboarding'] },
];

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AdminSettingsPageWrapper() {
  return <React.Suspense><AdminSettingsPage /></React.Suspense>;
}

function AdminSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = (searchParams.get('tab') as TabKey) ?? 'topics';
  const validTabs = tabs.map(t => t.key);
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'topics';

  const [onboardingData, setOnboardingData] = useState<{ occupations: OnboardingItem[] } | null>(null);

  React.useEffect(() => {
    getSiteConfigAction('onboarding_occupations')
      .then((occ) => setOnboardingData({ occupations: (occ as any) ?? DEFAULT_OCCUPATIONS }))
      .catch(() => setOnboardingData({ occupations: DEFAULT_OCCUPATIONS }));
  }, []);

  const activeTabMeta = tabs.find(t => t.key === activeTab)!;
  const setActiveTab = (tab: TabKey) => router.replace(`/admin/settings?tab=${tab}`, { scroll: false });

  const content: Record<TabKey, React.ReactNode> = {
    website: <WebsiteTab />,
    account: <AccountTab />,
    content: <ContentTab />,
    members: <MembersTab />,
    notifications: <NotificationsTab />,
    appearance: <AppearanceTab />,
    onboarding: onboardingData ? <OnboardingTab initialOccupations={onboardingData.occupations} /> : <div className="text-sm text-zinc-500 py-8">Đang tải...</div>,
    topics: <TopicsTab />,
    tags: <TagsTab />,
    badges: <BadgesTab />,
  };

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Cài đặt' }]} />
      <div className="flex-1 p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display">Cài đặt</h1>
          <p className="text-sm text-zinc-500 mt-1">Quản lý cấu hình hệ thống</p>
        </div>

        <div className="flex gap-8 items-start">
          <nav className="w-52 shrink-0 space-y-6 sticky top-8">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-3 mb-2">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map(key => {
                    const tab = tabs.find(t => t.key === key)!;
                    const Icon = tab.icon;
                    const isActive = activeTab === key;
                    const isSoon = SOON_TABS.has(key);
                    return (
                      <button key={key} onClick={() => !isSoon && setActiveTab(key)} disabled={isSoon}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">{tab.label}</span>
                        {isSoon && <span className="text-[9px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-zinc-500 dark:text-slate-400">Soon</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1 max-w-2xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
               {React.createElement(activeTabMeta.icon, { className: 'w-5 h-5 text-primary' })}
               {activeTabMeta.label}
               {SOON_TABS.has(activeTab) && (
                 <span className="text-[9px] font-bold uppercase tracking-wider bg-zinc-200 dark:bg-white/10 px-2 py-0.5 rounded text-zinc-500 dark:text-slate-400">
                   Coming Soon
                 </span>
               )}
            </h2>
            {SOON_TABS.has(activeTab) ? (
              <div className="py-20 text-center text-zinc-500">Tính năng đang phát triển</div>
            ) : content[activeTab]}
          </div>
        </div>
      </div>
    </>
  );
}
