'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Heart, MessageCircle, TrendingUp, Users, 
  FileText, BarChart3, ArrowUpRight, ArrowDownRight,
  Target, Zap, Clock, Bookmark
} from 'lucide-react';

interface AnalyticsDashboardProps {
  growth: any[];
  metrics: any;
  topics: any[];
  topContent: any[];
}

export default function AnalyticsDashboard({ growth, metrics, topics, topContent }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-10 pb-20">
      {/* 1. Overall Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Tổng lượt xem" 
          value={metrics.totalViews.toLocaleString()} 
          icon={<Eye className="w-5 h-5" />} 
          trend="+12.5%" 
          positive={true}
          description="Đã xem bài viết"
        />
        <MetricCard 
          label="Tương tác (Lượt thích)" 
          value={metrics.totalLikes.toLocaleString()} 
          icon={<Heart className="w-5 h-5" />} 
          trend="+5.2%" 
          positive={true}
          description="Người dùng ủng hộ"
        />
        <MetricCard 
          label="Tỷ lệ quan tâm" 
          value={`${metrics.likesPerView.toFixed(2)}%`} 
          icon={<Zap className="w-5 h-5 text-amber-500" />} 
          trend="+0.8%" 
          positive={true}
          description="Thích / Lượt xem"
        />
        <MetricCard 
          label="Bình luận mới" 
          value={metrics.totalComments.toLocaleString()} 
          icon={<MessageCircle className="w-5 h-5 text-primary" />} 
          trend="+2.1%" 
          positive={true}
          description="Thảo luận nội dung"
        />
      </div>

      {/* 2. Content Growth (Custom Minimalist Chart) */}
      <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div>
              <h3 className="text-xl font-black text-zinc-800 dark:text-white tracking-tighter">Xu hướng tăng trưởng</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">30 ngày qua (Bài viết & Hoạt động)</p>
          </div>
          <div className="flex items-center gap-6">
             <LegendItem label="Bài viết" color="bg-primary" />
             <LegendItem label="Hoạt động" color="bg-accent-purple" />
          </div>
        </div>
        
        <div className="h-[300px] flex items-end justify-between gap-1 sm:gap-2 px-2">
            {growth.map((day, i) => {
               const maxArticles = Math.max(...growth.map(d => d.articles)) || 1;
               const maxActivity = Math.max(...growth.map(d => d.activity)) || 1;
               
               return (
                 <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Activity Bar (background) */}
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.activity / maxActivity) * 100}%` }}
                        transition={{ duration: 1, delay: i * 0.02, ease: "easeOut" }}
                        className="w-full bg-accent-purple/10 rounded-t-lg group-hover:bg-accent-purple/20 transition-colors"
                    />
                    {/* Article Bar (foreground) */}
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.articles / maxArticles) * 60}%` }}
                        transition={{ duration: 1, delay: i * 0.03, ease: "circOut" }}
                        className="absolute bottom-0 w-[40%] bg-primary rounded-t-full shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    />
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 translate-y-2 group-hover:translate-y-0">
                       <div className="bg-zinc-800 dark:bg-white text-white dark:text-slate-900 p-3 rounded-2xl shadow-2xl text-xs font-bold ring-4 ring-white/10 whitespace-nowrap">
                          <p className="text-[10px] uppercase opacity-60 mb-1">{day.date}</p>
                          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> {day.articles} bài viết</div>
                          <div className="flex items-center gap-2 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-accent-purple" /> {day.activity} lượt đọc</div>
                       </div>
                    </div>
                 </div>
               );
            })}
        </div>
        <div className="mt-6 flex justify-between px-2 text-[10px] font-black uppercase text-zinc-400 opacity-60">
           <span>{growth[0]?.date}</span>
           <span>{growth[Math.floor(growth.length / 2)]?.date}</span>
           <span>Hôm nay</span>
        </div>
      </div>

      {/* 3. Topics & Detailed Content Grid */}
      <div className="grid lg:grid-cols-12 gap-10">
        {/* Topic performance */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm h-full">
              <h3 className="text-xl font-black text-zinc-800 dark:text-white tracking-tighter mb-8 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Mức độ lan tỏa
              </h3>
              <div className="space-y-6">
                {topics.slice(0, 6).map((topic, i) => {
                   const maxViews = Math.max(...topics.map(t => t.totalViews)) || 1;
                   return (
                     <div key={topic.label} className="space-y-2 animate-in fade-in slide-in-from-left-4 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                           <span className="truncate max-w-[150px]">{topic.label}</span>
                           <span className="text-zinc-800 dark:text-white">{topic.totalViews.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${(topic.totalViews / maxViews) * 100}%` }}
                             transition={{ duration: 1.5, delay: i * 0.1, ease: 'circOut' }}
                             className="h-full rounded-full"
                             style={{ backgroundColor: topic.color }}
                           />
                        </div>
                     </div>
                   );
                })}
              </div>
           </div>
        </div>

        {/* Top articles table */}
        <div className="lg:col-span-8">
           <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
             <div className="p-8 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-zinc-800 dark:text-white tracking-tighter flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Hiệu quả bài viết
                </h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      <th className="px-8 py-5">Tiêu đề & Tác giả</th>
                      <th className="px-8 py-5">Chủ đề</th>
                      <th className="px-8 py-5 text-right">Lượt xem</th>
                      <th className="px-8 py-5 text-right">Tương tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                    {topContent.map((article, i) => (
                      <tr key={article.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-800 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">{article.title}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{article.author.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black px-2 py-1 rounded-md border border-zinc-200 dark:border-white/10 uppercase tracking-wider text-zinc-500" style={{ color: article.topic.color ?? '#3b82f6' }}>
                             {article.topic.label}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-sm text-zinc-800 dark:text-white tabular-nums">
                           {article.viewCount.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-3 text-zinc-400">
                              <span className="flex items-center gap-1 text-[11px] font-bold"><Heart className="w-3 h-3 text-rose-500" /> {article._count.likes}</span>
                              <span className="flex items-center gap-1 text-[11px] font-bold"><MessageCircle className="w-3 h-3 text-primary" /> {article._count.comments}</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, trend, positive, description }: { 
    label: string; 
    value: string; 
    icon: React.ReactNode; 
    trend: string;
    positive: boolean;
    description: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-950 border border-zinc-200 dark:border-white/5 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group-hover:bg-primary/10 transition-colors">
          <div className="text-zinc-500 dark:text-slate-400 group-hover:text-primary transition-colors">
            {icon}
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-zinc-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-3xl font-black text-zinc-800 dark:text-white tracking-tighter">{value}</h3>
      <p className="text-[10px] font-bold text-zinc-500 dark:text-slate-400 mt-2 flex items-center gap-1.5 opacity-60 uppercase tracking-widest">
         <Clock className="w-3 h-3" />
         {description}
      </p>
    </div>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
       <div className={`w-3 h-3 rounded-full ${color}`} />
       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
    </div>
  );
}
