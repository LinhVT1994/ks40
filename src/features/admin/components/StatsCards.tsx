import React from 'react';
import { FileText, Users, Eye, MessageCircle } from 'lucide-react';

type StatsCardsProps = {
  totalArticles: number;
  totalUsers: number;
  totalViews: number;
  newCommentsToday: number;
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function StatsCards({ totalArticles, totalUsers, totalViews, newCommentsToday }: StatsCardsProps) {
  const stats = [
    { label: 'Tổng bài viết',    value: fmt(totalArticles),    icon: FileText,       color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    { label: 'Người dùng',       value: fmt(totalUsers),       icon: Users,          color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Tổng lượt xem',    value: fmt(totalViews),       icon: Eye,            color: 'text-violet-500',  bg: 'bg-violet-500/10' },
    { label: 'Bình luận hôm nay', value: fmt(newCommentsToday), icon: MessageCircle, color: 'text-rose-500',    bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-3xl p-6 hover:shadow-lg hover:shadow-zinc-100 dark:hover:shadow-black/10 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-5">
              <div className={`p-3 rounded-2xl ${stat.bg} transition-transform group-hover:scale-110`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-800 dark:text-white font-display mb-1">{stat.value}</p>
            <p className="text-sm text-zinc-500 font-medium">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
