'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { updatePreferencesAction, getOccupationOptionsAction } from '@/features/onboarding/actions/onboarding';
import type { OccupationOption } from '@/features/onboarding/actions/onboarding';
import { Loader2, CheckCircle2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import ProfileTopics from './ProfileTopics';
import type { TopicItem } from '@/features/admin/actions/topic';

const CODE_THEMES = [
  { id: 'classic',   name: 'Classic Dark',   colors: ['#1E1E1E', '#D4D4D4'] },
  { id: 'dracula',   name: 'Dracula',        colors: ['#282A36', '#BD93F9', '#ff79c6'] },
  { id: 'monokai',   name: 'Monokai Pro',    colors: ['#2D2A2E', '#FFD866', '#FCFCFA'] },
  { id: 'synthwave', name: "Synthwave '84",  colors: ['#262335', '#ff7edb', '#2de2e6'] },
  { id: 'nord',      name: 'Nordic Frost',   colors: ['#2E3440', '#88C0D0', '#D8DEE9'] },
];

interface Props {
  initialOccupation: string | null;
  initialCodeTheme: string;
  initialTopics: string[];
  availableTopics: TopicItem[];
}

export default function SettingsPreferences({ 
  initialOccupation, 
  initialCodeTheme,
  initialTopics,
  availableTopics
}: Props) {
  const router = useRouter();
  const [occupation, setOccupation] = useState<string | null>(initialOccupation);
  const [codeTheme,  setCodeTheme]  = useState(initialCodeTheme);
  const [isPending,  startTransition] = useTransition();
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null);
  const [occupationOptions, setOccupationOptions] = useState<OccupationOption[]>([]);

  useEffect(() => {
    getOccupationOptionsAction().then(setOccupationOptions);
  }, []);

  const triggerSave = (newOcc: string | null, newTheme: string) => {
    if (!newOcc) return;
    startTransition(async () => {
      try {
        await updatePreferencesAction({ occupation: newOcc, codeTheme: newTheme });
        if (newTheme !== codeTheme) {
          localStorage.setItem('ks-code-theme', newTheme);
          window.dispatchEvent(new CustomEvent('code-theme-changed', { detail: newTheme }));
        }
        setLastSaved(new Date());
        router.refresh();
      } catch (error) {
        console.error('Failed to autosave preferences:', error);
      }
    });
  };

  const handleOccupationChange = (val: string) => {
    setOccupation(val);
    triggerSave(val, codeTheme);
  };

  const handleThemeChange = (val: string) => {
    setCodeTheme(val);
    triggerSave(occupation, val);
  };

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      <div className="absolute -top-12 right-0 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
        {isPending ? (
          <span className="flex items-center gap-1.5 text-primary animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
          </span>
        ) : lastSaved ? (
          <span className="flex items-center gap-1.5 text-emerald-500">
            <CheckCircle2 className="w-3 h-3" />
            Đã lưu {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="text-zinc-500">Tự động lưu thay đổi</span>
        )}
      </div>

      {/* Occupation */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-white">Vai trò của bạn</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Dùng để cá nhân hóa nội dung phù hợp.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {occupationOptions.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleOccupationChange(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                occupation === value
                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                  : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-700 dark:text-slate-300 hover:border-primary/40'
              }`}
            >
              {emoji && <span>{emoji}</span>}{label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-white/5" />

      {/* Code Theme */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-white">Giao diện Code mặc định</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Áp dụng cho trình đọc sách và bài viết toàn hệ thống.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CODE_THEMES.map((t) => {
            const isActive = codeTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                    : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 hover:border-zinc-300'
                }`}
              >
                <div className="flex -space-x-1 shrink-0">
                  {t.colors.map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-black truncate ${isActive ? 'text-primary' : 'text-zinc-700 dark:text-slate-300'}`}>
                    {t.name}
                  </div>
                </div>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-white/5" />

      {/* Topics Management */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-white">Chủ đề bài viết</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Tinh chỉnh thuật toán gợi ý bằng các chủ đề bạn quan tâm.</p>
          </div>
          <Link 
            href="/topics"
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] hover:border-primary/40 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300"
          >
            <span className="text-[10px] font-black text-zinc-500 group-hover:text-primary uppercase tracking-widest transition-colors">Khám phá thêm</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-primary transition-all group-hover:rotate-12" />
          </Link>
        </div>
        <div className="-mx-1">
          <ProfileTopics 
            initialTopics={initialTopics} 
            availableTopics={availableTopics} 
          />
        </div>
      </div>
    </div>
  );
}
