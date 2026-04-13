import AdminHeader from '@/features/admin/components/AdminHeader';
import { getSharedPackagesAction } from '@/features/admin/actions/share';
import SharesClient from './SharesClient';

export default async function SharesPage() {
  const packages = await getSharedPackagesAction();

  return (
    <>
      <AdminHeader
        breadcrumb={[
          { label: 'Admin', href: '/admin/overview' },
          { label: 'Chia sẻ file' },
        ]}
      />
      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-white font-display">Chia sẻ file</h1>
          <p className="text-sm text-zinc-500 mt-1">Tạo gói tài liệu với nhiều file và chia sẻ bằng một link.</p>
        </div>
        <SharesClient initialPackages={packages as any} />
      </div>
    </>
  );
}
