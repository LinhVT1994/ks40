'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { canAccessAudience } from '@/lib/access';

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

  // Keep stored files for recoverable retention; never unlink a path taken from a DB URL.
  // Removing the package revokes access through the authorized download endpoint.

  await db.sharedPackage.delete({ where: { id } });
  revalidatePath('/admin/shares');
  return { success: true };
}

const EXTEND_DAYS = { '1d': 1, '7d': 7, '30d': 30 } as const;
export type ExtendOption = keyof typeof EXTEND_DAYS | 'never';

export async function extendSharedPackageAction(id: string, extendBy: ExtendOption) {
  await requireAdmin();
  if (extendBy !== 'never' && !Object.hasOwn(EXTEND_DAYS, extendBy)) return { success: false as const };
  const pkg = await db.sharedPackage.findUnique({ where: { id }, select: { expiresAt: true } });
  if (!pkg) return { success: false as const };

  let expiresAt: Date | null = null;
  if (extendBy !== 'never') {
    // Still active → extend from current expiry; expired → extend from now.
    const now = Date.now();
    const base = pkg.expiresAt && pkg.expiresAt.getTime() > now ? pkg.expiresAt.getTime() : now;
    expiresAt = new Date(base + EXTEND_DAYS[extendBy] * 24 * 60 * 60 * 1000);
  }

  await db.sharedPackage.update({ where: { id }, data: { expiresAt } });
  revalidatePath('/admin/shares');
  return { success: true as const, expiresAt };
}

export async function incrementPackageDownloadAction(slug: string) {
  const session = await auth();
  const pkg = await db.sharedPackage.findUnique({ where: { slug } });
  if (!pkg || (pkg.expiresAt && pkg.expiresAt <= new Date()) || !canAccessAudience(pkg.audience, session?.user?.role)) return;
  await db.sharedPackage.update({
    where: { slug },
    data: { downloadCount: { increment: 1 } },
  });
}
