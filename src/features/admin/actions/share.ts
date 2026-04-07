'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { unlink } from 'fs/promises';
import path from 'path';

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== 'ADMIN') throw new Error('Unauthorized');
  return session!.user!;
}

export async function getSharedPackagesAction() {
  await requireAdmin();
  return db.sharedPackage.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { name: true } },
      files: { select: { id: true, name: true, size: true, mimeType: true } },
    },
  });
}

export async function deleteSharedPackageAction(id: string) {
  await requireAdmin();
  const pkg = await db.sharedPackage.findUnique({
    where: { id },
    include: { files: true },
  });
  if (!pkg) return { success: false };

  for (const file of pkg.files) {
    try {
      await unlink(path.join(process.cwd(), 'public', file.url));
    } catch { /* đã bị xóa */ }
  }

  await db.sharedPackage.delete({ where: { id } });
  revalidatePath('/admin/shares');
  return { success: true };
}

export async function incrementPackageDownloadAction(slug: string) {
  await db.sharedPackage.update({
    where: { slug },
    data: { downloadCount: { increment: 1 } },
  });
}
