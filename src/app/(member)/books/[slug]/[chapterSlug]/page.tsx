import { notFound } from 'next/navigation';
import { getChapterAction } from '@/features/member/actions/book';
import { parseHeadings } from '@/lib/slugify';
import ChapterReaderLayout from '@/features/member/components/ChapterReaderLayout';

export default async function BookReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapterSlug: string }>;
}) {
  const { slug, chapterSlug } = await params;

  notFound(); // tạm thời tắt — xóa dòng này để bật lại
  const data = await getChapterAction(slug, chapterSlug);
  if (!data) notFound();

  const { book, chapter, chapters, prev, next, readChapterIds } = data!;

  const headings = chapter.content ? parseHeadings(chapter.content) : [];

  const chaptersWithCompletion = chapters.map((c: typeof chapters[number]) => ({
    ...c,
    isCompleted: readChapterIds.includes(c.id),
  }));

  return (
    <ChapterReaderLayout
      book={{ ...book, chapters: chaptersWithCompletion }}
      currentChapter={chapter}
      prevChapter={prev ?? null}
      nextChapter={next ?? null}
      headings={headings}
    />
  );
}
