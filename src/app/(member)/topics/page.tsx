import type { Metadata } from 'next';
import { getTopicTreeAction } from '@/features/admin/actions/topic';
import MemberContainer from '@/components/layout/MemberContainer';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = {
  title: `Chủ đề tri thức | ${SITE_NAME}`,
  description: 'Hệ thống hóa tri thức theo từng khối lĩnh vực: System Design, AI, DevOps, Frontend, Backend và phát triển sự nghiệp.',
  alternates: { canonical: '/topics' },
};

export default async function TopicsExplorerPage() {
  const topicsTree = await getTopicTreeAction();
  // Filter out disabled parents and parents without enabled children (unless the parent itself is a primary target)
  const activeTree = topicsTree.filter(t => t.enabled && (t.children?.some(c => c.enabled) || (t._count?.articles ?? 0) > 0));

  return (
    <MemberContainer>
      <div className="mt-12 sm:mt-16 mb-32 px-4 md:px-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-12">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-slate-300 hover:text-primary transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-full border border-zinc-300 dark:border-white/10 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            </div>
            Quay lại
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-20">
          <h1 className="text-4xl sm:text-6xl font-display font-heavy text-zinc-800 dark:text-white leading-[1.1] tracking-tight">
            Chủ đề
          </h1>
          <p className="text-zinc-500 dark:text-slate-300 mt-6 text-lg max-w-xl leading-relaxed font-medium">
            Hệ thống hóa tri thức theo từng khối lĩnh vực để bạn dễ dàng bao quát toàn bộ nội dung.
          </p>
        </div>

        {/* Masonry Matrix Layout */}
        <div className="columns-1 md:columns-2 lg:columns-4 gap-12 space-y-20">
          {activeTree.map((parent) => {
            const children = (parent.children ?? []).filter(c => c.enabled);
            const color = parent.color || '#64748b';
            
            return (
              <div 
                key={parent.id} 
                className="break-inside-avoid flex flex-col group relative"
              >
                {/* Background Glow */}
                <div 
                    className="absolute -inset-6 bg-gradient-to-br from-white/50 to-white/30 dark:from-white/[0.03] dark:to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"
                    style={{ background: `radial-gradient(circle at 0% 0%, ${color}10, transparent 70%)` }}
                />
                {/* Clickable Header */}
                <Link 
                  href={`/topic/${parent.slug}`}
                  className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5 hover:border-primary/50 transition-all group/head"
                >
                  <div 
                    className="w-1.5 h-6 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <h2 className="text-xl font-display font-bold text-zinc-800 dark:text-white group-hover/head:text-primary transition-colors flex items-center gap-2">
                    {parent.label}
                    <ChevronRight className="w-4 h-4 text-zinc-300 opacity-0 group-hover/head:opacity-100 group-hover/head:translate-x-1 transition-all" />
                  </h2>
                </Link>

                {/* Vertical Link List */}
                <div className="flex flex-col gap-y-4 px-1">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/topic/${child.slug}`}
                      className="text-[13px] font-medium text-zinc-500 dark:text-slate-300 hover:text-zinc-800 dark:hover:text-white transition-all hover:translate-x-1 w-fit flex items-center gap-2 group/item"
                    >
                      <ChevronRight className="w-3 h-3 text-zinc-200 dark:text-white/20 group-hover/item:text-primary transition-all opacity-0 group-hover/item:opacity-100 -ml-5 group-hover/item:ml-0" />
                      {child.label}
                      <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-normal opacity-60">({child._count?.articles ?? 0})</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Footer Search */}
        <div className="mt-40 pt-16 border-t border-zinc-200 dark:border-white/5 text-center">
            <p className="text-zinc-500 font-medium text-sm">
                Bạn không tìm thấy chủ đề phù hợp? <Link href="/search" className="text-primary hover:underline font-bold transition-all underline-offset-4 decoration-2">Khám phá qua Tìm kiếm</Link>
            </p>
        </div>
      </div>
    </MemberContainer>
  );
}
