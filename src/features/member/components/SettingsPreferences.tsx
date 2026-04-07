'use client';

import { useState, useTransition } from 'react';
import { ArticleCategory, Occupation } from '@prisma/client';
import { updatePreferencesAction } from '@/features/onboarding/actions/onboarding';
import { Loader2, CheckCircle2 } from 'lucide-react';

const OCCUPATIONS: { value: Occupation; label: string; emoji: string }[] = [
  { value: 'STUDENT',         label: 'Sinh viên',   emoji: '🎓' },
  { value: 'DEVELOPER',       label: 'Developer',    emoji: '💻' },
  { value: 'DEVOPS_ENGINEER', label: 'DevOps / SRE', emoji: '⚙️' },
  { value: 'DATA_SCIENTIST',  label: 'Data / AI',    emoji: '🤖' },
  { value: 'OTHER',           label: 'Khác',         emoji: '🙌' },
];

const CATEGORIES: { value: ArticleCategory; label: string; emoji: string; active: string }[] = [
  { value: 'SYSTEM_DESIGN', label: 'System Design', emoji: '🏗️', active: 'border-violet-500 bg-violet-500 text-white' },
  { value: 'AI_ML',         label: 'AI / ML',        emoji: '🤖', active: 'border-orange-500 bg-orange-500 text-white' },
  { value: 'DEVOPS',        label: 'DevOps',          emoji: '⚙️', active: 'border-emerald-500 bg-emerald-500 text-white' },
  { value: 'BLOCKCHAIN',    label: 'Blockchain',      emoji: '🔗', active: 'border-yellow-500 bg-yellow-500 text-white' },
  { value: 'FRONTEND',      label: 'Frontend',        emoji: '🎨', active: 'border-pink-500 bg-pink-500 text-white' },
  { value: 'BACKEND',       label: 'Backend',         emoji: '🔧', active: 'border-blue-500 bg-blue-500 text-white' },
  { value: 'OTHER',         label: 'Khác',            emoji: '📚', active: 'border-slate-500 bg-slate-500 text-white' },
];

const CODE_THEMES = [
  { id: 'classic',   name: 'Classic Dark',   colors: ['#1E1E1E', '#D4D4D4'] },
  { id: 'dracula',   name: 'Dracula',        colors: ['#282A36', '#BD93F9', '#ff79c6'] },
  { id: 'monokai',   name: 'Monokai Pro',   colors: ['#2D2A2E', '#FFD866', '#FCFCFA'] },
  { id: 'synthwave', name: 'Synthwave \'84', colors: ['#262335', '#ff7edb', '#2de2e6'] },
  { id: 'nord',      name: 'Nordic Frost',   colors: ['#2E3440', '#88C0D0', '#D8DEE9'] },
];

interface Props {
  initialOccupation: Occupation | null;
  initialCategories: ArticleCategory[];
  initialCodeTheme: string;
}

export default function SettingsPreferences({ initialOccupation, initialCategories, initialCodeTheme }: Props) {
  const [occupation, setOccupation] = useState<Occupation | null>(initialOccupation);
  const [categories, setCategories] = useState<ArticleCategory[]>(initialCategories);
  const [codeTheme,  setCodeTheme]  = useState(initialCodeTheme);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const toggleCategory = (cat: ArticleCategory) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    setSaved(false);
  };

  const handleSave = () => {
    if (!occupation) return;
    startTransition(async () => {
      await updatePreferencesAction({ occupation, interestedCategories: categories, codeTheme });
      localStorage.setItem('ks-code-theme', codeTheme);
      // Trigger update for active tabs
      window.dispatchEvent(new CustomEvent('code-theme-changed', { detail: codeTheme }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const isDirty = occupation !== initialOccupation ||
    JSON.stringify([...categories].sort()) !== JSON.stringify([...initialCategories].sort());

  return (
    <div className="space-y-8">
      {/* Occupation */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Vai trò của bạn</h3>
          <p className="text-xs text-slate-500 mt-0.5">Dùng để cá nhân hóa nội dung phù hợp.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {OCCUPATIONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setOccupation(value); setSaved(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                occupation === value
                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-primary/40'
              }`}
            >
              <span>{emoji}</span>{label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-white/5" />

      {/* Code Theme */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Giao diện Code mặc định</h3>
          <p className="text-xs text-slate-500 mt-0.5">Áp dụng cho trình đọc sách và bài viết toàn hệ thống.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CODE_THEMES.map((t) => {
            const isActive = codeTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setCodeTheme(t.id); setSaved(false); }}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300'
                }`}
              >
                <div className="flex -space-x-1 shrink-0">
                  {t.colors.map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-black truncate ${isActive ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                    {t.name}
                  </div>
                </div>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-white/5" />

      {/* Categories */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Chủ đề quan tâm</h3>
          <p className="text-xs text-slate-500 mt-0.5">Ảnh hưởng đến feed "Gợi ý cho bạn".</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {CATEGORIES.map(({ value, label, emoji, active }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleCategory(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                categories.includes(value)
                  ? `${active} shadow-md scale-105`
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <span>{emoji}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!occupation || !isDirty || isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-95"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4" /> Đã lưu
          </span>
        )}
      </div>
    </div>
  );
}
