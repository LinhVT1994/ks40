'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FileText, BookOpen, Library, Clock, UserCog } from 'lucide-react';

const tabs = [
  { id: 'articles', label: 'Tất cả',      icon: FileText },
  { id: 'pending',  label: 'Chờ duyệt',   icon: Clock    },
  { id: 'admin',    label: 'Bài của Admin', icon: UserCog  },
  { id: 'series',   label: 'Series',       icon: BookOpen },
  { id: 'books',    label: 'Books',        icon: Library  },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function DocumentsTabs({ activeTab, pendingCount }: { activeTab: TabId; pendingCount?: number }) {
  const router   = useRouter();
  const pathname = usePathname();

  const go = (tab: string) => {
    router.push(tab === 'articles' ? pathname : `${pathname}?tab=${tab}`);
  };

  return (
    <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-white/5 rounded-2xl w-fit">
      {tabs.map(t => {
        const Icon = t.icon;
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              active
                ? 'bg-white dark:bg-slate-800 text-zinc-800 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t.label}
            {t.id === 'pending' && pendingCount !== undefined && pendingCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-black bg-rose-500 text-white rounded-full leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
