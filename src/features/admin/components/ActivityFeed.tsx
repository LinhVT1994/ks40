"use client";

import React, { useEffect, useState } from 'react';
import { UserPlus, FileText, MessageSquare, Star, Bell, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import type { Activity } from '@prisma/client';

export type ActivityWithActor = Activity & {
  actor?: { name: string; image: string | null; email: string } | null;
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType, color: string, bg: string }> = {
  USER_REGISTERED:   { icon: UserPlus,      color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ARTICLE_PUBLISHED: { icon: FileText,      color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  COMMENT_POSTED:    { icon: MessageSquare, color: 'text-violet-500',  bg: 'bg-violet-500/10' },
  USER_UPGRADED:     { icon: Star,          color: 'text-amber-500',   bg: 'bg-amber-500/10' },
  SYSTEM_ALERT:      { icon: Bell,          color: 'text-rose-500',    bg: 'bg-rose-500/10' },
};

function renderMessage(msg: string) {
  const parts = msg.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="font-bold text-zinc-800 dark:text-white">{part}</span>
      : <span key={i}>{part}</span>
  );
}

export default function ActivityFeed({ activities = [] }: { activities: ActivityWithActor[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-white/5">
        <h3 className="font-display font-bold text-zinc-800 dark:text-white">Hoạt động gần đây</h3>
        <Link href="/admin/activity" className="text-xs font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
          Xem tất cả <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-white/5">
        {activities.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-zinc-500">Không có hoạt động nào.</div>
        ) : (
          activities.map((activity) => {
            const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.SYSTEM_ALERT;
            const Icon = config.icon;
            
            const content = (
              <div className="flex items-start gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors h-full">
                <div className={`p-2 rounded-xl shrink-0 ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-600 dark:text-slate-300 leading-relaxed">
                    {renderMessage(activity.message)}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                    {mounted ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: vi }) : ''}
                  </p>
                </div>
              </div>
            );

            if (activity.link) {
              return (
                <Link key={activity.id} href={activity.link} className="block group">
                  {content}
                </Link>
              );
            }

            return <div key={activity.id}>{content}</div>;
          })
        )}
      </div>
    </div>
  );
}
