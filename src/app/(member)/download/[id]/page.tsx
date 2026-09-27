import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { canDownloadArticle } from '@/lib/access';
export const metadata = { robots: { index: false, follow: false } };
import DownloadClient from './DownloadClient';

export default async function DownloadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const resource = await db.resource.findUnique({
    where: { id },
    include: { article: { select: { audience: true, status: true } } },
  });

  if (!resource) notFound();

  const session = await auth();
  const isLoggedIn = !!session?.user;

  // Chỉ PUBLIC mới cho guest tải (với quảng cáo)
  if (!isLoggedIn && resource.article.audience !== 'PUBLIC') {
    redirect(`/login?callbackUrl=/download/${id}`);
  }
  if (!canDownloadArticle(resource.article, session?.user?.role)) notFound();

  return (
    <DownloadClient
      resource={{
        id:       resource.id,
        name:     resource.name,
        url:      `/api/download/resource/${resource.id}`,
        size:     resource.size,
        mimeType: resource.mimeType,
      }}
      initialReady={isLoggedIn}
    />
  );
}
