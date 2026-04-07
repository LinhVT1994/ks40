import AdminHeader from '@/features/admin/components/AdminHeader';
import BookCreateClient from '@/features/admin/components/BookCreateClient';

export default function BookCreatePage() {
  return (
    <>
      <AdminHeader
        breadcrumb={[
          { label: 'Admin', href: '/admin/overview' },
          { label: 'Nội dung', href: '/admin/documents?tab=books' },
          { label: 'Thêm Lộ trình mới' },
        ]}
      />
      <div className="flex-1 p-6 md:p-8">
        <BookCreateClient />
      </div>
    </>
  );
}
