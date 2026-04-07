import AdminHeader from '@/features/admin/components/AdminHeader';
import CommentsClient from '@/features/admin/components/CommentsClient';
import { getAdminCommentsAction } from '@/features/admin/actions/comment';
import { CommentStatus } from '@prisma/client';

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; sort?: string; page?: string }>;
}) {
  const params  = await searchParams;
  const page    = Number(params.page ?? 1);
  const search  = params.search?.trim();
  const status  = params.status as CommentStatus | undefined;
  const sort    = (params.sort === 'oldest' ? 'oldest' : 'newest') as 'newest' | 'oldest';

  const { comments, total, totalPages, counts } = await getAdminCommentsAction({
    search, status, sort, page, limit: 10,
  });

  return (
    <>
      <AdminHeader breadcrumb={[{ label: 'Admin', href: '/admin/overview' }, { label: 'Bình luận' }]} />
      <CommentsClient
        comments={comments}
        total={total}
        totalPages={totalPages}
        currentPage={page}
        currentSort={sort}
        counts={counts}
      />
    </>
  );
}
