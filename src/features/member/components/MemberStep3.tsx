import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Send, CheckCircle2, ChevronLeft } from 'lucide-react';
import ArticleHero from '@/features/member/components/ArticleHero';
import ArticleContent from '@/features/member/components/ArticleContent';
import type { TopicItem } from '@/features/admin/actions/topic';
import type { ArticleFull } from '@/features/articles/actions/article';

interface Step3Props {
  data: {
    title: string;
    content: string;
    overview: string;
    objectives: string;
    topic?: TopicItem;
    tags: string[];
    summary: string;
    cover: string;
    coverPosition: string;
    thumbnail: string;
    author?: {
      name: string;
      image?: string;
    };
    wordCount: number;
  };
  onBack: () => void;
  onPublish: () => void;
  isPending: boolean;
}

export default function MemberStep3({ data, onBack, onPublish, isPending }: Step3Props) {
  const readTime = Math.max(1, Math.ceil(data.wordCount / 200));

  // Construct a mock article object for high-fidelity components
  const mockArticle: ArticleFull = {
    id: 'preview',
    title: data.title || 'Tiêu đề bài viết',
    slug: 'preview',
    summary: data.summary,
    content: data.content,
    overview: data.overview,
    objectives: data.objectives,
    thumbnail: data.thumbnail || null,
    thumbnailPosition: '50% 50%',
    cover: data.cover || null,
    coverPosition: data.coverPosition || '50% 50%',
    topic: data.topic ? {
      id: data.topic.id,
      slug: data.topic.slug,
      label: data.topic.label,
      emoji: data.topic.emoji,
      color: data.topic.color,
      parentId: data.topic.parentId,
    } : {
      id: 'mock',
      slug: 'mock',
      label: 'Chủ đề',
      emoji: null,
      color: '#64748b',
      parentId: null
    },
    audience: 'PUBLIC',
    badges: [],
    readTime,
    viewCount: 0,
    publishedAt: new Date(),
    updatedAt: new Date(),
    seriesId: null,
    authorId: 'preview-author',
    author: {
      id: 'preview-author',
      name: data.author?.name || 'Tác giả',
      image: data.author?.image || null,
      username: null,
    },
    tags: data.tags.map(t => ({ tag: { name: t, slug: t } })),
    resources: [],
    _count: { likes: 0, comments: 0, bookmarks: 0 },
    isLiked: false,
    isBookmarked: false,
  };

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-[#0c0c0c] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/5">
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-20">
        <div className="xl:grid xl:grid-cols-12 gap-16 items-start">
          {/* Main content - Matches ArticleDetailPage structure */}
          <main className="xl:col-span-9">
            <ArticleHero article={mockArticle} />
            
            <div className="mt-12">
              <ArticleContent
                articleId="preview"
                content={data.content}
                overview={data.overview}
                objectives={data.objectives}
                likeCount={0}
                commentCount={0}
                isLiked={false}
                isBookmarked={false}
                isPreview={true}
                audience="PUBLIC"
              />
            </div>

            {/* Simulated Footer Notice */}
            <div className="mt-20 pt-10 border-t border-zinc-200 dark:border-white/5">
               <div className="bg-zinc-50 dark:bg-white/[0.02] rounded-3xl p-8 border border-zinc-200 dark:border-white/5 text-center">
                  <h4 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider mb-2">Thông tin kiểm duyệt</h4>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Bài viết của bạn sẽ được đội ngũ biên tập kiểm tra nội dung, chính tả và định dạng trước khi xuất bản. 
                    Quá trình này thường hoàn tất trong vòng 24 giờ làm việc.
                  </p>
               </div>
            </div>
          </main>

          {/* Sidebar Mockup */}
          <aside className="hidden xl:block xl:col-span-3 sticky top-[100px] border-l border-zinc-200 dark:border-white/5 pl-8 space-y-10 group/sidebar">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tác giả</h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden relative border-2 border-primary/20">
                   {data.author?.image && (
                     <Image
                       src={data.author.image}
                       alt="Avatar"
                       fill
                       sizes="48px"
                       className="object-cover"
                     />
                   )}
                </div>
                <div>
                   <Link href={`/profile/preview-author`} className="hover:text-primary transition-colors">
                     <div className="text-sm font-bold text-zinc-800 dark:text-white transition-colors">{data.author?.name || 'Tác giả'}</div>
                     <div className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Thành viên cộng đồng</div>
                   </Link>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-zinc-300 dark:border-white/10">
               <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Ghi chú xem trước</div>
               <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                 Đây là bản mô phỏng giao diện khi bài viết đã được xuất bản. Một số tính năng tương tác như Thả tim, Bình luận sẽ được kích hoạt sau khi bài viết Online.
               </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
