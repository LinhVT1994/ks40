'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChapterSidebar from '@/features/member/components/ChapterSidebar';
import ChapterReader from '@/features/member/components/ChapterReader';
import { saveChapterProgressAction } from '@/features/member/actions/book';

type Chapter = { id: string; title: string; slug: string; order: number; isFree: boolean };

type Props = {
  bookTitle: string;
  bookSlug: string;
  chapter: { id: string; title: string; slug: string; order: number; content: string; readTime: number };
  chapters: Chapter[];
  prev: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
  readChapterIds: string[];
};

export default function BookReaderWrapper({ bookTitle, bookSlug, chapter, chapters, prev, next, readChapterIds }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const savedRef = useRef(false);

  // Auto-save progress when user scrolls near bottom
  useEffect(() => {
    savedRef.current = readChapterIds.includes(chapter.id);

    const onScroll = () => {
      if (savedRef.current) return;
      const el = document.documentElement;
      const scrolled = el.scrollTop + el.clientHeight;
      const total = el.scrollHeight;
      if (total > 0 && scrolled / total >= 0.85) {
        savedRef.current = true;
        saveChapterProgressAction(chapter.id);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [chapter.id, readChapterIds]);

  const chaptersWithCompletion = chapters.map(c => ({
    ...c,
    isCompleted: readChapterIds.includes(c.id),
  }));

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white dark:bg-slate-950">
      <div className={`h-full shrink-0 transition-all duration-300 ease-in-out border-r border-slate-100 dark:border-white/5 ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'}`}>
        <ChapterSidebar
          bookTitle={bookTitle}
          bookSlug={bookSlug}
          chapters={chaptersWithCompletion}
          activeChapterSlug={chapter.slug}
        />
      </div>
      <ChapterReader
        bookSlug={bookSlug}
        chapter={chapter}
        prevChapter={prev}
        nextChapter={next}
      />
    </div>
  );
}
