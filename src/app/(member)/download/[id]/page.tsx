import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import DownloadClient from './DownloadClient';

export default async function DownloadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const resource = await db.resource.findUnique({
    where: { id },
    include: { article: { select: { audience: true } } },
  });

  if (!resource) notFound();

  const session = await auth();
  const isLoggedIn = !!session?.user;

  // Thành viên đã đăng nhập → redirect thẳng tới file
  if (isLoggedIn) {
    redirect(resource.url);
  }

  // Chỉ PUBLIC mới cho guest tải (với quảng cáo)
  if (resource.article.audience !== 'PUBLIC') {
    redirect(`/login?callbackUrl=/download/${id}`);
  }

  return (
    <DownloadClient
      resource={{
        id:       resource.id,
        name:     resource.name,
        url:      resource.url,
        size:     resource.size,
        mimeType: resource.mimeType,
      }}
    />
  );
}
