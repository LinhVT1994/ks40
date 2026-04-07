'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { ActivityType } from '@prisma/client';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') throw new Error('Unauthorized');
}

export async function getRecentActivityAction({ limit = 5 }: { limit?: number } = {}) {
  await requireAdmin();
  try {
    return await db.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { actor: { select: { name: true, image: true, email: true } } },
    });
  } catch {
    return [];
  }
}

export async function getActivitiesAction({
  page = 1,
  limit = 25,
  type,
  q,
}: {
  page?: number;
  limit?: number;
  type?: string;
  q?: string;
} = {}) {
  await requireAdmin();

  const where = {
    ...(type && type !== 'all' ? { type: type as ActivityType } : {}),
    ...(q?.trim()
      ? {
          OR: [
            { message: { contains: q.trim(), mode: 'insensitive' as const } },
            { actor: { name: { contains: q.trim(), mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [activities, total] = await Promise.all([
    db.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { actor: { select: { name: true, image: true, email: true } } },
    }),
    db.activity.count({ where }),
  ]);

  return { activities, total, pages: Math.ceil(total / limit), page };
}
