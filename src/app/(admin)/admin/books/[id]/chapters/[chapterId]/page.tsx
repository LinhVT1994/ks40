import { notFound } from 'next/navigation';
import { getBookAdminAction } from '@/features/admin/actions/book';
import ChapterEditorClient from '@/features/admin/components/ChapterEditorClient';

export default async function ChapterEditPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = await params;
  const book = await getBookAdminAction(id);
  if (!book) notFound();

  const isNew = chapterId === 'new';
  const chapter = isNew ? null : book.chapters.find(c => c.id === chapterId);

  if (!isNew && !chapter) notFound();

  return (
    <div className="flex-1 w-full h-full min-h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-zinc-50 dark:bg-slate-900">
      <ChapterEditorClient book={book} chapter={chapter || null} />
    </div>
  );
}
