"use client";

import { History, Eye, UserPlus, FileText } from 'lucide-react';

export default function RecentActivity() {
  const activities = [
    {
      icon: <Eye className="w-3.5 h-3.5" />,
      text: "Bạn đã xem",
      target: "Microservices 2024",
      time: "2 giờ trước",
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      icon: <FileText className="w-3.5 h-3.5" />,
      text: "Tài liệu mới",
      target: "Next.js 15 Tips",
      time: "5 giờ trước",
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      icon: <UserPlus className="w-3.5 h-3.5" />,
      text: "Thành viên mới",
      target: "Minh Quân",
      time: "1 ngày trước",
      color: "text-purple-500 bg-purple-500/10",
    }
  ];

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">Hoạt động</h3>
      </div>
      
      <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100 dark:before:bg-white/5">
        {activities.map((act, i) => (
          <div key={i} className="flex gap-4 relative z-10">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm ${act.color}`}>
              {act.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                {act.text} <span className="font-bold text-slate-900 dark:text-white">{act.target}</span>
              </p>
              <span className="text-[10px] font-medium text-slate-400 mt-1 block uppercase tracking-tight">{act.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
