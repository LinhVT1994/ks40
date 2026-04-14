'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Occupation } from '@prisma/client';
import { updatePreferencesAction } from '@/features/onboarding/actions/onboarding';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { TopicItem } from '@/features/admin/actions/topic';

const OCCUPATIONS: { value: Occupation; label: string; emoji: string }[] = [
  { value: 'STUDENT',         label: 'Sinh viên',   emoji: '🎓' },
  { value: 'DEVELOPER',       label: 'Developer',    emoji: '💻' },
  { value: 'DEVOPS_ENGINEER', label: 'DevOps / SRE', emoji: '⚙️' },
  { value: 'DATA_SCIENTIST',  label: 'Data / AI',    emoji: '🤖' },
  { value: 'OTHER',           label: 'Khác',         emoji: '🙌' },
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
  initialTopics: string[];
  availableTopics: TopicItem[];
  initialCodeTheme: string;
}

export default function SettingsPreferences({ initialOccupation, initialTopics, availableTopics, initialCodeTheme }: Props) {
  const router = useRouter();
  const [occupation, setOccupation] = useState<Occupation | null>(initialOccupation);
  const [topics,     setTopics]     = useState<string[]>(initialTopics);
  const [codeTheme,  setCodeTheme]  = useState(initialCodeTheme);
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Unified save function
  const triggerSave = (newOcc: Occupation | null, newTopics: string[], newTheme: string) => {
    if (!newOcc) return;
    startTransition(async () => {
      try {
        await updatePreferencesAction({ 
          occupation: newOcc, 
          interestedTopics: newTopics, 
          codeTheme: newTheme 
        });
        
        // Update local storage and event for theme change
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

  const handleOccupationChange = (val: Occupation) => {
    setOccupation(val);
    triggerSave(val, topics, codeTheme);
  };

  const handleThemeChange = (val: string) => {
    setCodeTheme(val);
    triggerSave(occupation, topics, val);
  };

  const toggleTopic = (id: string) => {
    const nextTopics = topics.includes(id) 
      ? topics.filter(t => t !== id) 
      : [...topics, id];
    setTopics(nextTopics);
    triggerSave(occupation, nextTopics, codeTheme);
  };

  return (
    <div className="relative space-y-8">
      {/* Auto-save Status indicator */}
      <div className="absolute -top-12 right-0 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
        {isPending ? (
          <span className="flex items-center gap-1.5 text-primary animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Đang lưu...
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
          {OCCUPATIONS.map(({ value, label, emoji }) => (
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
              <span>{emoji}</span>{label}
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
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-white/5" />

      {/* Topics */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-white">Chủ đề quan tâm</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Ảnh hưởng đến feed bài viết của bạn.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {availableTopics.map(topic => {
            const isActive = topics.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
                style={isActive ? { borderColor: topic.color ?? undefined, backgroundColor: topic.color ?? undefined } : undefined}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md scale-105'
                    : 'border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-700 dark:text-slate-300 hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                {topic.emoji && <span>{topic.emoji}</span>}{topic.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
