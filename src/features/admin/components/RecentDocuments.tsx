import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  SYSTEM_DESIGN: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  AI_ML:         'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  DEVOPS:        'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  BLOCKCHAIN:    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  FRONTEND:      'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  BACKEND:       'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  OTHER:         'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  SYSTEM_DESIGN: 'System', AI_ML: 'AI/ML', DEVOPS: 'DevOps',
  BLOCKCHAIN: 'Blockchain', FRONTEND: 'Frontend', BACKEND: 'Backend', OTHER: 'Khác',
};

type Doc = {
  id: string; title: string; slug: string; category: string;
  viewCount: number; createdAt: Date; publishedAt: Date | null; status: string;
};

export default function RecentDocuments({ articles }: { articles: Doc[] }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
        <h3 className="font-display font-bold text-slate-900 dark:text-white">Bài viết gần đây</h3>
        <Link href="/admin/documents" className="text-xs font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
          Xem tất cả <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {articles.map(doc => (
          <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
            <div className="flex-1 min-w-0">
              <Link href={`/article/${doc.slug}`} target="_blank" className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1 group-hover:text-primary transition-colors block">
                {doc.title}
              </Link>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${CATEGORY_COLORS[doc.category] ?? 'bg-slate-100'}`}>
                  {CATEGORY_LABELS[doc.category] ?? doc.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(doc.publishedAt ?? doc.createdAt))}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{doc.viewCount.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400">lượt xem</p>
            </div>
            <div className="shrink-0">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                doc.status === 'PUBLISHED'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-white/5'
              }`}>
                {doc.status === 'PUBLISHED' ? 'Đã đăng' : 'Nháp'}
              </span>
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">Chưa có bài viết nào.</div>
        )}
      </div>
    </div>
  );
}
