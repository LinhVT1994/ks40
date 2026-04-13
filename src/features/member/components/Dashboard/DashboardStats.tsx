'use client';

import React from 'react';
import { Target, Flame, BookOpen, PenLine } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalCompleted: number;
    notesCount: number;
    streak: number;
    last7Days: boolean[];
  } | null;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto mt-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
      {/* Streak Card */}
      <StatCard
        icon={<Flame className={`w-5 h-5 ${stats.streak > 0 ? 'text-orange-500 fill-orange-500/20' : 'text-zinc-400'}`} />}
        label="Dòng chảy (Streak)"
        value={`${stats.streak} ngày`}
        description={
            <div className="flex gap-1 mt-2">
                {stats.last7Days.map((active, i) => (
                    <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-zinc-200 dark:bg-white/10'}`} 
                        title={active ? 'Đã học' : 'Nghỉ ngơi'}
                    />
                ))}
            </div>
        }
      />

      {/* Mastery Card */}
      <StatCard
        icon={<Target className="w-5 h-5 text-primary" />}
        label="Tích lũy kiến thức"
        value={`${stats.totalCompleted}`}
        subValue="bài học"
        description="Đã hoàn thành mục tiêu"
      />

      {/* Notes Card */}
      <StatCard
        icon={<PenLine className="w-5 h-5 text-emerald-500" />}
        label="Kho tri thức"
        value={`${stats.notesCount}`}
        subValue="ghi chú"
        description="Đã lưu lại tinh hoa"
      />
    </div>
  );
}

function StatCard({ icon, label, value, subValue, description }: { 
    icon: React.ReactNode; 
    label: string; 
    value: string; 
    subValue?: string;
    description: React.ReactNode; 
}) {
  return (
    <div className="group relative p-5 rounded-[2rem] bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 transition-all duration-500 hover:border-primary/20 hover:scale-[1.02] hover:bg-zinc-50/50 dark:hover:bg-white/[0.05]">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 group-hover:scale-110 group-hover:bg-primary/5 transition-all">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">
            {value}
          </h3>
          {subValue && (
             <span className="text-[11px] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-tighter">
                {subValue}
             </span>
          )}
        </div>
        <div className="text-[11px] font-bold text-zinc-500 dark:text-slate-400 mt-1 opacity-80">
          {description}
        </div>
      </div>
    </div>
  );
}
