"use client";

import React, { useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSiteConfigAction, setSiteConfigAction } from '@/features/admin/actions/config';
import { getTagsWithCountAction, createTagAction, updateTagAction, deleteTagAction } from '@/features/admin/actions/taxonomy';
import AdminHeader from '@/features/admin/components/AdminHeader';
import {
  Globe, User, FileText, Users, Bell, Palette,
  Save, Eye, EyeOff, Upload, Check, Sparkles, GripVertical, Pencil, Plus, Trash2,
  Tag, LayoutGrid, Award, Loader2, Hash,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
type TabKey = 'website' | 'account' | 'content' | 'members' | 'notifications' | 'appearance' | 'onboarding' | 'tags' | 'categories' | 'badges';

const SOON_TABS = new Set<TabKey>(['website', 'account', 'content', 'members', 'notifications', 'appearance']);

const tabs: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: 'website',       icon: Globe,        label: 'Trang web'    },
  { key: 'account',       icon: User,         label: 'Tài khoản'    },
  { key: 'content',       icon: FileText,     label: 'Nội dung'     },
  { key: 'members',       icon: Users,        label: 'Thành viên'   },
  { key: 'notifications', icon: Bell,         label: 'Thông báo'    },
  { key: 'appearance',    icon: Palette,      label: 'Giao diện'    },
  { key: 'onboarding',    icon: Sparkles,     label: 'Onboarding'   },
  { key: 'tags',          icon: Tag,          label: 'Tags'         },
  { key: 'categories',    icon: LayoutGrid,   label: 'Danh mục'     },
  { key: 'badges',        icon: Award,        label: 'Badges'       },
];

/* ─── Reusable field components ─────────────────────────────── */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8">
      <div className="md:w-52 shrink-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputClass = 'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-slate-400 transition-shadow';
const textareaClass = `${inputClass} resize-none`;
const selectClass = 'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 dark:text-white text-slate-700 cursor-pointer';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      {label && <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>}
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

/* ─── Tab content components ─────────────────────────────────── */
function WebsiteTab() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Thông tin cơ bản" description="Tên và mô tả hiển thị cho người dùng.">
        <Field label="Tên trang web">
          <input className={inputClass} defaultValue="KS40" />
        </Field>
        <Field label="Slogan" hint="Hiển thị dưới tên trang">
          <input className={inputClass} defaultValue="Nền tảng học lập trình chuyên sâu" />
        </Field>
        <Field label="Mô tả" hint="Dùng cho SEO meta description">
          <textarea className={textareaClass} rows={3} defaultValue="KS40 là nền tảng chia sẻ kiến thức về lập trình, system design và công nghệ." />
        </Field>
        <Field label="URL trang web">
          <input className={inputClass} defaultValue="https://ks40.com" />
        </Field>
      </Section>
      <Section title="Hình ảnh" description="Logo và favicon của trang web.">
        <Field label="Logo">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold text-xl shrink-0">K</div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <Upload className="w-4 h-4" /> Tải lên
            </button>
          </div>
        </Field>
        <Field label="Favicon">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">K</div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <Upload className="w-4 h-4" /> Tải lên
            </button>
          </div>
        </Field>
      </Section>
      <Section title="Khu vực & Ngôn ngữ">
        <Field label="Ngôn ngữ mặc định">
          <select className={selectClass} defaultValue="vi">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label="Múi giờ">
          <select className={selectClass} defaultValue="Asia/Ho_Chi_Minh">
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
            <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
            <option value="UTC">UTC</option>
          </select>
        </Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function AccountTab() {
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Thông tin cá nhân">
        <Field label="Ảnh đại diện">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-cover bg-center border border-slate-200 dark:border-white/10 shrink-0"
              style={{ backgroundImage: `url('https://ui-avatars.com/api/?name=Admin+User&background=e2e8f0&color=0f172a&size=112')` }}
            />
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <Upload className="w-4 h-4" /> Thay đổi
            </button>
          </div>
        </Field>
        <Field label="Tên hiển thị">
          <input className={inputClass} defaultValue="Admin User" />
        </Field>
        <Field label="Email">
          <input className={inputClass} type="email" defaultValue="admin@ks40.com" />
        </Field>
        <Field label="Giới thiệu bản thân" hint="Hiển thị trên trang tác giả">
          <textarea className={textareaClass} rows={3} placeholder="Viết vài dòng về bạn..." />
        </Field>
      </Section>
      <Section title="Bảo mật">
        <Field label="Mật khẩu hiện tại">
          <div className="relative">
            <input className={inputClass} type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <Field label="Mật khẩu mới">
          <input className={inputClass} type="password" placeholder="••••••••" />
        </Field>
        <Field label="Xác nhận mật khẩu">
          <input className={inputClass} type="password" placeholder="••••••••" />
        </Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function ContentTab() {
  const [autoApprove, setAutoApprove] = useState(false);
  const [allowComment, setAllowComment] = useState(true);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Hiển thị bài viết">
        <Field label="Số bài mỗi trang" hint="Trang danh sách bài viết">
          <select className={selectClass} defaultValue="12">
            {[6, 9, 12, 15, 24].map(n => <option key={n} value={n}>{n} bài</option>)}
          </select>
        </Field>
        <Field label="Danh mục mặc định" hint="Khi tạo bài viết mới">
          <select className={selectClass} defaultValue="System">
            <option value="System">System Design</option>
            <option value="AI">Trí tuệ nhân tạo (AI)</option>
            <option value="DevOps">DevOps</option>
            <option value="Blockchain">Blockchain</option>
          </select>
        </Field>
        <Field label="Sắp xếp mặc định">
          <select className={selectClass} defaultValue="newest">
            <option value="newest">Mới nhất</option>
            <option value="popular">Phổ biến nhất</option>
            <option value="trending">Đang trending</option>
          </select>
        </Field>
      </Section>
      <Section title="Bình luận">
        <Field label="Cho phép bình luận">
          <Toggle checked={allowComment} onChange={setAllowComment} label={allowComment ? 'Bật' : 'Tắt'} />
        </Field>
        <Field label="Tự động duyệt" hint="Tắt để kiểm duyệt thủ công trước khi hiển thị">
          <Toggle checked={autoApprove} onChange={setAutoApprove} label={autoApprove ? 'Tự động duyệt' : 'Kiểm duyệt thủ công'} />
        </Field>
        <Field label="Giới hạn ký tự" hint="Độ dài tối đa của một bình luận">
          <select className={selectClass} defaultValue="500">
            {[200, 500, 1000, 2000].map(n => <option key={n} value={n}>{n} ký tự</option>)}
          </select>
        </Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function MembersTab() {
  const [openReg, setOpenReg] = useState(true);
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Đăng ký tài khoản">
        <Field label="Cho phép đăng ký tự do" hint="Tắt để chỉ dùng link mời">
          <Toggle checked={openReg} onChange={setOpenReg} label={openReg ? 'Mở đăng ký' : 'Chỉ dùng link mời'} />
        </Field>
        <Field label="Xác minh email" hint="Yêu cầu xác minh email khi đăng ký">
          <Toggle checked={true} onChange={() => {}} label="Bắt buộc" />
        </Field>
      </Section>
      <Section title="Gói Premium">
        <Field label="Dùng thử miễn phí" hint="Cho phép dùng thử Premium trước khi mua">
          <Toggle checked={trialEnabled} onChange={setTrialEnabled} label={trialEnabled ? 'Bật' : 'Tắt'} />
        </Field>
        {trialEnabled && (
          <Field label="Thời gian dùng thử">
            <select className={selectClass} defaultValue="7">
              <option value="3">3 ngày</option>
              <option value="7">7 ngày</option>
              <option value="14">14 ngày</option>
              <option value="30">30 ngày</option>
            </select>
          </Field>
        )}
      </Section>
      <Section title="Spam & Kiểm duyệt">
        <Field label="Lọc spam tự động" hint="Dùng AI để phát hiện bình luận spam">
          <Toggle checked={true} onChange={() => {}} label="Bật" />
        </Field>
        <Field label="Khoá tự động" hint="Khoá tài khoản bị báo cáo nhiều lần">
          <Toggle checked={false} onChange={() => {}} label="Tắt" />
        </Field>
        <Field label="Số lần báo cáo tối đa" hint="Trước khi tài khoản bị tạm khoá">
          <select className={selectClass} defaultValue="5">
            {[3, 5, 10, 20].map(n => <option key={n} value={n}>{n} lần</option>)}
          </select>
        </Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function NotificationsTab() {
  const [notifs, setNotifs] = useState({
    newComment:  true,
    newMember:   true,
    newReport:   true,
    weeklyStats: false,
    pushAll:     false,
  });
  const [saved, setSaved] = useState(false);
  const toggle = (k: keyof typeof notifs) => setNotifs(v => ({ ...v, [k]: !v[k] }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <Section title="Thông báo Email cho Admin" description="Nhận email khi có sự kiện xảy ra trong hệ thống.">
        <Field label="Bình luận mới">
          <Toggle checked={notifs.newComment} onChange={() => toggle('newComment')} label={notifs.newComment ? 'Bật' : 'Tắt'} />
        </Field>
        <Field label="Thành viên mới đăng ký">
          <Toggle checked={notifs.newMember} onChange={() => toggle('newMember')} label={notifs.newMember ? 'Bật' : 'Tắt'} />
        </Field>
        <Field label="Báo cáo vi phạm">
          <Toggle checked={notifs.newReport} onChange={() => toggle('newReport')} label={notifs.newReport ? 'Bật' : 'Tắt'} />
        </Field>
        <Field label="Báo cáo thống kê hàng tuần">
          <Toggle checked={notifs.weeklyStats} onChange={() => toggle('weeklyStats')} label={notifs.weeklyStats ? 'Bật' : 'Tắt'} />
        </Field>
      </Section>
      <Section title="Push Notification cho Người dùng" description="Gửi thông báo đẩy tới người dùng khi có bài viết mới.">
        <Field label="Gửi thông báo tự động" hint="Khi admin đăng bài mới">
          <Toggle checked={notifs.pushAll} onChange={() => toggle('pushAll')} label={notifs.pushAll ? 'Bật' : 'Tắt'} />
        </Field>
        <Field label="Email thông báo" hint="Địa chỉ nhận thông báo hệ thống">
          <input className={inputClass} type="email" defaultValue="admin@ks40.com" />
        </Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const themes: { key: 'light' | 'dark' | 'system'; label: string; desc: string }[] = [
    { key: 'light',  label: '☀️ Sáng',  desc: 'Giao diện màu trắng' },
    { key: 'dark',   label: '🌙 Tối',   desc: 'Giao diện màu tối'   },
    { key: 'system', label: '💻 Hệ thống', desc: 'Theo cài đặt thiết bị' },
  ];

  const colors = [
    { label: 'Blue',   value: '#3b82f6' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Emerald',value: '#10b981' },
    { label: 'Rose',   value: '#f43f5e' },
    { label: 'Amber',  value: '#f59e0b' },
    { label: 'Cyan',   value: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      <Section title="Theme" description="Chủ đề giao diện mặc định khi người dùng truy cập.">
        <Field label="Chủ đề mặc định">
          <div className="flex gap-3 flex-wrap">
            {themes.map(t => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                  theme === t.key
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">{t.label}</span>
                <span className="text-xs text-slate-400 mt-0.5">{t.desc}</span>
              </button>
            ))}
          </div>
        </Field>
      </Section>
      <Section title="Màu chủ đạo" description="Màu được dùng cho nút, link và các điểm nhấn giao diện.">
        <Field label="Primary color">
          <div className="flex items-center gap-3 flex-wrap">
            {colors.map(c => (
              <button
                key={c.value}
                onClick={() => setPrimaryColor(c.value)}
                title={c.label}
                className={`w-9 h-9 rounded-full border-2 transition-all ${primaryColor === c.value ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-9 h-9 rounded-full cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent"
              title="Tuỳ chỉnh"
            />
          </div>
        </Field>
      </Section>
      <Section title="Typography">
        <Field label="Font chữ chính">
          <select className={selectClass} defaultValue="inter">
            <option value="inter">Inter</option>
            <option value="geist">Geist</option>
            <option value="system">System UI</option>
          </select>
        </Field>
        <Field label="Cỡ chữ cơ sở">
          <select className={selectClass} defaultValue="16">
            <option value="14">14px — Nhỏ</option>
            <option value="16">16px — Mặc định</option>
            <option value="18">18px — Lớn</option>
          </select>
        </Field>
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

/* ─── Onboarding Tab ─────────────────────────────────────────── */
type OnboardingItem = { value: string; label: string; emoji: string; color: string; enabled: boolean };

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ec4899', '#f43f5e', '#06b6d4', '#64748b',
];

function SortableList({
  items, onReorder, renderItem,
}: {
  items: OnboardingItem[];
  onReorder: (items: OnboardingItem[]) => void;
  renderItem: (item: OnboardingItem) => React.ReactNode;
}) {
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setOverIndex(i); };
  const handleDrop      = (i: number) => {
    if (dragIndex.current === null || dragIndex.current === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    dragIndex.current = null;
    setOverIndex(null);
  };
  const handleDragEnd   = () => { dragIndex.current = null; setOverIndex(null); };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={item.value}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={e => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          onDragEnd={handleDragEnd}
          className={`transition-all duration-150 ${
            overIndex === i && dragIndex.current !== i
              ? 'scale-[1.02] opacity-80 ring-2 ring-primary/40 rounded-xl'
              : ''
          }`}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

function AddItemForm({ onAdd }: { onAdd: (item: OnboardingItem) => void }) {
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
      >
        <Plus className="w-4 h-4" /> Thêm mục mới
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <p className="text-xs font-bold text-primary uppercase tracking-wider">Thêm mục mới</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">Tên hiển thị <span className="text-rose-400">*</span></p>
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false); }}
            placeholder="Tên mục..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">Icon (emoji)</p>
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            placeholder="⭐"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-500">Màu sắc</p>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: color === c ? '#0f172a' : 'transparent', boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : 'none' }}
            />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent p-0 overflow-hidden" />
        </div>
      </div>
      {/* Preview */}
      {label && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">Preview</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold"
            style={{ borderColor: color, backgroundColor: color + '18', color }}>
            <span>{emoji || '⭐'}</span>{label}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button type="button" onClick={handleAdd} disabled={!label.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed">
          <Plus className="w-3.5 h-3.5" /> Thêm
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
          Huỷ
        </button>
      </div>
    </div>
  );
}

function EditableItem({ item, onChange, onDelete }: { item: OnboardingItem; onChange: (next: OnboardingItem) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(item);

  const open  = () => { setDraft(item); setExpanded(true); };
  const close = () => setExpanded(false);
  const commit = () => { onChange(draft); setExpanded(false); };

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      item.enabled
        ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5'
    }`}>
      {/* Row */}
      <div className={`flex items-center gap-3 px-4 py-3 ${!item.enabled ? 'opacity-40' : ''}`}>
        <GripVertical className="w-4 h-4 text-slate-300 dark:text-white/20 shrink-0 cursor-grab active:cursor-grabbing" />

        {/* Emoji badge */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: item.color + '22', border: `1.5px solid ${item.color}55` }}>
          {item.emoji}
        </div>

        {/* Label */}
        <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>

        {/* Color dot */}
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />

        {/* Edit toggle */}
        <button
          type="button"
          onClick={() => expanded ? close() : open()}
          className={`p-1.5 rounded-lg transition-colors ${expanded ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-300 dark:text-white/20 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Enable toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...item, enabled: !item.enabled })}
          className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${item.enabled ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${item.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-white/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Label */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Tên hiển thị</p>
              <input
                autoFocus
                value={draft.label}
                onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') close(); }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
              />
            </div>
            {/* Emoji */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Icon (emoji)</p>
              <input
                value={draft.emoji}
                onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white"
                placeholder="🎓"
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Màu sắc</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: draft.color === c ? '#0f172a' : 'transparent',
                    boxShadow: draft.color === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : 'none',
                  }}
                />
              ))}
              <input
                type="color"
                value={draft.color}
                onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                className="w-7 h-7 rounded-full cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent p-0 overflow-hidden"
                title="Tuỳ chỉnh"
              />
            </div>
          </div>

          {/* Preview + actions */}
          <div className="flex items-end justify-between gap-4 pt-1">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Preview</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold"
                style={{ borderColor: draft.color, backgroundColor: draft.color + '18', color: draft.color }}>
                <span>{draft.emoji || '⭐'}</span>
                {draft.label || 'Label'}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={close}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                Huỷ
              </button>
              <button type="button" onClick={commit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-primary/20">
                <Check className="w-3.5 h-3.5" /> OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_OCCUPATIONS: OnboardingItem[] = [
  { value: 'STUDENT',         label: 'Sinh viên',   emoji: '🎓', color: '#8b5cf6', enabled: true },
  { value: 'DEVELOPER',       label: 'Developer',    emoji: '💻', color: '#3b82f6', enabled: true },
  { value: 'DEVOPS_ENGINEER', label: 'DevOps / SRE', emoji: '⚙️', color: '#10b981', enabled: true },
  { value: 'DATA_SCIENTIST',  label: 'Data / AI',    emoji: '🤖', color: '#f59e0b', enabled: true },
  { value: 'OTHER',           label: 'Khác',         emoji: '🙌', color: '#64748b', enabled: true },
];

const DEFAULT_CATEGORIES: OnboardingItem[] = [
  { value: 'SYSTEM_DESIGN', label: 'System Design', emoji: '🏗️', color: '#8b5cf6', enabled: true },
  { value: 'AI_ML',         label: 'AI / ML',        emoji: '🤖', color: '#f59e0b', enabled: true },
  { value: 'DEVOPS',        label: 'DevOps',          emoji: '⚙️', color: '#10b981', enabled: true },
  { value: 'BLOCKCHAIN',    label: 'Blockchain',      emoji: '🔗', color: '#eab308', enabled: true },
  { value: 'FRONTEND',      label: 'Frontend',        emoji: '🎨', color: '#ec4899', enabled: true },
  { value: 'BACKEND',       label: 'Backend',         emoji: '🔧', color: '#3b82f6', enabled: true },
  { value: 'OTHER',         label: 'Khác',            emoji: '📚', color: '#64748b', enabled: true },
];

function OnboardingTab({ initialOccupations, initialCategories }: {
  initialOccupations: OnboardingItem[];
  initialCategories: OnboardingItem[];
}) {
  const [isPending, startTransition] = React.useTransition();
  const [saved, setSaved] = useState(false);

  const [occupations, setOccupations] = useState<OnboardingItem[]>(initialOccupations);
  const [categories, setCategories]   = useState<OnboardingItem[]>(initialCategories);

  const save = () => {
    startTransition(async () => {
      await Promise.all([
        setSiteConfigAction('onboarding_occupations', occupations),
        setSiteConfigAction('onboarding_categories',  categories),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const update = (
    list: OnboardingItem[],
    setList: React.Dispatch<React.SetStateAction<OnboardingItem[]>>,
    next: OnboardingItem,
  ) => setList(list.map(i => i.value === next.value ? next : i));

  const remove = (
    list: OnboardingItem[],
    setList: React.Dispatch<React.SetStateAction<OnboardingItem[]>>,
    value: string,
  ) => setList(list.filter(i => i.value !== value));

  return (
    <div className="space-y-6">
      <Section title="Vai trò (Occupation)" description="Kéo để sắp xếp, nhấn bút chì để chỉnh sửa, nhấn + để thêm mới.">
        <SortableList
          items={occupations}
          onReorder={setOccupations}
          renderItem={item => (
            <EditableItem
              item={item}
              onChange={next => update(occupations, setOccupations, next)}
              onDelete={() => remove(occupations, setOccupations, item.value)}
            />
          )}
        />
        <AddItemForm onAdd={item => setOccupations(prev => [...prev, item])} />
      </Section>

      <Section title="Chủ đề (Category)" description="Kéo để sắp xếp, nhấn bút chì để chỉnh sửa, nhấn + để thêm mới.">
        <SortableList
          items={categories}
          onReorder={setCategories}
          renderItem={item => (
            <EditableItem
              item={item}
              onChange={next => update(categories, setCategories, next)}
              onDelete={() => remove(categories, setCategories, item.value)}
            />
          )}
        />
        <AddItemForm onAdd={item => setCategories(prev => [...prev, item])} />
      </Section>

      <div className="flex justify-end pt-2">
        <button
          onClick={save}
          disabled={isPending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm disabled:opacity-60 ${
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
          }`}
        >
          {isPending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
            : saved
              ? <><Check className="w-4 h-4" /> Đã lưu</>
              : <><Save className="w-4 h-4" /> Lưu thay đổi</>
          }
        </button>
      </div>
    </div>
  );
}

/* ─── Tags Tab ───────────────────────────────────────────────── */
type TagRow = { id: string; name: string; slug: string; _count: { articles: number } };

function TagsTab() {
  const [tags, setTags] = useState<TagRow[] | null>(null);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    getTagsWithCountAction().then(data => setTags(data as TagRow[])).catch(() => setTags([]));
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const tag = await createTagAction(newName.trim());
      setTags(prev => [...(prev ?? []), { ...tag, _count: { articles: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
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

  if (!tags) return <div className="flex items-center gap-2 text-sm text-slate-400 py-8"><span className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin" /> Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Section title="Quản lý Tags" description={`${tags.length} tags · Dùng để phân loại bài viết`}>
        {/* Add new */}
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="Tên tag mới..."
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Thêm</>}
          </button>
        </div>

        {/* List */}
        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          {tags.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">Chưa có tag nào</p>}
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {editId === tag.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdate(tag.id); if (e.key === 'Escape') setEditId(null); }}
                  className="flex-1 text-sm bg-transparent border-b border-primary outline-none dark:text-white"
                />
              ) : (
                <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{tag.name}</span>
              )}
              <span className="text-xs text-slate-400 shrink-0">{tag._count.articles} bài</span>
              {editId === tag.id ? (
                <button onClick={() => handleUpdate(tag.id)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={() => { setEditId(tag.id); setEditName(tag.name); }} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => handleDelete(tag.id)}
                disabled={tag._count.articles > 0}
                className="p-1.5 rounded-lg text-slate-300 dark:text-white/20 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={tag._count.articles > 0 ? 'Không thể xóa tag đang được dùng' : 'Xóa'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ─── Categories Tab ─────────────────────────────────────────── */
type ConfigItem = OnboardingItem;

const DEFAULT_CATEGORIES_CONFIG: ConfigItem[] = [
  { value: 'SYSTEM_DESIGN', label: 'System Design', emoji: '🏗️', color: '#8b5cf6', enabled: true },
  { value: 'AI_ML',         label: 'AI / ML',        emoji: '🤖', color: '#f59e0b', enabled: true },
  { value: 'DEVOPS',        label: 'DevOps',          emoji: '⚙️', color: '#10b981', enabled: true },
  { value: 'BLOCKCHAIN',    label: 'Blockchain',      emoji: '🔗', color: '#eab308', enabled: true },
  { value: 'FRONTEND',      label: 'Frontend',        emoji: '🎨', color: '#ec4899', enabled: true },
  { value: 'BACKEND',       label: 'Backend',         emoji: '🔧', color: '#3b82f6', enabled: true },
  { value: 'OTHER',         label: 'Khác',            emoji: '📚', color: '#64748b', enabled: true },
];

const DEFAULT_BADGES_CONFIG: ConfigItem[] = [
  { value: 'HOT',      label: 'Hot',      emoji: '🔥', color: '#ef4444', enabled: true },
  { value: 'NEW',      label: 'New',      emoji: '✨', color: '#3b82f6', enabled: true },
  { value: 'TRENDING', label: 'Trending', emoji: '📈', color: '#f59e0b', enabled: true },
  { value: 'FEATURED', label: 'Featured', emoji: '⭐', color: '#8b5cf6', enabled: true },
];

function ConfigItemRow({ item, onChange, onDelete }: { item: ConfigItem; onChange: (next: ConfigItem) => void; onDelete?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(item);
  const commit = () => { onChange(draft); setExpanded(false); };

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${item.enabled ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${!item.enabled ? 'opacity-40' : ''}`}>
        <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 cursor-grab active:cursor-grabbing" />
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: item.color + '22', border: `1.5px solid ${item.color}55` }}>
          {item.emoji}
        </div>
        <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
        <button type="button" onClick={() => { setDraft(item); setExpanded(v => !v); }}
          className={`p-1.5 rounded-lg transition-colors ${expanded ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-300 dark:text-white/20 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button type="button" onClick={() => onChange({ ...item, enabled: !item.enabled })}
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${item.enabled ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.enabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-white/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Tên hiển thị</p>
              <input autoFocus value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setExpanded(false); }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500">Icon (emoji)</p>
              <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">Màu sắc</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setDraft(d => ({ ...d, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: draft.color === c ? '#0f172a' : 'transparent', boxShadow: draft.color === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : 'none' }} />
              ))}
              <input type="color" value={draft.color} onChange={e => setDraft(d => ({ ...d, color: e.target.value }))}
                className="w-7 h-7 rounded-full cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent p-0 overflow-hidden" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 pt-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold"
              style={{ borderColor: draft.color, backgroundColor: draft.color + '18', color: draft.color }}>
              <span>{draft.emoji}</span>{draft.label}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setExpanded(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Huỷ</button>
              <button type="button" onClick={commit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90">
                <Check className="w-3.5 h-3.5" /> OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const [items, setItems] = useState<ConfigItem[] | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [saved, setSaved] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  React.useEffect(() => {
    getSiteConfigAction('article_categories')
      .then(d => setItems((d as ConfigItem[] | null) ?? DEFAULT_CATEGORIES_CONFIG))
      .catch(() => setItems(DEFAULT_CATEGORIES_CONFIG));
  }, []);

  const save = () => {
    if (!items) return;
    startTransition(async () => {
      await setSiteConfigAction('article_categories', items);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleDragStart = (index: number) => { dragIndex.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current !== null && dragIndex.current !== index) setOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === dropIndex) { dragIndex.current = null; setOverIndex(null); return; }
    setItems(prev => {
      if (!prev) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    dragIndex.current = null;
    setOverIndex(null);
  };
  const handleDragEnd = () => { dragIndex.current = null; setOverIndex(null); };

  if (!items) return <div className="flex items-center gap-2 text-sm text-slate-400 py-8"><span className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin" /> Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Section title="Danh mục bài viết" description="Tuỳ chỉnh tên, icon và màu sắc các danh mục. Toggle để ẩn/hiện. Kéo thả để đổi thứ tự.">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.value}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-xl transition-all ${
                dragIndex.current === index
                  ? 'opacity-40 scale-[0.98]'
                  : overIndex === index
                    ? 'ring-2 ring-primary/40 shadow-md shadow-primary/10'
                    : ''
              }`}
            >
              <ConfigItemRow
                item={item}
                onChange={next => setItems(prev => (prev ?? []).map(i => i.value === next.value ? next : i))}
                onDelete={() => setItems(prev => (prev ?? []).filter(i => i.value !== item.value))}
              />
            </div>
          ))}
        </div>
        <AddItemForm onAdd={item => setItems(prev => [...(prev ?? []), item])} />
      </Section>
      <SaveButton saved={saved} onClick={save} />
    </div>
  );
}

/* ─── Badges Tab ──────────────────────────────────────────────── */
function BadgesTab() {
  const [items, setItems] = useState<ConfigItem[] | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    getSiteConfigAction('article_badges')
      .then(d => setItems((d as ConfigItem[] | null) ?? DEFAULT_BADGES_CONFIG))
      .catch(() => setItems(DEFAULT_BADGES_CONFIG));
  }, []);

  const save = () => {
    if (!items) return;
    startTransition(async () => {
      await setSiteConfigAction('article_badges', items);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    });
  };

  if (!items) return <div className="flex items-center gap-2 text-sm text-slate-400 py-8"><span className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin" /> Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Section title="Badges bài viết" description="Các nhãn hiển thị trên thumbnail bài viết. Toggle để bật/tắt từng badge.">
        <div className="space-y-2">
          {items.map(item => (
            <ConfigItemRow
              key={item.value}
              item={item}
              onChange={next => setItems(prev => (prev ?? []).map(i => i.value === next.value ? next : i))}
              onDelete={() => setItems(prev => (prev ?? []).filter(i => i.value !== item.value))}
            />
          ))}
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
  { label: 'Nội dung',   items: ['content', 'tags', 'categories', 'badges'] },
  { label: 'Thành viên', items: ['members', 'onboarding'] },
];

/* ─── Page ───────────────────────────────────────────────────── */
export default function AdminSettingsPageWrapper() {
  return (
    <React.Suspense>
      <AdminSettingsPage />
    </React.Suspense>
  );
}

function AdminSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = (searchParams.get('tab') as TabKey) ?? 'tags';
  const validTabs = tabs.map(t => t.key);
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'tags';

  const setActiveTab = (tab: TabKey) => {
    router.replace(`/admin/settings?tab=${tab}`, { scroll: false });
  };

  const [onboardingData, setOnboardingData] = React.useState<{
    occupations: OnboardingItem[];
    categories: OnboardingItem[];
  } | null>(null);

  React.useEffect(() => {
    Promise.all([
      getSiteConfigAction('onboarding_occupations'),
      getSiteConfigAction('onboarding_categories'),
    ])
      .then(([occ, cat]) => {
        setOnboardingData({
          occupations: (occ as OnboardingItem[] | null) ?? DEFAULT_OCCUPATIONS,
          categories:  (cat as OnboardingItem[] | null) ?? DEFAULT_CATEGORIES,
        });
      })
      .catch(() => {
        setOnboardingData({ occupations: DEFAULT_OCCUPATIONS, categories: DEFAULT_CATEGORIES });
      });
  }, []);

  const activeTabMeta = tabs.find(t => t.key === activeTab)!;

  const content: Record<TabKey, React.ReactNode> = {
    website:       <WebsiteTab />,
    account:       <AccountTab />,
    content:       <ContentTab />,
    members:       <MembersTab />,
    notifications: <NotificationsTab />,
    appearance:    <AppearanceTab />,
    onboarding: onboardingData
      ? <OnboardingTab initialOccupations={onboardingData.occupations} initialCategories={onboardingData.categories} />
      : <div className="flex items-center gap-2 text-sm text-slate-400 py-8"><span className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin" /> Đang tải...</div>,
    tags:       <TagsTab />,
    categories: <CategoriesTab />,
    badges:     <BadgesTab />,
  };

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Cài đặt' }]} />
      <div className="flex-1 p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Cài đặt</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý cấu hình và tuỳ chỉnh hệ thống</p>
        </div>

        <div className="flex gap-8 items-start">
          {/* Sidebar */}
          <nav className="w-52 shrink-0 space-y-5 sticky top-6">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-1">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map(key => {
                    const tab = tabs.find(t => t.key === key)!;
                    const Icon = tab.icon;
                    const isActive = activeTab === key;
                    const isSoon = SOON_TABS.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => !isSoon && setActiveTab(key)}
                        disabled={isSoon}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSoon
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : isActive
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">{tab.label}</span>
                        {isSoon && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500">
                            Soon
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 max-w-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              {React.createElement(activeTabMeta.icon, { className: 'w-5 h-5 text-primary' })}
              {activeTabMeta.label}
              {SOON_TABS.has(activeTab) && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400">
                  Coming Soon
                </span>
              )}
            </h2>
            {SOON_TABS.has(activeTab) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                  {React.createElement(activeTabMeta.icon, { className: 'w-6 h-6 text-slate-300 dark:text-slate-600' })}
                </div>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Tính năng đang được phát triển</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Sẽ sớm ra mắt trong thời gian tới.</p>
              </div>
            ) : content[activeTab]}
          </div>
        </div>
      </div>
    </>
  );
}
