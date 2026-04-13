import React from 'react';
import { MessageSquare, Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface Props {
  counts: { all: number; visible: number; hidden: number; spam: number };
}

export default function CommentStatsCards({ counts }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Tổng bình luận', value: counts.all,     color: 'text-zinc-800 dark:text-white'  },
        { label: 'Đang hiển thị',  value: counts.visible, color: 'text-emerald-500'                 },
        { label: 'Đã ẩn',          value: counts.hidden,  color: 'text-zinc-500'                   },
        { label: 'Spam',           value: counts.spam,    color: 'text-rose-500'                    },
      ].map(s => (
        <div key={s.label} className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-4">
          <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
