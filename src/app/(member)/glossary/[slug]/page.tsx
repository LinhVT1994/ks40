import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, Share2, Sparkles } from 'lucide-react';
import { getGlossaryTermBySlugAction, getGlossaryTermsAction, GlossaryTermSummary } from '@/features/admin/actions/glossary';
import { SITE_NAME } from '@/lib/seo';
import MemberContainer from '@/components/layout/MemberContainer';
import MarkdownViewer from '@/components/shared/MarkdownViewer';
import AuthorCard from '@/features/member/components/AuthorCard';
import FloatingInteractionHub from '@/features/member/components/FloatingInteractionHub';
import MobileInteractionBar from '@/features/member/components/MobileInteractionBar';
import { GlossaryInteractionProvider } from '@/features/member/context/GlossaryInteractionContext';
import * as motion from 'framer-motion/client';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; letter?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const term = await getGlossaryTermBySlugAction(slug);
  if (!term) return {};

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lenote.vn';
  const url = `${baseUrl}/glossary/${slug}`;
  const title = `${term.term} là gì? Định nghĩa và ý nghĩa | ${SITE_NAME}`;
  const description = term.shortDef || `Tìm hiểu định nghĩa chi tiết về ${term.term}. Giải thích ý nghĩa và ứng dụng của ${term.term} trong ${term.topic?.label || 'công nghệ'}.`;

  return {
    title,
    description,
    keywords: [term.term, term.topic?.label || '', 'định nghĩa', 'thuật ngữ', 'glossary', SITE_NAME].filter(Boolean),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'vi_VN',
      type: 'article',
      publishedTime: term.createdAt.toISOString(),
      modifiedTime: term.updatedAt.toISOString(),
      authors: [term.author?.name || SITE_NAME],
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(term.term)}&description=${encodeURIComponent(term.shortDef || '')}&type=glossary`,
          width: 1200,
          height: 630,
          alt: term.term,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/api/og?title=${encodeURIComponent(term.term)}&description=${encodeURIComponent(term.shortDef || '')}&type=glossary`],
    },
  };
}

export default async function GlossaryTermPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { search, letter } = await searchParams;
  const term = await getGlossaryTermBySlugAction(slug);
  if (!term) notFound();

  // Fetch related terms from the same topic
  const { terms: related } = term.topicId ? await getGlossaryTermsAction({
    topicId: term.topicId,
    limit: 6,
  }) : { terms: [] };

  const otherTerms = related.filter((t: GlossaryTermSummary) => t.id !== term.id).slice(0, 5);

  const topicColor = term.topic?.color ?? '#3b82f6';

  const backQuery = new URLSearchParams();
  if (search) backQuery.set('search', search);
  if (letter) backQuery.set('letter', letter);
  const backHref = `/glossary${backQuery.toString() ? `?${backQuery.toString()}` : ''}`;

  return (
    <MemberContainer>
      <GlossaryInteractionProvider
        termId={term.id}
        initialLiked={term.isLiked}
        initialBookmarked={term.isBookmarked}
        initialLikeCount={term.likeCount}
        author={{
          id: term.author?.id ?? '',
          name: term.author?.name ?? 'Unknown',
          image: term.author?.image ?? null,
          username: term.author?.username ?? '',
          articleCount: term.author?.articleCount ?? 0,
          bio: term.author?.bio ?? null,
        }}
        initialIsFollowing={term.author?.isFollowing ?? false}
        initialFollowerCount={term.author?.followerCount ?? 0}
      >
        <div className="relative w-full max-w-[820px] mx-auto min-w-0 md:overflow-visible">
          {/* Hanging Interaction Sidebar */}
          <aside className="hidden lg:block absolute left-full top-0 h-full pointer-events-none">
            <div className="sticky top-[50vh] -translate-y-1/2 pl-12 xl:pl-14 2xl:pl-24 transition-all pointer-events-auto">
              <FloatingInteractionHub className="!static" />
            </div>
          </aside>

          <main className="w-full transition-colors min-h-[calc(100vh-120px)]">
            <header className="w-full pt-8 md:pt-12 pb-6 md:pb-8 px-6 md:px-12 space-y-8 md:space-y-10">
              <div className="flex items-center justify-between">
                <Link
                  href={backHref}
                  className="group flex items-center gap-2.5 text-zinc-400 hover:text-primary transition-all duration-300"
                >
                  <div className="p-2 rounded-full bg-zinc-50 dark:bg-white/5 group-hover:bg-primary/10 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5 md:w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Quay lại</span>
                </Link>
              </div>

              {/* Hero Section */}
              <div className="space-y-6 md:space-y-8">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    {term.topic && (
                      <span
                        className="inline-flex px-3 py-1 rounded-xl text-[8px] md:text-[8px] font-black tracking-widest border"
                        style={{
                          backgroundColor: `${topicColor}10`,
                          borderColor: `${topicColor}20`,
                          color: topicColor
                        }}
                      >
                        {term.topic.label}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-heavy text-zinc-800 dark:text-white leading-[1.15] tracking-tight">
                    {term.term}
                  </h1>

                  {/* Short Definition */}
                  <div className="relative w-full border-l-4 pl-6 py-2" style={{ borderColor: `${topicColor}40` }}>
                    <p className="text-zinc-600 dark:text-slate-300 text-lg md:text-xl leading-relaxed font-medium italic">
                      {term.shortDef}
                    </p>
                  </div>

                  {/* Contributor Info */}
                  {term.author && (
                    <div className="flex items-center gap-3 pt-2 lg:hidden">
                      <div className="flex -space-x-2">
                        <img 
                          src={term.author.image || '/default-avatar.png'} 
                          alt={term.author.name} 
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 dark:text-slate-500 font-bold uppercase tracking-widest">Đóng góp bởi</span>
                        <Link 
                          href={`/profile/${term.author.username || term.author.id}`}
                          className="text-xs font-bold text-zinc-800 dark:text-white hover:text-primary transition-colors"
                        >
                          {term.author.name}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>
            <div className="w-full">
              {/* Detailed Content */}
              <article className="prose prose-zinc dark:prose-invert max-w-none w-full px-6 md:px-12 prose-p:text-zinc-600 dark:prose-p:text-slate-400 prose-headings:text-zinc-800 dark:prose-headings:text-white prose-p:text-base md:text-lg prose-p:leading-relaxed">
                <MarkdownViewer content={term.definition} />
              </article>

              {/* Footer Metadata & Interactions */}
              <div className="flex items-center justify-between mt-8 lg:justify-end gap-4 py-8 px-6 md:px-12 border-t border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="hidden sm:inline">Cập nhật:</span>
                  <span>{new Date(term.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>

                <div className="flex items-center lg:hidden">
                  <MobileInteractionBar />
                </div>
              </div>

              {/* Author Section at Bottom (Mobile only) */}
              {term.author && (
                <div className="px-6 md:px-12 pt-10 lg:hidden">
                  <div className="pt-10 border-t border-zinc-100 dark:border-white/5">
                    <AuthorCard author={term.author} />
                  </div>
                </div>
              )}

              {/* Related Terms Section */}
              {otherTerms.length > 0 && (
                <div className="pt-8 md:pt-10 px-6 md:px-12 pb-24 md:pb-12 space-y-6 md:space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-800 dark:text-white">
                      Thuật ngữ liên quan
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {otherTerms.map((t: GlossaryTermSummary, i: number) => (
                      <Link
                        key={t.id}
                        href={`/glossary/${t.slug}`}
                        className="group p-5 rounded-2xl border border-zinc-100 dark:border-white/5 bg-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.08] hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                      >
                        <h3 className="text-sm font-bold text-zinc-800 dark:text-white group-hover:text-primary transition-colors mb-2">
                          {t.term}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-slate-400 line-clamp-2">
                          {t.shortDef}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </GlossaryInteractionProvider>
    </MemberContainer>
  );
}
