import { notFound } from 'next/navigation';
import AdminHeader from '@/features/admin/components/AdminHeader';
import BookEditorClient from '@/features/admin/components/BookEditorClient';
import { getBookAdminAction } from '@/features/admin/actions/book';

export default async function BookChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookAdminAction(id);
  if (!book) notFound();

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <AdminHeader
        breadcrumb={[
          { label: 'Admin', href: '/admin/overview' },
          { label: 'Nội dung', href: '/admin/documents?tab=books' },
          { label: book.title },
          { label: 'Sửa Chapters' },
        ]}
      />
      <div className="flex-1 p-6 md:p-8">
        <BookEditorClient book={book} />
      </div>
    </div>
  );
}
