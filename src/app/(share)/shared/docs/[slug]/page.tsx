import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import ShareDownloadClient from './ShareDownloadClient';

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const pkg = await db.sharedPackage.findUnique({
    where: { slug },
    include: {
      uploadedBy: { select: { name: true } },
      files: { select: { id: true, name: true, url: true, size: true, mimeType: true } },
    },
  });

  if (!pkg) notFound();

  if (pkg.expiresAt && new Date(pkg.expiresAt) < new Date()) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">Link đã hết hạn</p>
          <p className="text-slate-400 text-sm">Gói tài liệu này không còn khả dụng.</p>
        </div>
      </div>
    );
  }

  const session = await auth();
  const isLoggedIn = !!session?.user;
  const role = (session?.user as { role?: string })?.role ?? '';

  // Kiểm tra quyền truy cập
  const canAccess =
    pkg.audience === 'PUBLIC' ||
    (pkg.audience === 'MEMBERS' && isLoggedIn) ||
    (pkg.audience === 'PREMIUM' && (role === 'PREMIUM' || role === 'ADMIN')) ||
    (pkg.audience === 'PRIVATE' && role === 'ADMIN');

  if (!canAccess) {
    if (!isLoggedIn) redirect(`/login?callbackUrl=/shared/docs/${slug}`);
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">Không có quyền truy cập</p>
          <p className="text-slate-400 text-sm">Bạn cần tài khoản phù hợp để tải gói tài liệu này.</p>
        </div>
      </div>
    );
  }

  return (
    <ShareDownloadClient
      pkg={{
        slug:        pkg.slug,
        title:       pkg.title,
        description: pkg.description,
        audience:    pkg.audience,
        uploadedBy:  pkg.uploadedBy,
        files:       pkg.files,
      }}
      isLoggedIn={isLoggedIn}
    />
  );
}
