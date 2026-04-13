'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, BookOpen, Clock, Check, Copy } from 'lucide-react';
import dynamic from 'next/dynamic';
const MarkdownViewer = dynamic(() => import('@/components/shared/MarkdownViewer'), { ssr: false });

type ChapterReaderProps = {
  bookSlug: string;
  chapter: {
    title: string;
    content: string;
    order: number;
    readTime: number;
  };
  prevChapter?: { title: string; slug: string } | null;
  nextChapter?: { title: string; slug: string } | null;
};

export default function ChapterReader({ bookSlug, chapter, prevChapter, nextChapter }: ChapterReaderProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 w-full relative">
      {/* Content Area */}
      <main className="flex-1 w-full flex justify-center">
        <div
          className="w-full max-w-3xl px-6 py-8 md:py-16 pb-32"
          data-focus-prose="true"
        >
          {/* Top Navigation */}
          <div data-focus-hide className="mb-12 space-y-6">
            <Link
              href={`/books/${bookSlug}`}
              className="group hidden lg:inline-flex items-center gap-2.5 text-zinc-500 hover:text-primary transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quay lại lộ trình</span>
            </Link>

            {/* Breadcrumb mapping internal flow */}
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">
              <BookOpen className="w-4 h-4" />
              <span>Learning Path</span>
              <ChevronRight className="w-3 h-3 text-zinc-300" />
              <span className="text-zinc-500">Section {Math.ceil(chapter.order / 3)}</span>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-zinc-800 dark:text-white font-display mb-10 leading-tight tracking-tight">
            {chapter.title}
          </h2>

          <div className="prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-display prose-headings:font-black
            prose-p:text-lg prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-p:text-slate-400
            prose-pre:bg-zinc-50 dark:prose-pre:bg-zinc-900 prose-pre:rounded-[2rem] prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-white/10
            prose-img:rounded-[2.5rem] prose-img:shadow-2xl
            selection:bg-primary/20 selection:text-primary
          ">
            {chapter.content
              ? <MarkdownViewer content={chapter.content} />
              : (
                <div className="py-20 text-center text-zinc-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Nội dung chương này chưa được mở khóa.</p>
                </div>
              )
            }
          </div>

          {/* Navigation Footer - Refined Minimalist Design */}
          <div data-focus-hide className="mt-32 pt-16 border-t border-zinc-200 dark:border-white/5 flex flex-col md:flex-row items-center gap-10">
            {prevChapter ? (
              <Link
                href={`/books/${bookSlug}/${prevChapter.slug}`}
                className="flex-1 group flex flex-col items-start gap-4 transition-all duration-300"
              >
                <div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] group-hover:text-primary transition-colors">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-200 dark:border-white/5 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary transition-all transform group-hover:-translate-x-1">
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                  Chương trước
                </div>
                <span className="text-xl font-black text-zinc-800 dark:text-white tracking-tight pl-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">{prevChapter.title}</span>
              </Link>
            ) : <div className="flex-1" />}

            <div className="hidden md:block w-px h-16 bg-zinc-100 dark:bg-white/5" />

            {nextChapter ? (
              <Link
                href={`/books/${bookSlug}/${nextChapter.slug}`}
                className="flex-1 group flex flex-col items-end gap-4 transition-all duration-300"
              >
                <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.3em] transition-colors">
                  Chương tiếp theo
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 group-hover:shadow-primary/40 transition-all transform group-hover:translate-x-1 group-hover:scale-110">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-xl font-black text-zinc-800 dark:text-white text-right tracking-tight pr-2 opacity-80 group-hover:opacity-100 group-hover:-translate-x-1 transition-all">{nextChapter.title}</span>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </div>
      </main>
    </div>
  );
}
