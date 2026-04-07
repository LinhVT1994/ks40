'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FileText, BookOpen, Library } from 'lucide-react';

const tabs = [
  { id: 'articles', label: 'Bài viết', icon: FileText },
  { id: 'series',   label: 'Series',   icon: BookOpen  },
  { id: 'books',    label: 'Books',    icon: Library   },
] as const;

export default function DocumentsTabs({ activeTab }: { activeTab: 'articles' | 'series' | 'books' }) {
  const router   = useRouter();
  const pathname = usePathname();

  const go = (tab: string) => {
    router.push(tab === 'articles' ? pathname : `${pathname}?tab=${tab}`);
  };

  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit">
      {tabs.map(t => {
        const Icon = t.icon;
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              active
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
