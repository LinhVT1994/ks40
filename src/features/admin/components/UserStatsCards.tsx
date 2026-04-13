import React from 'react';
import { Users, UserCheck, UserX, Crown } from 'lucide-react';
import { User } from '@/features/admin/data/users';

interface Props {
  users: User[];
}

export default function UserStatsCards({ users }: Props) {
  const total = users.length;
  const active = users.filter(u => u.status === 'active').length;
  const locked = users.filter(u => u.status === 'locked').length;
  const premium = users.filter(u => u.role === 'Premium' || u.role === 'Admin').length;

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const stats = [
    { label: 'Tổng thành viên', value: total,   sub: '100% tổng số',       icon: Users,     color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
    { label: 'Đang hoạt động',  value: active,  sub: `${pct(active)}% tổng số`,  icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Đã khoá',         value: locked,  sub: `${pct(locked)}% tổng số`,  icon: UserX,     color: 'text-rose-500',    bg: 'bg-rose-500/10'    },
    { label: 'Premium / Admin', value: premium, sub: `${pct(premium)}% tổng số`, icon: Crown,     color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
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
              <span className="text-xs font-semibold text-zinc-500">{stat.sub}</span>
            </div>
            <p className="text-3xl font-bold text-zinc-800 dark:text-white font-display mb-1">{stat.value}</p>
            <p className="text-sm text-zinc-500 font-medium">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
