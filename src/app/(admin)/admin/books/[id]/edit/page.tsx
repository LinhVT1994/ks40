import { notFound } from 'next/navigation';
import AdminHeader from '@/features/admin/components/AdminHeader';
import BookEditClient from '@/features/admin/components/BookEditClient';
import { getBookAdminAction } from '@/features/admin/actions/book';

export default async function BookEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookAdminAction(id);
  if (!book) notFound();

  return (
    <>
      <AdminHeader
        breadcrumb={[
          { label: 'Admin', href: '/admin/overview' },
          { label: 'Nội dung', href: '/admin/documents?tab=books' },
          { label: 'Sửa Lộ trình' },
        ]}
      />
      <div className="flex-1 p-6 md:p-8">
        <BookEditClient book={book} />
      </div>
    </>
  );
}
